import { useEffect, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { authClient } from "#/lib/auth/auth-client"
import { fetchOAuthClientInfo } from "#/lib/auth/client-info"
import type { OAuthClientInfo } from "#/lib/auth/client-info"
import { AppIcon } from "#/components/app-icon"
import { Spinner } from "#/components/ui/spinner"

export const Route = createFileRoute("/_public/consent")({ component: Consent })

type Status = "loading" | "ready" | "denying" | "allowing" | "redirecting"

type SessionUser = {
    name: string
    email: string
    image?: string | null
}

function UserRow({ user }: { user: SessionUser }) {
    const initial = (user.name || user.email).trim().charAt(0).toUpperCase() || "?"
    return (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-gray-200 p-3 text-left">
            {user.image ? (
                <img src={user.image} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-600">
                    {initial}
                </div>
            )}
            <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900">{user.name}</p>
                <p className="truncate text-xs text-gray-500">{user.email}</p>
            </div>
        </div>
    )
}

function CheckIcon() {
    return (
        <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-blue-600">
            <path
                fillRule="evenodd"
                d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                clipRule="evenodd"
            />
        </svg>
    )
}

function ConsentSkeleton() {
    return (
        <div className="w-full max-w-sm animate-pulse rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col items-center gap-3 text-center">
                <div className="h-14 w-14 rounded-full bg-gray-200" />
                <div className="h-4 w-32 rounded bg-gray-200" />
                <div className="h-3 w-48 rounded bg-gray-200" />
            </div>
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-gray-200 p-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200" />
                <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="h-3 w-24 rounded bg-gray-200" />
                    <div className="h-3 w-32 rounded bg-gray-200" />
                </div>
            </div>
            <div className="mt-6 space-y-3 rounded-xl bg-gray-50 p-4">
                <div className="h-3 w-28 rounded bg-gray-200" />
                <div className="h-3 w-full rounded bg-gray-200" />
                <div className="h-3 w-5/6 rounded bg-gray-200" />
            </div>
            <div className="mt-6 flex gap-3">
                <div className="h-10 flex-1 rounded-lg bg-gray-200" />
                <div className="h-10 flex-1 rounded-lg bg-gray-200" />
            </div>
        </div>
    )
}

function Consent() {
    const [status, setStatus] = useState<Status>("loading")
    const [clientId, setClientId] = useState("")
    const [scope, setScope] = useState("")
    const [user, setUser] = useState<SessionUser | null>(null)
    const [clientInfo, setClientInfo] = useState<OAuthClientInfo | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false

        async function load() {
            const params = new URLSearchParams(window.location.search)
            const cid = params.get("client_id") ?? ""
            setClientId(cid || "Unknown application")
            setScope(params.get("scope") ?? "")

            const [{ data }, client] = await Promise.all([
                authClient.getSession(),
                cid ? fetchOAuthClientInfo(cid) : Promise.resolve(null),
            ])
            if (cancelled) return

            if (!data?.user) {
                window.location.href = `/sign-in${window.location.search}`
                return
            }

            setUser({ name: data.user.name, email: data.user.email, image: data.user.image })
            if (client) setClientInfo(client)
            setStatus("ready")
        }

        load()
        return () => {
            cancelled = true
        }
    }, [])

    async function respond(accept: boolean) {
        setStatus(accept ? "allowing" : "denying")
        setError(null)

        const { error: apiError } = await authClient.oauth2.consent({ accept })

        if (apiError) {
            setStatus("ready")
            setError(apiError.message ?? "Something went wrong")
            return
        }

        setStatus("redirecting")
    }

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
                <ConsentSkeleton />
            </div>
        )
    }

    const scopes = scope.split(" ").filter(Boolean)
    const isBusy = status === "denying" || status === "allowing" || status === "redirecting"
    const displayName = clientInfo?.client_name || clientId
    const websiteHost = (() => {
        if (!clientInfo?.client_uri) return null
        try {
            return new URL(clientInfo.client_uri).hostname
        } catch {
            return null
        }
    })()

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-8">
            <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
                {status === "redirecting" ? (
                    <div className="flex flex-col items-center gap-4 py-8 text-center">
                        <Spinner className="h-8 w-8 text-blue-600" />
                        <p className="text-sm text-gray-600">Taking you back to {displayName}...</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col items-center gap-3 text-center">
                            <AppIcon name={displayName} logo={clientInfo?.logo_uri} />
                            <div>
                                <h1 className="text-lg font-semibold text-gray-900">Sign in to continue</h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    <span
                                        title={displayName}
                                        className="inline-block max-w-55 truncate align-bottom font-medium text-gray-700"
                                    >
                                        {displayName}
                                    </span>{" "}
                                    wants to access your account
                                </p>
                                {websiteHost && (
                                    <a
                                        href={clientInfo?.client_uri}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-0.5 inline-block text-xs text-blue-600 hover:underline"
                                    >
                                        {websiteHost}
                                    </a>
                                )}
                            </div>
                        </div>

                        {user && <UserRow user={user} />}

                        {scopes.length > 0 && (
                            <div className="mt-6 rounded-xl bg-gray-50 p-4">
                                <p className="text-xs font-medium tracking-wide text-gray-500 uppercase">
                                    This will allow it to
                                </p>
                                <ul className="mt-2 space-y-2">
                                    {scopes.map((s) => (
                                        <li key={s} className="flex items-start gap-2 text-sm text-gray-700">
                                            <CheckIcon />
                                            <span>{s}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

                        <p className="mt-6 text-xs text-gray-400">
                            Make sure you trust {displayName} before continuing. You can revoke access at any time.
                        </p>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => respond(false)}
                                disabled={isBusy}
                                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                            >
                                {status === "denying" && <Spinner />}
                                Cancel
                            </button>
                            <button
                                onClick={() => respond(true)}
                                disabled={isBusy}
                                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                            >
                                {status === "allowing" && <Spinner />}
                                Allow
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
