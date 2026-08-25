import * as schema from "#/lib/db/schema"
import { defineRelations } from "drizzle-orm"

export const relations = defineRelations(schema, (r) => ({
    user: {
        sessions: r.many.session({
            from: r.user.id,
            to: r.session.userId,
        }),
        accounts: r.many.account({
            from: r.user.id,
            to: r.account.userId,
        }),
        oauthClients: r.many.oauthClient({
            from: r.user.id,
            to: r.oauthClient.userId,
        }),
        oauthRefreshTokens: r.many.oauthRefreshToken({
            from: r.user.id,
            to: r.oauthRefreshToken.userId,
        }),
        oauthAccessTokens: r.many.oauthAccessToken({
            from: r.user.id,
            to: r.oauthAccessToken.userId,
        }),
        oauthConsents: r.many.oauthConsent({
            from: r.user.id,
            to: r.oauthConsent.userId,
        }),
    },
    session: {
        user: r.one.user({
            from: r.session.userId,
            to: r.user.id,
        }),
        oauthRefreshTokens: r.many.oauthRefreshToken({
            from: r.session.id,
            to: r.oauthRefreshToken.sessionId,
        }),
        oauthAccessTokens: r.many.oauthAccessToken({
            from: r.session.id,
            to: r.oauthAccessToken.sessionId,
        }),
    },
    account: {
        user: r.one.user({
            from: r.account.userId,
            to: r.user.id,
        }),
    },
    oauthClient: {
        user: r.one.user({
            from: r.oauthClient.userId,
            to: r.user.id,
        }),
        oauthClientResources: r.many.oauthClientResource({
            from: r.oauthClient.clientId,
            to: r.oauthClientResource.clientId,
        }),
        oauthRefreshTokens: r.many.oauthRefreshToken({
            from: r.oauthClient.clientId,
            to: r.oauthRefreshToken.clientId,
        }),
        oauthAccessTokens: r.many.oauthAccessToken({
            from: r.oauthClient.clientId,
            to: r.oauthAccessToken.clientId,
        }),
        oauthConsents: r.many.oauthConsent({
            from: r.oauthClient.clientId,
            to: r.oauthConsent.clientId,
        }),
    },
    oauthResource: {
        oauthClientResources: r.many.oauthClientResource({
            from: r.oauthResource.identifier,
            to: r.oauthClientResource.resourceId,
        }),
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
        oauthAccessTokens: r.many.oauthAccessToken({
            from: r.oauthRefreshToken.id,
            to: r.oauthAccessToken.refreshId,
        }),
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
}))
