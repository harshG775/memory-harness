import { createFileRoute } from "@tanstack/react-router";
import { auth } from "#/lib/auth/auth";

export const Route = createFileRoute("/.well-known/$")({
	server: {
		handlers: {
			GET: ({ request }) => auth.handler(request),
			POST: ({ request }) => auth.handler(request),
		},
	},
});
