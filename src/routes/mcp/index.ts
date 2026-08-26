// src/routes/mcp/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { createFileRoute } from "@tanstack/react-router"
import { requireMcpAuth } from "@better-auth/mcp"
import { join } from "node:path"
import { z } from "zod"
import { auth, MCP_RESOURCE } from "#/lib/auth"
import { ensureMemoryStructure, MEMORY_INSTRUCTIONS } from "#/lib/memory/generate-memory-structure"
import {
    appendMemoryFile,
    listMemoryEntries,
    MemoryFileNotFoundError,
    MemoryPathError,
    MemoryStrReplaceError,
    readMemoryFile,
    strReplaceMemoryFile,
    writeMemoryFile,
} from "#/lib/memory/fs"

const MEMORY_BASE = join(process.cwd(), ".mh")

const memoryPathSchema = z
    .string()
    .describe('Path to the memory file, relative to the memory root (e.g. "topics/react-hooks.md")')

function toolError(error: unknown): { content: [{ type: "text"; text: string }]; isError: true } {
    const text =
        error instanceof MemoryPathError ||
        error instanceof MemoryFileNotFoundError ||
        error instanceof MemoryStrReplaceError
            ? error.message
            : `Unexpected error: ${error instanceof Error ? error.message : String(error)}`
    return { content: [{ type: "text", text }], isError: true }
}

function createMCPServer(memoriesRoot: string): McpServer {
    const server = new McpServer(
        {
            name: "memory-harness",
            version: "1.0.0",
        },
        { instructions: MEMORY_INSTRUCTIONS },
    )

    server.registerTool(
        "memory_write",
        {
            title: "Write memory file",
            description:
                "Create or overwrite a memory file with the given content, creating parent directories as needed.",
            inputSchema: {
                path: memoryPathSchema,
                content: z.string().describe("Full content to write to the file, replacing anything already there"),
            },
        },
        async ({ path, content }) => {
            try {
                await writeMemoryFile(memoriesRoot, path, content)
                return { content: [{ type: "text", text: `Wrote ${path}` }] }
            } catch (error) {
                return toolError(error)
            }
        },
    )

    server.registerTool(
        "memory_append",
        {
            title: "Append to memory file",
            description:
                "Append content to the end of an existing memory file. The file must already exist (use memory_write to create it).",
            inputSchema: {
                path: memoryPathSchema,
                content: z.string().describe("Content to append to the end of the file"),
            },
        },
        async ({ path, content }) => {
            try {
                await appendMemoryFile(memoriesRoot, path, content)
                return { content: [{ type: "text", text: `Appended to ${path}` }] }
            } catch (error) {
                return toolError(error)
            }
        },
    )

    server.registerTool(
        "memory_read",
        {
            title: "Read memory file",
            description: "Read the full content of a memory file.",
            inputSchema: {
                path: memoryPathSchema,
            },
        },
        async ({ path }) => {
            try {
                const content = await readMemoryFile(memoriesRoot, path)
                return { content: [{ type: "text", text: content }] }
            } catch (error) {
                return toolError(error)
            }
        },
    )

    server.registerTool(
        "memory_list",
        {
            title: "List memory files",
            description: "List the files and directories under a path in the memory tree. Defaults to the memory root.",
            inputSchema: {
                path: z
                    .string()
                    .optional()
                    .describe("Directory to list, relative to the memory root. Defaults to the root."),
                recursive: z.boolean().optional().describe("List nested directories recursively. Defaults to false."),
            },
        },
        async ({ path, recursive }) => {
            try {
                const entries = await listMemoryEntries(memoriesRoot, path ?? "", recursive ?? false)
                const text =
                    entries.length === 0
                        ? "(empty)"
                        : entries
                              .map((entry) => `${entry.type === "directory" ? "[DIR] " : "[FILE]"} ${entry.path}`)
                              .join("\n")
                return { content: [{ type: "text", text }] }
            } catch (error) {
                return toolError(error)
            }
        },
    )

    server.registerTool(
        "memory_str_replace",
        {
            title: "Replace text in memory file",
            description: "Replace an exact, unique occurrence of old_str with new_str in an existing memory file.",
            inputSchema: {
                path: memoryPathSchema,
                old_str: z.string().describe("Exact text to find; must match exactly once in the file"),
                new_str: z.string().describe("Text to replace old_str with"),
            },
        },
        async ({ path, old_str, new_str }) => {
            try {
                await strReplaceMemoryFile(memoriesRoot, path, old_str, new_str)
                return { content: [{ type: "text", text: `Replaced text in ${path}` }] }
            } catch (error) {
                return toolError(error)
            }
        },
    )

    return server
}

const handleMcpRequest = requireMcpAuth(
    auth,
    async (request) => {
        const memoriesRoot = await ensureMemoryStructure(MEMORY_BASE)
        const transport = new WebStandardStreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
        })
        const server = createMCPServer(memoriesRoot)
        await server.connect(transport)
        return transport.handleRequest(request)
    },
    { resource: MCP_RESOURCE },
)

export const Route = createFileRoute("/mcp/")({
    server: {
        handlers: {
            POST: async ({ request }) => handleMcpRequest(request),
        },
    },
})
