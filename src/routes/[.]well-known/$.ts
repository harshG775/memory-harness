import { createFileRoute } from "@tanstack/react-router";
import { createAuth } from "#/lib/auth/auth";

export const Route = createFileRoute("/.well-known/$")({
	server: {
		handlers: {
			GET: ({ request }) => createAuth().handler(request),
			POST: ({ request }) => createAuth().handler(request),
		},
	},
});
