import { auth } from "@/lib/auth"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/api/auth/$")({
    server: {
       handlers: {
			GET: async ({ request }) => await auth.handler(request),
			POST: async ({ request }) => await auth.handler(request),
		},
    },
})
