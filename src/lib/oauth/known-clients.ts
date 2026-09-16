export const KNOWN_CLIENTS: Record<string, { logo: string; description: string }> = {
	claude: { logo: "/api/logos/claude", description: "Anthropic's AI assistant" },
	"claude code": { logo: "/api/logos/claude-code", description: "Anthropic's CLI for agentic coding" },
	chatgpt: { logo: "/api/logos/chatgpt", description: "OpenAI's ChatGPT" },
	cursor: { logo: "/api/logos/cursor", description: "AI code editor" },
	windsurf: { logo: "/api/logos/windsurf", description: "AI code editor" },
	"visual studio code": { logo: "/api/logos/vscode", description: "VS Code with GitHub Copilot" },
	jetbrains: { logo: "/api/logos/jetbrains", description: "JetBrains AI Assistant" },
	perplexity: { logo: "/api/logos/perplexity", description: "Perplexity AI" },
	warp: { logo: "/api/logos/warp", description: "Warp terminal" },
};

export function getKnownClient(name: string) {
	return KNOWN_CLIENTS[name.trim().toLowerCase()];
}

export const SCOPE_LABELS: Record<string, string> = {
	openid: "Verify it's you",
	profile: "View your name and profile info",
	email: "View your email address",
	offline_access: "Stay connected when you're not using the app",
};

export function describeScope(scope: string): string {
	return SCOPE_LABELS[scope] ?? `Access "${scope}"`;
}
