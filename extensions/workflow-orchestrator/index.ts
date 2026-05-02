import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

// Bust local CommonJS require-cache so /reload picks up src/*.js changes.
for (const modulePath of ["./src/setup", "./src/commands", "./src/config", "./src/audit", "./src/auto", "./src/prompts", "./src/evaluator", "./src/handoff", "./src/state"]) {
	try { delete require.cache[require.resolve(modulePath)]; } catch {}
}

function freshRequire(modulePath: string) {
	const resolved = require.resolve(modulePath);
	delete require.cache[resolved];
	return require(modulePath);
}

const commands = freshRequire("./src/commands");
const { getProjectRoot, loadConfig, saveConfig } = freshRequire("./src/config");
const { appendAuditEntry } = freshRequire("./src/audit");
const { latestAssistantMarkdown, planAutoContinuation } = freshRequire("./src/auto");
const { buildWorkflowSystemPrompt } = freshRequire("./src/prompts");

export default function workflowOrchestratorExtension(pi: ExtensionAPI) {

	function createWorkflowEnv(ctx: any) {
		return commands.createCommandEnv(ctx, pi);
	}

	function touchesProjectMapMarkdown(event: any) {
		const toolName = event.toolName;
		const input = event.input || {};
		if ((toolName === "write" || toolName === "edit") && typeof input.path === "string") {
			return /(^|\/)\.pi\/project-map\/.*\.md$/.test(input.path);
		}
		if (toolName === "bash") {
			const cmd = input.command || "";
			return /\.pi\/project-map\/[^\s;&|]*\.md/.test(cmd) && /(^|\s)(printf|echo|tee|python3?|node|touch|rm|mv|cp)\b|>|>>/.test(cmd);
		}
		return false;
	}

	pi.registerCommand("workflow:init", {
		description: "Set up this project: choose mode (auto/human-in-the-loop), theme, thinking level, compaction and retry",
		handler: async (args, ctx) => {
			await commands.handleInit(args, createWorkflowEnv(ctx));
		},
	});

	pi.registerCommand("workflow:continue", {
		description: "Continue to the suggested next skill, or resume after a pause",
		handler: async (args, ctx) => {
			await commands.handleContinue(args, createWorkflowEnv(ctx));
		},
	});

	pi.registerCommand("workflow:pause", {
		description: "Pause the active workflow",
		handler: async (args, ctx) => {
			await commands.handlePause(args, createWorkflowEnv(ctx));
		},
	});

	pi.registerCommand("workflow:start", {
		description: "Start a new workflow: pick a skill and set a goal, then launch it",
		handler: async (args, ctx) => {
			await commands.handleStart(args, createWorkflowEnv(ctx));
		},
	});

	pi.registerCommand("workflow:status", {
		description: "Show current workflow state",
		handler: async (args, ctx) => {
			await commands.handleStatus(args, createWorkflowEnv(ctx));
		},
	});

	pi.registerCommand("workflow:debug", {
		description: "Show last handoff parse, evaluator decision, stop conditions, and transitions",
		handler: async (args, ctx) => {
			const env = createWorkflowEnv(ctx);
			env.getBranch = () => ctx.sessionManager.getBranch?.() || [];
			await commands.handleDebug(args, env);
		},
	});

	// Restore workflow state on session start/reload
	pi.on("session_start", async (_event, ctx) => {
		try {
			const projectRoot = getProjectRoot(ctx.cwd);
			const loaded = loadConfig(projectRoot);
			if (!loaded.ok) return;
			const active = loaded.config.active_workflow;
			if (active?.id) {
				const goalSuffix = active.goal ? ` (goal: ${active.goal})` : "";
				const pauseSuffix = active.paused ? " [PAUSED]" : "";
				ctx.ui.notify(`Active workflow: ${active.id}${goalSuffix}${pauseSuffix}. Next: ${active.next_skill || "(none)"}.`, "info");
			}
		} catch {}
	});

	// Inject active workflow context into system prompt
	pi.on("before_agent_start", async (_event, ctx) => {
		try {
			const projectRoot = getProjectRoot(ctx.cwd);
			const loaded = loadConfig(projectRoot);
			if (!loaded.ok) return;
			const block = buildWorkflowSystemPrompt(loaded.config);
			if (block) {
				return { systemPrompt: _event.systemPrompt + "\n\n" + block };
			}
		} catch {}
	});

	// Defensive config save on session shutdown
	pi.on("session_shutdown", async (_event, ctx) => {
		try {
			const projectRoot = getProjectRoot(ctx.cwd);
			const loaded = loadConfig(projectRoot);
			if (loaded.ok) {
				saveConfig(projectRoot, loaded.config);
			}
		} catch {}
	});

	// Stale-context and project-map edit guard
	pi.on("tool_call", async (event, ctx) => {
		const path = require("node:path");
		const projectRoot = getProjectRoot(ctx.cwd);
		const cmd = event.input?.command || "";

		if (touchesProjectMapMarkdown(event)) {
			ctx.ui.notify("Project-map markdown edited directly. Prefer /skill:project-intake for context refreshes.", "warning");
		}

		if (event.toolName !== "bash" || !/\bgit\s+push\b/.test(cmd)) return;
		const guidancePath = path.join(projectRoot, ".pi", "project-map", "agent-guidance.md");
		const staleness = commands.projectMapStaleness(projectRoot, guidancePath);
		if (staleness.stale) {
			ctx.ui.notify(`Project context may be stale: ${staleness.reason}. Consider /skill:project-intake.`, "warning");
		}
	});

	// Core: evaluate every agent response for a workflow handoff
	pi.on("agent_end", async (event, ctx) => {
		const projectRoot = getProjectRoot(ctx.cwd);
		const loaded = loadConfig(projectRoot);
		if (!loaded.ok) return;

		const markdown = latestAssistantMarkdown(event.messages || []);
		const entryId = ctx.sessionManager.getLeafId?.() || undefined;
		const result = planAutoContinuation({ config: loaded.config, markdown, entryId });

		if (result.action === "none") return;

		saveConfig(projectRoot, result.config);
		const artifactLog = result.artifactLog || result.config.active_workflow?.artifact_log;
		if (artifactLog && result.audit) {
			appendAuditEntry(projectRoot, artifactLog, result.audit);
		}

		if (result.action === "continue" && result.prompt) {
			ctx.ui.notify(`Auto-continuing: ${result.nextSkill}`, "info");
			pi.sendUserMessage(result.prompt, { deliverAs: "followUp" });
			return;
		}

		if (result.action === "suggest" && result.prompt) {
			const goalSuffix = loaded.config.active_workflow?.goal ? ` (goal: ${loaded.config.active_workflow.goal})` : "";
			ctx.ui.notify(`Suggested next skill: ${result.nextSkill}${goalSuffix}. Run /workflow:continue when ready.`, "info");
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
