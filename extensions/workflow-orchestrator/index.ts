import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const commands = require("./src/commands");
const { getProjectRoot, loadConfig, saveConfig } = require("./src/config");
const { appendAuditEntry } = require("./src/audit");
const { latestAssistantMarkdown, planAutoContinuation } = require("./src/auto");

export default function workflowOrchestratorExtension(pi: ExtensionAPI) {
	pi.registerCommand("workflow:init", {
		description: "Initialize workflow orchestrator config for this project",
		handler: async (args, ctx) => {
			await commands.handleInit(args, commands.createCommandEnv(ctx, pi));
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
			await commands.handleStart(args, commands.createCommandEnv(ctx, pi));
		},
	});

	pi.registerCommand("workflow:auto", {
		description: "Start a workflow in auto mode",
		handler: async (args, ctx) => {
			await commands.handleStart(args, commands.createCommandEnv(ctx, pi), "auto");
		},
	});

	pi.registerCommand("workflow:manual", {
		description: "Start a workflow in user-in-the-loop mode",
		handler: async (args, ctx) => {
			await commands.handleStart(args, commands.createCommandEnv(ctx, pi), "user-in-the-loop");
		},
	});

	pi.registerCommand("workflow:onboard", {
		description: "Onboard/map an existing codebase with graphify-first project intake",
		handler: async (args, ctx) => {
			await commands.handleOnboard(args, commands.createCommandEnv(ctx, pi));
		},
	});

	pi.registerCommand("workflow:refresh", {
		description: "Refresh the project map after codebase changes",
		handler: async (args, ctx) => {
			await commands.handleRefresh(args, commands.createCommandEnv(ctx, pi));
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
			await commands.handleContinue(args, commands.createCommandEnv(ctx, pi));
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
			ctx.ui.notify(`Workflow auto-continuing with ${result.nextSkill}`, "info");
			pi.sendUserMessage(result.prompt, { deliverAs: "followUp" });
			return;
		}

		if (result.action === "pause") {
			ctx.ui.notify(`Workflow paused: ${result.reason}`, "info");
		}
	});
}
