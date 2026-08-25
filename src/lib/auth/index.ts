import { betterAuth } from "better-auth"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "../db"
import * as schema from "#/lib/db/schema/index"
import { env } from "#/env"
import { jwt } from "better-auth/plugins"
import { mcp } from "@better-auth/mcp"

export const MCP_RESOURCE = `${env.SERVER_URL}/mcp`

export const auth = betterAuth({
    baseURL: env.SERVER_URL,
    database: drizzleAdapter(db, {
        provider: "sqlite",
        schema: schema,
    }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        jwt(),
        mcp({
            loginPage: "/sign-in",
            consentPage: "/consent",
            resource: MCP_RESOURCE,
            allowDynamicClientRegistration: true,
            allowUnauthenticatedClientRegistration: true,
            allowPublicClientPrelogin: true,
        }),
        tanstackStartCookies(),
    ],
})
