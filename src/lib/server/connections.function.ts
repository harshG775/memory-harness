import { createServerFn } from "@tanstack/react-start"
import { and, eq } from "drizzle-orm"
import { db } from "#/lib/db"
import { oauthAccessToken, oauthConsent, oauthRefreshToken } from "#/lib/db/schema"
import { ensureSession } from "#/lib/server/auth.function"
import { fetchConnections } from "#/lib/server/connections.server"

export type { Connection } from "#/lib/server/connections.server"

export const getConnections = createServerFn({ method: "GET" }).handler(async () => {
    const session = await ensureSession()
    return fetchConnections(session.user.id)
})

export const revokeConnection = createServerFn({ method: "POST" })
    .validator((input: { clientId: string }) => input)
    .handler(async ({ data }) => {
        const session = await ensureSession()
        const userId = session.user.id
        const { clientId } = data

        await db
            .delete(oauthAccessToken)
            .where(and(eq(oauthAccessToken.userId, userId), eq(oauthAccessToken.clientId, clientId)))
        await db
            .delete(oauthRefreshToken)
            .where(and(eq(oauthRefreshToken.userId, userId), eq(oauthRefreshToken.clientId, clientId)))
        await db.delete(oauthConsent).where(and(eq(oauthConsent.userId, userId), eq(oauthConsent.clientId, clientId)))

        return { success: true }
    })
