// src/routes/mcp/index.ts

import { requireMcpAuth } from "@better-auth/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getAuth, MCP_RESOURCE } from "#/lib/auth/auth";

function createMCPServer(): McpServer {
	const server = new McpServer(
		{
			name: "memory-harness",
			version: "1.0.0",
		},
		{ instructions: "centerlized memory mcp" },
	);

	server.registerTool(
		"memory_write",
		{
			title: "ping",
			description: "ping",
			inputSchema: {
				message: z.string().describe("ping {message}"),
			},
		},
		async ({ message }) => {
			return { content: [{ type: "text", text: `ping ${message}` }] };
		},
	);

	return server;
}

let _handleMcpRequest: ReturnType<typeof requireMcpAuth> | undefined;

function getHandleMcpRequest() {
	if (!_handleMcpRequest) {
		_handleMcpRequest = requireMcpAuth(
			getAuth(),
			async (request, accessTokenClaims) => {
				const transport = new WebStandardStreamableHTTPServerTransport({
					sessionIdGenerator: undefined,
				});
				const server = createMCPServer();
				await server.connect(transport);
				return transport.handleRequest(request);
			},
			{ resource: MCP_RESOURCE },
		);
	}
	return _handleMcpRequest;
}

export const Route = createFileRoute("/mcp/")({
	server: {
		handlers: {
			POST: async ({ request }) => getHandleMcpRequest()(request),
		},
	},
});
