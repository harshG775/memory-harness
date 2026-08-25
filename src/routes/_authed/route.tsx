import { getSession } from "#/lib/server/auth.function"
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/_authed")({
    beforeLoad: async () => {
        const context = await getSession()
        if (!context?.session) {
            throw redirect({
                to: "/sign-in",
                // search: { from: "location.href "},
            })
        }
    },
    component: () => <Outlet />,
})
