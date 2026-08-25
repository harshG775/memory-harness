import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"
import { createFileRoute } from "@tanstack/react-router"
import { requireMcpAuth } from "@better-auth/mcp"
import { z } from "zod"
import { auth, MCP_RESOURCE } from "#/lib/auth"

function createMCPServer(): McpServer {
    const server = new McpServer({
        name: "memory-harness",
        version: "1.0.0",
    })

    server.registerTool(
        "ping",
        {
            title: "Ping",
            description: "Health check tool. Echoes back the provided message.",
            inputSchema: { message: z.string().optional().describe("Message to echo back") },
        },
        ({ message }) => {
            return { content: [{ type: "text", text: message ? `pong: ${message}` : "pong" }] }
        },
    )

    return server
}

const handleMcpRequest = requireMcpAuth(
    auth,
    async (request) => {
        const transport = new WebStandardStreamableHTTPServerTransport({
            sessionIdGenerator: undefined,
        })
        const server = createMCPServer()
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
