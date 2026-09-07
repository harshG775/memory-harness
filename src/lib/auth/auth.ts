import { betterAuth } from "better-auth"
import { tanstackStartCookies } from "better-auth/tanstack-start"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { emailOTP } from "better-auth/plugins"
import { db } from "../db"
import * as schema from "#/lib/db/schema/index"
import { env } from "#/env"

export const auth = betterAuth({
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
        emailOTP({
            overrideDefaultEmailVerification: true,
            async sendVerificationOTP({ email, otp, type }) {
                // No email provider is wired up yet, so the OTP is only logged to the
                // server console for local development/testing.
                console.log(`[email-otp] ${type} code for ${email}: ${otp}`)
            },
        }),
        // Must stay last so its hooks run after every other plugin's.
        tanstackStartCookies(),
    ],
})
