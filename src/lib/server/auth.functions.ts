import { createServerFn } from "@tanstack/react-start"
import { authedMiddleware, authMiddleware } from "./auth.middleware"

export const getSession = createServerFn({ method: "GET" })
    .middleware([authMiddleware])
    .handler(async ({ context }) => {
        return context.session
    })

export const ensureSession = createServerFn({ method: "GET" })
    .middleware([authedMiddleware])
    .handler(async ({ context }) => {
        return context.session
    })
