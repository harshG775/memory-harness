import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { oauthAccessToken, oauthClient, oauthConsent, oauthRefreshToken } from "../db/schema/auth-schema";
import { authedMiddleware } from "./auth.middleware";

export const getConnectionsFn = createServerFn({ method: "GET" })
	.middleware([authedMiddleware])
	.handler(async ({ context }) => {
		const rows = await db
			.select({
				id: oauthConsent.id,
				clientId: oauthConsent.clientId,
				scopes: oauthConsent.scopes,
				createdAt: oauthConsent.createdAt,
				updatedAt: oauthConsent.updatedAt,
				clientName: oauthClient.name,
				clientIcon: oauthClient.icon,
			})
			.from(oauthConsent)
			.leftJoin(oauthClient, eq(oauthConsent.clientId, oauthClient.clientId))
			.where(eq(oauthConsent.userId, context.session.user.id))
			.orderBy(desc(oauthConsent.updatedAt));

		return rows;
	});

export const revokeConnectionFn = createServerFn({ method: "POST" })
	.middleware([authedMiddleware])
	.validator(z.object({ id: z.string() }))
	.handler(async ({ context, data }) => {
		const [consent] = await db
			.select({ clientId: oauthConsent.clientId })
			.from(oauthConsent)
			.where(and(eq(oauthConsent.id, data.id), eq(oauthConsent.userId, context.session.user.id)))
			.limit(1);

		if (!consent) return;

		await db
			.delete(oauthRefreshToken)
			.where(
				and(eq(oauthRefreshToken.userId, context.session.user.id), eq(oauthRefreshToken.clientId, consent.clientId)),
			);

		await db
			.delete(oauthAccessToken)
			.where(
				and(eq(oauthAccessToken.userId, context.session.user.id), eq(oauthAccessToken.clientId, consent.clientId)),
			);

		await db.delete(oauthConsent).where(eq(oauthConsent.id, data.id));
	});
