import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

function freshRequire(modulePath: string) {
	const resolved = require.resolve(modulePath);
	delete require.cache[resolved];
	return require(modulePath);
}

// Pi hot-reloads index.ts, but CommonJS src modules can remain in Node's require cache.
// Bust local module cache so /reload picks up command and handler changes.
for (const modulePath of ["./src/setup", "./src/commands", "./src/config", "./src/audit", "./src/auto"]) {
	try {
		delete require.cache[require.resolve(modulePath)];
	} catch {}
}

const commands = freshRequire("./src/commands");
const { getProjectRoot, loadConfig, saveConfig } = freshRequire("./src/config");
const { appendAuditEntry } = freshRequire("./src/audit");
const { latestAssistantMarkdown, planAutoContinuation } = freshRequire("./src/auto");

export default function workflowOrchestratorExtension(pi: ExtensionAPI) {
	// Flag: tracks whether the current agent turn was triggered by a workflow skill invocation
	let pendingWorkflowSkillResponse = false;
	const projectMapRefreshMarkers = new Set<string>();

	function markProjectMapRefresh(ctx: any) {
		projectMapRefreshMarkers.add(getProjectRoot(ctx.cwd));
	}

	function touchesProjectMapMarkdown(event: any) {
		const toolName = event.toolName;
		const input = event.input || {};
		if ((toolName === "write" || toolName === "edit") && typeof input.path === "string") {
			return /(^|\/)\.pi\/project-map\/.*\.md$/.test(input.path);
		}
		if (toolName === "bash") {
			const cmd = input.command || "";
			return /\.pi\/project-map\/[^\s;&|]*\.md/.test(cmd) && /(^|\s)(printf|echo|cat|tee|python3?|node|touch|rm|mv|cp)\b|>|>>/.test(cmd);
		}
		return false;
	}

	// Helper: send a skill prompt and set the flag
	function sendWorkflowSkillPrompt(prompt: string) {
		pendingWorkflowSkillResponse = true;
		pi.sendUserMessage(prompt, { deliverAs: "followUp" });
	}

	// Create command env that uses the flagged sender for workflow prompts
	function createWorkflowEnv(ctx: any) {
		return {
			...commands.createCommandEnv(ctx, pi),
			sendUserMessage: (message: string, options?: any) => {
				pendingWorkflowSkillResponse = true;
				pi.sendUserMessage(message, options);
			},
		};
	}

	pi.registerCommand("my-pi:setup", {
		description: "Configure my-pi theme and pi settings",
		handler: async (args, ctx) => {
			await commands.handlePiSetup(args, commands.createCommandEnv(ctx, pi));
		},
	});

	pi.registerCommand("workflow:init", {
		description: "Initialize workflow orchestrator config for this project",
		handler: async (args, ctx) => {
			await commands.handleInit(args, commands.createCommandEnv(ctx, pi));
		},
	});

	pi.registerCommand("workflow:upgrade-config", {
		description: "Upgrade this project's workflow config to the current default shape",
		handler: async (args, ctx) => {
			await commands.handleUpgradeConfig(args, commands.createCommandEnv(ctx, pi));
		},
	});

	pi.registerCommand("workflow:status", {
		description: "Show workflow orchestrator status",
		handler: async (args, ctx) => {
			await commands.handleStatus(args, commands.createCommandEnv(ctx, pi));
		},
	});

	pi.registerCommand("workflow:start", {
		description: "Start a workflow: /workflow:start [auto|user-in-the-loop] <goal>",
		handler: async (args, ctx) => {
			await commands.handleStart(args, createWorkflowEnv(ctx));
		},
	});

	pi.registerCommand("workflow:auto", {
		description: "Start a workflow in auto mode",
		handler: async (args, ctx) => {
			await commands.handleStart(args, createWorkflowEnv(ctx), "auto");
		},
	});

	pi.registerCommand("workflow:manual", {
		description: "Start a workflow in user-in-the-loop mode",
		handler: async (args, ctx) => {
			await commands.handleStart(args, createWorkflowEnv(ctx), "user-in-the-loop");
		},
	});

	pi.registerCommand("workflow:onboard", {
		description: "Onboard/map an existing codebase with graphify-first project intake",
		handler: async (args, ctx) => {
			markProjectMapRefresh(ctx);
			await commands.handleOnboard(args, createWorkflowEnv(ctx));
		},
	});

	pi.registerCommand("workflow:refresh", {
		description: "Refresh the project map after codebase changes",
		handler: async (args, ctx) => {
			markProjectMapRefresh(ctx);
			await commands.handleRefresh(args, createWorkflowEnv(ctx));
		},
	});

	pi.registerCommand("workflow:context", {
		description: "Show project-map context status",
		handler: async (args, ctx) => {
			await commands.handleContext(args, commands.createCommandEnv(ctx, pi));
		},
	});

	pi.registerCommand("workflow:continue", {
		description: "Continue the active workflow",
		handler: async (args, ctx) => {
			await commands.handleContinue(args, createWorkflowEnv(ctx));
		},
	});

	pi.registerCommand("workflow:pause", {
		description: "Pause the active workflow",
		handler: async (args, ctx) => {
			await commands.handlePause(args, commands.createCommandEnv(ctx, pi));
		},
	});

	pi.registerCommand("workflow:resume", {
		description: "Resume the active workflow without continuing it",
		handler: async (args, ctx) => {
			await commands.handleResume(args, commands.createCommandEnv(ctx, pi));
		},
	});

	// Warn when project context is stale or project-map files are edited without graphify-backed refresh.
	pi.on("tool_call", async (event, ctx) => {
		const path = require("node:path");
		const projectRoot = getProjectRoot(ctx.cwd);
		const cmd = event.input?.command || "";
		if (event.toolName === "bash" && /\b(graphify|workflow:refresh)\b/.test(cmd)) markProjectMapRefresh(ctx);

		if (touchesProjectMapMarkdown(event) && !projectMapRefreshMarkers.has(projectRoot)) {
			ctx.ui.notify("Project-map markdown is being edited without a graphify-backed refresh marker. Prefer /workflow:refresh for context refreshes.", "warning");
		}

		if (event.toolName !== "bash" || !/\bgit\s+push\b/.test(cmd)) return;
		const guidancePath = path.join(projectRoot, ".pi", "project-map", "agent-guidance.md");
		const staleness = commands.projectMapStaleness(projectRoot, guidancePath);
		if (staleness.stale) {
			ctx.ui.notify(`Project context (.pi/project-map/) may be stale: ${staleness.reason}. Consider /workflow:refresh.`, "warning");
		}
	});

	pi.on("agent_end", async (event, ctx) => {
		// Capture and clear the flag
		const isWorkflowSkillResponse = pendingWorkflowSkillResponse;
		pendingWorkflowSkillResponse = false;

		const projectRoot = getProjectRoot(ctx.cwd);
		const loaded = loadConfig(projectRoot);
		if (!loaded.ok) return;

		const markdown = latestAssistantMarkdown(event.messages || []);
		const entryId = ctx.sessionManager.getLeafId?.() || undefined;
		const result = planAutoContinuation({ config: loaded.config, markdown, entryId, isWorkflowSkillResponse });
		if (result.action === "none") return;

		saveConfig(projectRoot, result.config);
		const artifactLog = result.artifactLog || result.config.active_workflow?.artifact_log;
		if (artifactLog && result.audit) {
			appendAuditEntry(projectRoot, artifactLog, result.audit);
		}

		if (result.action === "continue" && result.prompt) {
			ctx.ui.notify(`Workflow auto-continuing with ${result.nextSkill}`, "info");
			sendWorkflowSkillPrompt(result.prompt);
			return;
		}

		if (result.action === "complete") {
			ctx.ui.notify(`Workflow complete: ${result.reason}`, "success");
			return;
		}

		if (result.action === "pause") {
			ctx.ui.notify(`Workflow paused: ${result.reason}`, "info");
		}
	});
}
