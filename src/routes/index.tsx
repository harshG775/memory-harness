import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { authClient } from "#/lib/auth/auth-client"

export const Route = createFileRoute("/")({ component: Home })

function Home() {
    const navigate = useNavigate()
    const { data: session, isPending } = authClient.useSession()

    async function handleLogout() {
        await authClient.signOut()
        navigate({ to: "/sign-in" })
    }

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold">Welcome to TanStack Start</h1>
            <p className="mt-4 text-lg">
                Edit <code>src/routes/index.tsx</code> to get started.
            </p>

            <div className="mt-8">
                {isPending ? (
                    <p>Loading...</p>
                ) : session ? (
                    <div className="flex items-center gap-4">
                        <p>
                            Signed in as <strong>{session.user.name}</strong> ({session.user.email})
                        </p>
                        <button onClick={handleLogout} className="rounded bg-black px-3 py-2 text-white">
                            Log out
                        </button>
                    </div>
                ) : (
                    <p>
                        Not signed in.
                    </p>
                )}
            </div>
        </div>
    )
}
