import { useEffect, useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { authClient } from "#/lib/auth/auth-client"
import { fetchOAuthClientInfo  } from "#/lib/auth/client-info"
import type {OAuthClientInfo} from "#/lib/auth/client-info";
import { AppIcon } from "#/components/app-icon"
import { Spinner } from "#/components/ui/spinner"
import { db } from "#/lib/db"
import { user } from "#/lib/db/schema"

const checkHasUsers = createServerFn({ method: "GET" }).handler(async () => {
    const existing = await db.select({ id: user.id }).from(user).limit(1)
    return { hasUsers: existing.length > 0 }
})

const signInSearchSchema = z.object({
    client_id: z.string().optional(),
})

export const Route = createFileRoute("/_public/sign-in")({
    validateSearch: signInSearchSchema,
    loader: () => checkHasUsers(),
    component: Login,
})

function SignInSkeleton() {
    return (
        <div className="w-full max-w-sm animate-pulse rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex flex-col items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-gray-200" />
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-3 w-40 rounded bg-gray-200" />
            </div>
            <div className="space-y-4">
                <div className="space-y-1">
                    <div className="h-3 w-12 rounded bg-gray-200" />
                    <div className="h-10 w-full rounded-lg bg-gray-200" />
                </div>
                <div className="space-y-1">
                    <div className="h-3 w-16 rounded bg-gray-200" />
                    <div className="h-10 w-full rounded-lg bg-gray-200" />
                </div>
                <div className="h-10 w-full rounded-lg bg-gray-200" />
            </div>
        </div>
    )
}

function Login() {
    const { hasUsers } = Route.useLoaderData()
    const { client_id } = Route.useSearch()
    const navigate = useNavigate()
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [clientInfo, setClientInfo] = useState<OAuthClientInfo | null>(null)
    const [appPending, setAppPending] = useState(Boolean(client_id))

    useEffect(() => {
        if (!client_id) return
        let cancelled = false

        fetchOAuthClientInfo(client_id).then((info) => {
            if (cancelled) return
            setClientInfo(info)
            setAppPending(false)
        })

        return () => {
            cancelled = true
        }
    }, [client_id])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setIsSubmitting(true)

        const { data, error: authError } = hasUsers
            ? await authClient.signIn.email({ email, password })
            : await authClient.signUp.email({ name, email, password })

        setIsSubmitting(false)

        if (authError) {
            setError(authError.message ?? "Something went wrong")
            return
        }

        if ("redirect" in data && data.redirect) return

        if (client_id) {
            window.location.href = `/api/auth/oauth2/authorize${window.location.search}`
            return
        }

        navigate({ to: "/" })
    }

    const displayName = clientInfo?.client_name

    if (appPending) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
                <SignInSkeleton />
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
            <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                <div className="mb-6 flex flex-col items-center gap-3 text-center">
                    {displayName && <AppIcon name={displayName} logo={clientInfo.logo_uri} />}
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900">
                            {hasUsers ? "Sign in to continue" : "Create your account"}
                        </h1>
                        {displayName ? (
                            <p className="mt-1 text-sm text-gray-500">
                                <span className="font-medium text-gray-700">{displayName}</span> wants you to sign in
                            </p>
                        ) : (
                            !hasUsers && (
                                <p className="mt-1 text-sm text-gray-500">
                                    No account exists yet. Create the owner account to get started.
                                </p>
                            )
                        )}
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!hasUsers && (
                        <div className="space-y-1">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                        </div>
                    )}

                    <div className="space-y-1">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                    </div>

                    {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isSubmitting && <Spinner />}
                        {isSubmitting
                            ? hasUsers
                                ? "Signing in..."
                                : "Creating account..."
                            : hasUsers
                              ? "Sign in"
                              : "Create account"}
                    </button>
                </form>
            </div>
        </div>
    )
}
