// src/routes/mcp/index.ts

import { requireMcpAuth } from "@better-auth/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AUTH_BASE_URL, createAuth, MCP_RESOURCE } from "#/lib/auth/auth";
import { categoryIdEnum } from "#/lib/db/schema/memory-schema";
import {
	appendMemory,
	deleteMemory,
	listMemories,
	readMemory,
	searchMemories,
	strReplaceMemory,
	writeMemory,
} from "#/lib/server/memory-mcp";

async function toolResult(fn: () => Promise<unknown>) {
	try {
		const result = await fn();
		return { content: [{ type: "text" as const, text: typeof result === "string" ? result : JSON.stringify(result) }] };
	} catch (error) {
		return {
			content: [{ type: "text" as const, text: error instanceof Error ? error.message : String(error) }],
			isError: true,
		};
	}
}

function createMCPServer(userId: string): McpServer {
	const server = new McpServer(
		{
			name: "memory-harness",
			version: "1.0.0",
		},
		{ instructions: "centerlized memory mcp" },
	);

	server.registerTool(
		"memory_read",
		{
			title: "Read Memory",
			description: "Fetch the full content of one memory entry by its exact path.",
			inputSchema: {
				path: z.string().describe("Path of the memory entry, e.g. you/preferences.md"),
			},
		},
		async ({ path }) => toolResult(() => readMemory(userId, { path })),
	);

	server.registerTool(
		"memory_write",
		{
			title: "Write Memory",
			description:
				'Create a new memory entry or overwrite an existing one at a given path (upsert). Pass if_version: "new" to create, or the current version number to overwrite. There is no delete for retiring content — overwrite with a short pointer to its replacement instead.',
			inputSchema: {
				path: z.string().describe("Path of the memory entry, e.g. you/preferences.md"),
				content: z.string().describe("Full content to store"),
				categoryId: z.enum(categoryIdEnum.enumValues).describe("Must match the path's leading segment"),
				description: z.string().describe("Short summary of this entry"),
				if_version: z
					.union([z.number().int().positive(), z.literal("new")])
					.describe('The version you expect to overwrite, or "new" to create'),
			},
		},
		async ({ path, content, categoryId, description, if_version }) =>
			toolResult(async () => {
				const row = await writeMemory(userId, { path, content, categoryId, description, if_version });
				return `Wrote ${row.path} (version ${row.version})`;
			}),
	);

	server.registerTool(
		"memory_append",
		{
			title: "Append to Memory",
			description: "Add a line to the end of an existing memory entry's content.",
			inputSchema: {
				path: z.string().describe("Path of the memory entry"),
				content: z.string().describe("Text to append"),
				if_version: z.number().int().positive().describe("The version you expect to append to"),
			},
		},
		async ({ path, content, if_version }) =>
			toolResult(async () => {
				const row = await appendMemory(userId, { path, content, if_version });
				return `Appended to ${row.path} (version ${row.version})`;
			}),
	);

	server.registerTool(
		"memory_str_replace",
		{
			title: "Replace in Memory",
			description: "Replace an exact, uniquely-occurring substring within an existing memory entry's content.",
			inputSchema: {
				path: z.string().describe("Path of the memory entry"),
				old_str: z.string().min(1).describe("Exact text to find; must occur exactly once"),
				new_str: z.string().describe("Replacement text"),
				if_version: z.number().int().positive().describe("The version you expect to modify"),
			},
		},
		async ({ path, old_str, new_str, if_version }) =>
			toolResult(async () => {
				const row = await strReplaceMemory(userId, { path, old_str, new_str, if_version });
				return `Updated ${row.path} (version ${row.version})`;
			}),
	);

	server.registerTool(
		"memory_list",
		{
			title: "List Memories",
			description: "List memory entries (path, name, description), optionally filtered by category or path prefix.",
			inputSchema: {
				categoryId: z.enum(categoryIdEnum.enumValues).optional(),
				pathPrefix: z.string().optional(),
				cursor: z.string().optional().describe("Pass the previous response's nextCursor to page forward"),
				limit: z.number().int().positive().max(200).default(50),
			},
		},
		async ({ categoryId, pathPrefix, cursor, limit }) =>
			toolResult(() => listMemories(userId, { categoryId, pathPrefix, cursor, limit })),
	);

	server.registerTool(
		"memory_delete",
		{
			title: "Delete Memory",
			description:
				"Soft-delete a memory entry. Prefer memory_write to retire content by overwriting it with a pointer instead, unless the entry is simply wrong.",
			inputSchema: {
				path: z.string().describe("Path of the memory entry"),
				if_version: z.number().int().positive().describe("The version you expect to delete"),
			},
		},
		async ({ path, if_version }) =>
			toolResult(async () => {
				const row = await deleteMemory(userId, { path, if_version });
				return `Deleted ${row.path}`;
			}),
	);

	server.registerTool(
		"memory_search",
		{
			title: "Search Memory",
			description: "Full-text search across memory entries' name, description, and content.",
			inputSchema: {
				query: z.string().min(1),
				categoryId: z.enum(categoryIdEnum.enumValues).optional(),
				limit: z.number().int().positive().max(50).default(10),
			},
		},
		async ({ query, categoryId, limit }) => toolResult(() => searchMemories(userId, { query, categoryId, limit })),
	);

	return server;
}

function getHandleMcpRequest() {
	const auth = createAuth();
	return requireMcpAuth(
		auth,
		async (request, accessTokenClaims) => {
			if (!accessTokenClaims.sub) throw new Error("access token missing sub claim");

			const transport = new WebStandardStreamableHTTPServerTransport({
				sessionIdGenerator: undefined,
			});
			const server = createMCPServer(accessTokenClaims.sub);
			await server.connect(transport);
			return transport.handleRequest(request);
		},
		{
			resource: MCP_RESOURCE,
			issuer: AUTH_BASE_URL,
			// Cloudflare Workers can't fetch a worker's own *.workers.dev URL (no
			// origin to route the subrequest through), so resolve the JWKS
			// in-process instead of over HTTP. better-auth resolves a function
			// here at runtime even though the public type only advertises a URL
			// string.
			jwksUrl: (() => auth.api.getJwks()) as unknown as string,
		},
	);
}

export const Route = createFileRoute("/mcp/")({
	server: {
		handlers: {
			POST: async ({ request }) => getHandleMcpRequest()(request),
		},
	},
});
