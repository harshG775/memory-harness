import { mcp } from "@better-auth/mcp"; 
import { betterAuth} from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { emailOTP, jwt } from "better-auth/plugins"; 
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { env } from "#/env";
import * as schema from "#/lib/db/schema/index";
import { db } from "../db";


export const MCP_RESOURCE = `${env.SERVER_URL}/mcp`
export const AUTH_BASE_URL = `${env.SERVER_URL}/api/auth`


export function createAuth() {
	return betterAuth({
		baseURL: env.SERVER_URL,
		database: drizzleAdapter(db, {
			provider: "pg",
			schema: schema,
		}),
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
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
			emailOTP({
				overrideDefaultEmailVerification: true,
				async sendVerificationOTP({ email, otp, type }) {
					console.log(`[email-otp] ${type} code for ${email}: ${otp}`);
				},
			}),
			tanstackStartCookies(),
		],
	});
}
