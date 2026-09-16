import { createFileRoute } from "@tanstack/react-router";
import { getAuth } from "#/lib/auth/auth";

export const Route = createFileRoute("/.well-known/$")({
	server: {
		handlers: {
			GET: ({ request }) => getAuth().handler(request),
			POST: ({ request }) => getAuth().handler(request),
		},
	},
});
