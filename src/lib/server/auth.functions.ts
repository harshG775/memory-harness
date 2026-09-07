import { createServerFn } from "@tanstack/react-start"
import { authMiddleware } from "./auth.middleware"

export const getSession = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context }) => {
        return context.session
    })

export const ensureSession = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context }) => {
        if (!context.session) {
            throw new Error("Unauthorized")
        }

        return context.session
    })
