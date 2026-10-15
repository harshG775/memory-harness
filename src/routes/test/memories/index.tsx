import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/test/memories/")({
    loader: async ({ context }) => {
        return await context.queryClient.query({
            queryKey: ["memories"],
            queryFn: () => [
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
            ],
        });
    },
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div>
            <div>
                <div>all</div>
                <div>areas</div>
                <div>people</div>
                <div>sessions</div>
                <div>topics</div>
                <div>you</div>
            </div>
            <div>list</div>
        </div>
    );
}
