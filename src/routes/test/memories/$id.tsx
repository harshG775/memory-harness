// isolated testing do not use things outside from src/routes/test/ folder

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import Markdown from "#/components/markdown";
import { MemoryHeader } from "./-components/memory-header";

export const Route = createFileRoute("/test/memories/$id")({
	component: RouteComponent,
});
const memories = [
	{
		id: "cafd0eb5-db6a-4c98-bf6b-f429376f40b9",
		userId: "34uCny3fROyBu0EcBb9e9RG4l1SWTTkY",
		path: "you/_meta.md",
		sizeBytes: 570,
		categoryId: "you",
		isSingleton: false,
		kind: "toc",
		name: "_meta",
		description: "How the you/ folder is organized",
		content:
			'---\r\nname: "_meta"\r\ndescription: "How the you/ folder is organized"\r\nsources: []\r\naliases: []\r\n---\r\n\r\n# you/ folder\r\n\r\nFacts about Harsh, split into two fixed files: `preferences.md` and `profile.md`. These two do not gain siblings — do not create other files in this folder.\r\n\r\n- **preferences.md** — how Harsh likes the assistant to work.\r\n- **profile.md** — who Harsh is: role, goals, responsibilities.\r\n\r\n> Keep this file short. It is a table of contents, not a place for facts.\r\n\r\nSee [how frontmatter is parsed](#parsing) for the exact format each file uses.',
		version: 1,
		createdAt: "2026-09-16T09:16:34.832Z",
		updatedAt: "2026-09-16T09:16:34.832Z",
		deletedAt: null,
	},
	{
		id: "49ec0a10-92c6-46ec-a2dc-05a17e3e4f48",
		userId: "34uCny3fROyBu0EcBb9e9RG4l1SWTTkY",
		path: "you/preferences.md",
		sizeBytes: 570,
		categoryId: "you",
		isSingleton: true,
		kind: "entry",
		name: "preferences",
		description: "How Harsh likes the assistant to work",
		content:
			'---\r\nname: "preferences"\r\ndescription: "How Harsh likes the assistant to work"\r\nsources: ["stated"]\r\naliases: []\r\n---\r\n\r\n- Prefers ShadCN design tokens over hardcoded Tailwind colors [stated]\r\n- Wants clean production code without placeholders [stated]\r\n- Delegate boilerplate/repetitive work to AI; handle logic/architecture personally [stated]\r\n- Prefers inline code output over file attachments [stated]\r\n- Prefers surgical diffs over full rewrites [stated]\r\n- When learning a new technical topic, prefers to understand concepts first before writing any code [stated]',
		version: 1,
		createdAt: "2026-08-26T00:00:00.000Z",
		updatedAt: "2026-08-26T00:00:00.000Z",
		deletedAt: null,
	},
	{
		id: "337d3851-d90d-4bfc-9ed5-1cdd157c785a",
		userId: "34uCny3fROyBu0EcBb9e9RG4l1SWTTkY",
		path: "topics/toolchain.md",
		sizeBytes: 1256,
		categoryId: "topics",
		isSingleton: false,
		kind: "entry",
		name: "toolchain",
		description: "Preferred editors, package manager, and Linux setup",
		content:
			'---\r\nname: "toolchain"\r\ndescription: "Preferred editors, package manager, and Linux setup"\r\nsources: ["stated"]\r\naliases: []\r\n---\r\n\r\n## Editors & package manager\r\n\r\n- Preferred editors: Zed and Neovim (LazyVim) [stated]\r\n- Package manager: `pnpm` [stated]\r\n- Interest in Linux system administration across distributions like Fedora, Debian, and MX Linux [stated]\r\n- Runs Claude Code on Termux/Android using community workarounds (proot-distro Ubuntu, glibc-runner); PATH fix for `~/.local/bin` [stated]\r\n- Local LLM / portable AI workspace: llama.cpp (portable, no system service) on external SSD; Ryzen 7730U CPU-only inference; Qwen3 4B Q4_K_M model; dynamic model selection bat script [stated]\r\n- Obsidian vault for DSA/interview prep with Dataview/Templater [stated]\r\n\r\n## OpenRouter setup\r\n\r\nUses Claude Code routed through OpenRouter via `.claude/settings.json`:\r\n\r\n```bash\r\nANTHROPIC_BASE_URL=https://openrouter.ai/api\r\nANTHROPIC_API_KEY=\r\nANTHROPIC_AUTH_TOKEN=<OpenRouter key>\r\nCLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=1\r\nDISABLE_TELEMETRY=1\r\n```\r\n\r\n| Slot | Model slug |\r\n| --- | --- |\r\n| Opus | `nvidia/nemotron-3-ultra-550b-a55b:free` |\r\n| Sonnet | `nvidia/nemotron-3-nano-30b-a3b:free` |\r\n| Haiku | poolside Laguna coding models |\r\n\r\n[stated]',
		version: 1,
		createdAt: "2026-08-26T00:00:00.000Z",
		updatedAt: "2026-08-26T00:00:00.000Z",
		deletedAt: null,
	},
];
const memory = memories[2];

/** Splits the leading `---\n...\n---` frontmatter block from the body. */
function splitFrontMatter(raw: string): { frontmatter: string; body: string } {
	const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n+([\s\S]*)$/);
	if (!match) return { frontmatter: "", body: raw };
	const [, frontmatter, body] = match;
	return { frontmatter, body };
}

function RouteComponent() {
	const { frontmatter: fm, body: db } = splitFrontMatter(memory.content);
	const [isEditing, setIsEditing] = useState(false);
	const [frontmatter, setFrontmatter] = useState(fm);
	const [body, setBody] = useState(db);

	return (
		<div>
			<MemoryHeader
				memory={memory}
				isEditing={isEditing}
				onToggleEditing={() => setIsEditing((value) => !value)}
				onDelete={() => {}}
			/>
			<div className="max-w-4xl mx-auto p-4">
				{isEditing ? (
					<div className="space-y-4">
						<textarea
							data-slot="textarea"
							className="flex field-sizing-content min-h-16 w-full resize-none rounded-t-xl border border-transparent bg-input/50 px-3 py-3 text-base transition-[color,box-shadow,background-color] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
							value={frontmatter}
							onChange={(e) => setFrontmatter(e.target.value)}
						/>
						<textarea
							data-slot="textarea"
							className="flex field-sizing-content min-h-16 w-full resize-none rounded-b-xl border border-transparent bg-input/50 px-3 py-3 text-base transition-[color,box-shadow,background-color] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"
							value={body}
							onChange={(e) => setBody(e.target.value)}
						/>
					</div>
				) : (
					<div className="typeset">
						<pre>{frontmatter}</pre>
						<Markdown>{body}</Markdown>
					</div>
				)}
			</div>
		</div>
	);
}
