import { eq } from "drizzle-orm"
import { db } from "#/lib/db"
import { oauthRefreshToken } from "#/lib/db/schema"

function parseScopes(value: unknown): string[] {
    // oauth-provider double-encodes json-mode columns: the drizzle column already
    // JSON.parses once on read, leaving an inner JSON string that needs a second parse.
    if (Array.isArray(value)) return value as string[]
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value)
            if (Array.isArray(parsed)) return parsed as string[]
        } catch {
            // fall through
        }
    }
    return []
}

export type Connection = {
    clientId: string
    name: string
    icon: string | null
    scopes: string[]
    connectedAt: number
    active: boolean
}

// Server-only: touches the sqlite db directly. Must never be imported from client-rendered
// code — connections.function.ts wraps this in createServerFn for that reason.
export async function fetchConnections(userId: string): Promise<Connection[]> {
    const [consents, tokens] = await Promise.all([
        db.query.oauthConsent.findMany({
            where: { userId },
            with: { oauthClient: true },
        }),
        // Access tokens are self-contained JWTs (the `jwt()` plugin) and never written to
        // the db, so a live, unrevoked refresh token is the real signal of an active connection.
        db.select().from(oauthRefreshToken).where(eq(oauthRefreshToken.userId, userId)),
    ])

    const now = Date.now()

    const connections: Connection[] = consents.map((consent) => ({
        clientId: consent.clientId,
        name: consent.oauthClient?.name ?? consent.clientId,
        icon: consent.oauthClient?.icon ?? null,
        scopes: parseScopes(consent.scopes),
        connectedAt: consent.createdAt.getTime(),
        active: tokens.some((t) => t.clientId === consent.clientId && !t.revoked && t.expiresAt.getTime() > now),
    }))

    connections.sort((a, b) => b.connectedAt - a.connectedAt)

    return connections
}
