import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { RiUserLine, RiLogoutBoxRLine } from "@remixicon/react"
import { getSession } from "#/lib/server/auth.functions"
import { authClient } from "#/lib/auth/auth-client"
import { Button } from "#/components/ui/button"

export const Route = createFileRoute("/")({
    component: RouteComponent,
    loader: async () => {
        const session = await getSession()
        return { user: session?.user ?? null }
    },
    pendingComponent: PendingComponent,
})

function PendingComponent() {
    return (
        <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
                <div className="size-5 animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                <div className="h-8 w-24 animate-pulse rounded-4xl bg-muted" />
                <div className="size-9 animate-pulse rounded-4xl bg-muted" />
            </div>
        </div>
    )
}

function RouteComponent() {
    const { user } = Route.useLoaderData()
    const navigate = useNavigate()

    async function handleLogout() {
        await authClient.signOut()
        void navigate({ to: "/sign-in" })
    }

    return (
        <div className="flex items-center justify-between p-4">
            {user ? (
                <div className="flex items-center gap-3">
                    <RiUserLine className="size-5 text-muted-foreground" />
                    <span className="text-sm font-medium">{user.name}</span>
                    <Button variant="outline" size="sm" nativeButton={false} render={<Link to="/memories" />}>
                        Memories
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={handleLogout}>
                        <RiLogoutBoxRLine />
                        <span className="sr-only">Log out</span>
                    </Button>
                </div>
            ) : (
                <Button nativeButton={false} render={<Link to="/sign-in" />}>
                    Log in
                </Button>
            )}
        </div>
    )
}
