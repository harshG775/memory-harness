import { defineRelations } from "drizzle-orm";
import * as schema from "#/lib/db/schema";

export const relations = defineRelations(schema, (r) => ({
	user: {
		sessions: r.many.session(),
		accounts: r.many.account(),
		memories: r.many.memory(),
		oauthClients: r.many.oauthClient(),
		oauthRefreshTokens: r.many.oauthRefreshToken(),
		oauthAccessTokens: r.many.oauthAccessToken(),
		oauthConsents: r.many.oauthConsent(),
	},
	session: {
		user: r.one.user({
			from: r.session.userId,
			to: r.user.id,
		}),
		oauthRefreshTokens: r.many.oauthRefreshToken(),
		oauthAccessTokens: r.many.oauthAccessToken(),
	},
	account: {
		user: r.one.user({
			from: r.account.userId,
			to: r.user.id,
		}),
	},
	memory: {
		user: r.one.user({ from: r.memory.userId, to: r.user.id }),
	},
	oauthClient: {
		user: r.one.user({
			from: r.oauthClient.userId,
			to: r.user.id,
		}),
		oauthClientResources: r.many.oauthClientResource(),
		oauthRefreshTokens: r.many.oauthRefreshToken(),
		oauthAccessTokens: r.many.oauthAccessToken(),
		oauthConsents: r.many.oauthConsent(),
	},
	oauthResource: {
		oauthClientResources: r.many.oauthClientResource(),
	},
	oauthClientResource: {
		oauthClient: r.one.oauthClient({
			from: r.oauthClientResource.clientId,
			to: r.oauthClient.clientId,
		}),
		oauthResource: r.one.oauthResource({
			from: r.oauthClientResource.resourceId,
			to: r.oauthResource.identifier,
		}),
	},
	oauthRefreshToken: {
		oauthClient: r.one.oauthClient({
			from: r.oauthRefreshToken.clientId,
			to: r.oauthClient.clientId,
		}),
		session: r.one.session({
			from: r.oauthRefreshToken.sessionId,
			to: r.session.id,
		}),
		user: r.one.user({
			from: r.oauthRefreshToken.userId,
			to: r.user.id,
		}),
		oauthAccessTokens: r.many.oauthAccessToken(),
	},
	oauthAccessToken: {
		oauthClient: r.one.oauthClient({
			from: r.oauthAccessToken.clientId,
			to: r.oauthClient.clientId,
		}),
		session: r.one.session({
			from: r.oauthAccessToken.sessionId,
			to: r.session.id,
		}),
		user: r.one.user({
			from: r.oauthAccessToken.userId,
			to: r.user.id,
		}),
		oauthRefreshToken: r.one.oauthRefreshToken({
			from: r.oauthAccessToken.refreshId,
			to: r.oauthRefreshToken.id,
		}),
	},
	oauthConsent: {
		oauthClient: r.one.oauthClient({
			from: r.oauthConsent.clientId,
			to: r.oauthClient.clientId,
		}),
		user: r.one.user({
			from: r.oauthConsent.userId,
			to: r.user.id,
		}),
	},
}));
