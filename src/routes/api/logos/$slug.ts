import { createFileRoute } from "@tanstack/react-router";

const OFFICIAL_ICON_SOURCES: Record<string, string> = {
	claude: "https://claude.ai/favicon.svg",
	"claude-code": "https://claude.ai/favicon.svg",
	chatgpt: "https://openai.com/favicon.svg",
	cursor: "https://cursor.com/favicon.svg",
	windsurf: "https://windsurf.com/favicon.svg",
	vscode: "https://code.visualstudio.com/favicon.ico",
	jetbrains: "https://www.jetbrains.com/favicon.ico",
	perplexity: "https://perplexity.ai/favicon.svg",
	warp: "https://warp.dev/apple-touch-icon.png",
};

export const Route = createFileRoute("/api/logos/$slug")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const source = OFFICIAL_ICON_SOURCES[params.slug];
				if (!source) {
					return new Response("Not found", { status: 404 });
				}

				try {
					const upstream = await fetch(source, {
						headers: {
							"User-Agent": "Mozilla/5.0 (compatible; memory-harness-logo-proxy)",
						},
						signal: AbortSignal.timeout(5000),
					});

					if (!upstream.ok || !upstream.body) {
						return new Response("Upstream fetch failed", { status: 502 });
					}

					return new Response(upstream.body, {
						headers: {
							"Content-Type": upstream.headers.get("content-type") ?? "image/svg+xml",
							"Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
						},
					});
				} catch {
					return new Response("Upstream fetch failed", { status: 502 });
				}
			},
		},
	},
});
