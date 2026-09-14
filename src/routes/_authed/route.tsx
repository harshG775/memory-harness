import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSession } from "#/lib/server/auth.functions";

export const Route = createFileRoute("/_authed")({
	beforeLoad: async () => {
		const session = await getSession();
		if (!session?.user) {
			throw redirect({ to: "/sign-in", search: { auth: false } });
		}
		return {
			user: session.user,
		};
	},
	component: RouteComponent,
});

function RouteComponent() {
	return <Outlet />;
}
