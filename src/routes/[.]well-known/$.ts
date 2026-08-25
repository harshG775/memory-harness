import { auth } from "#/lib/auth"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/.well-known/$")({
    server: {
        handlers: {
            GET: async ({ request }) => await auth.handler(request),
        },
    },
})
