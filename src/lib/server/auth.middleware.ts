import { createMiddleware } from "@tanstack/react-start"
import { auth } from "@/lib/auth/auth"

export const authMiddleware = createMiddleware({ type: "request" }).server(async ({ request, next }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    return next({
        context: {
            session,
        },
    })
})

export const authedMiddleware = createMiddleware({ type: "request" })
    .middleware([authMiddleware])
    .server(async ({ context, next }) => {
        if (!context.session) {
            throw new Error("Unauthorized")
        }

        return next({
            context: {
                session: context.session,
            },
        })
    })
