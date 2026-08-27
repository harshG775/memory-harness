import { useState } from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import { getConnections, revokeConnection } from "#/lib/server/connections.function"
import type { Connection } from "#/lib/server/connections.function"
import { AppIcon } from "#/components/app-icon"

export const Route = createFileRoute("/_authed/dashboard")({
    loader: () => getConnections(),
    component: RouteComponent,
})

function formatDate(ms: number): string {
    return new Date(ms).toLocaleDateString(undefined, { dateStyle: "medium" })
}

function ConnectionRow({
    connection,
    isRevoking,
    onRevoke,
}: {
    connection: Connection
    isRevoking: boolean
    onRevoke: () => void
}) {
    return (
        <li className="flex items-center gap-4 rounded-xl border border-gray-200 p-4">
            <AppIcon name={connection.name} logo={connection.icon ?? undefined} />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-gray-900">{connection.name}</p>
                    <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            connection.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                        }`}
                    >
                        {connection.active ? "Active" : "Inactive"}
                    </span>
                </div>
                {connection.scopes.length > 0 && (
                    <p className="mt-1 truncate text-xs text-gray-500">{connection.scopes.join(", ")}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">Connected {formatDate(connection.connectedAt)}</p>
            </div>
            <button
                onClick={onRevoke}
                disabled={isRevoking}
                className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
                {isRevoking ? "Revoking..." : "Revoke"}
            </button>
        </li>
    )
}

function RouteComponent() {
    const connections = Route.useLoaderData()
    const router = useRouter()
    const [revokingId, setRevokingId] = useState<string | null>(null)

    async function handleRevoke(connection: Connection) {
        if (!window.confirm(`Revoke access for ${connection.name}?`)) return
        setRevokingId(connection.clientId)
        try {
            await revokeConnection({ data: { clientId: connection.clientId } })
            await router.invalidate()
        } finally {
            setRevokingId(null)
        }
    }

    return (
        <div className="mx-auto max-w-2xl p-8">
            <h1 className="text-2xl font-semibold text-gray-900">Connections</h1>
            <p className="mt-1 text-sm text-gray-500">
                Apps and clients authorized to use the memory-harness MCP server on your behalf.
            </p>

            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">Total connections</p>
                <p className="mt-1 text-3xl font-semibold text-gray-900">{connections.length}</p>
            </div>

            <ul className="mt-6 space-y-3">
                {connections.length === 0 ? (
                    <p className="text-sm text-gray-500">
                        No client has connected yet. Authorize one via the MCP consent flow to see it here.
                    </p>
                ) : (
                    connections.map((connection) => (
                        <ConnectionRow
                            key={connection.clientId}
                            connection={connection}
                            isRevoking={revokingId === connection.clientId}
                            onRevoke={() => handleRevoke(connection)}
                        />
                    ))
                )}
            </ul>
        </div>
    )
}
