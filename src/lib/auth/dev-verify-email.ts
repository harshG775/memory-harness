import { createServerFn } from "@tanstack/react-start"
import { eq } from "drizzle-orm"
import { db } from "#/lib/db"
import { user } from "#/lib/db/schema/index"

/**
 * TEMPORARY dev-only bypass. No email provider is wired up yet, so this lets
 * local testing skip entering the OTP by marking the email verified directly.
 * Remove this once a real email provider sends the OTP.
 */
export const devVerifyEmail = createServerFn({ method: "POST" })
    .validator((data: { email: string }) => data)
    .handler(async ({ data }) => {
        if (!import.meta.env.DEV) {
            throw new Error("devVerifyEmail is only available in development")
        }
        await db.update(user).set({ emailVerified: true }).where(eq(user.email, data.email))
    })
