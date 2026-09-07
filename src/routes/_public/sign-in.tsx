import { useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { authClient } from "#/lib/auth/auth-client"
import { getHasUsers } from "#/lib/auth/has-users"
import { devVerifyEmail } from "#/lib/auth/dev-verify-email"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"

export const Route = createFileRoute("/_public/sign-in")({
    component: RouteComponent,
    loader: async () => ({ hasUsers: await getHasUsers() }),
})

function RouteComponent() {
    const { hasUsers } = Route.useLoaderData()
    const navigate = useNavigate()

    const [step, setStep] = useState<"credentials" | "otp">("credentials")
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [otp, setOtp] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)

    async function completeSignIn() {
        const { error: signInError } = await authClient.signIn.email({ email, password })
        if (signInError) {
            setError(signInError.message ?? "Something went wrong")
            return
        }
        void navigate({ to: "/" })
    }

    async function handleCredentialsSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setIsPending(true)

        const { error: authError } = hasUsers
            ? await authClient.signIn.email({ email, password })
            : await authClient.signUp.email({ name, email, password })

        if (!authError) {
            setIsPending(false)
            if (hasUsers) {
                void navigate({ to: "/" })
            } else {
                setStep("otp")
            }
            return
        }

        if (authError.code === "EMAIL_NOT_VERIFIED") {
            await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" })
            setIsPending(false)
            setStep("otp")
            return
        }

        setIsPending(false)
        setError(authError.message ?? "Something went wrong")
    }

    async function handleOtpSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setError(null)
        setIsPending(true)

        const { error: verifyError } = await authClient.emailOtp.verifyEmail({ email, otp })
        if (verifyError) {
            setIsPending(false)
            setError(verifyError.message ?? "Invalid code")
            return
        }

        await completeSignIn()
        setIsPending(false)
    }

    // TEMPORARY dev-only bypass: skips real OTP entry since no email provider
    // is wired up yet. Remove once one is.
    async function handleDevSkipVerification() {
        setError(null)
        setIsPending(true)
        await devVerifyEmail({ data: { email } })
        await completeSignIn()
        setIsPending(false)
    }

    if (step === "otp") {
        return (
            <div className="flex min-h-svh items-center justify-center p-4">
                <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xs">
                    <div className="mb-6 flex flex-col gap-1">
                        <h1 className="font-heading text-xl font-medium">Verify your email</h1>
                        <p className="text-sm text-muted-foreground">
                            We sent a code to {email}. No email provider is configured yet, so
                            check the server console for it.
                        </p>
                    </div>

                    <form className="flex flex-col gap-4" onSubmit={handleOtpSubmit}>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="otp">Verification code</Label>
                            <Input
                                id="otp"
                                name="otp"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                required
                                value={otp}
                                onChange={(event) => setOtp(event.target.value)}
                            />
                        </div>

                        {error && <p className="text-sm text-destructive">{error}</p>}

                        <Button type="submit" className="w-full" disabled={isPending}>
                            {isPending ? "Please wait..." : "Verify"}
                        </Button>

                        {import.meta.env.DEV && (
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                disabled={isPending}
                                onClick={handleDevSkipVerification}
                            >
                                Skip verification (dev only)
                            </Button>
                        )}
                    </form>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-svh items-center justify-center p-4">
            <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xs">
                <div className="mb-6 flex flex-col gap-1">
                    <h1 className="font-heading text-xl font-medium">
                        {hasUsers ? "Sign in" : "Create your account"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {hasUsers
                            ? "Welcome back. Enter your credentials to continue."
                            : "No account exists yet. Create the first account to get started."}
                    </p>
                </div>

                <form className="flex flex-col gap-4" onSubmit={handleCredentialsSubmit}>
                    {!hasUsers && (
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                autoComplete="name"
                                required
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete={hasUsers ? "current-password" : "new-password"}
                            required
                            minLength={8}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                    </div>

                    {error && <p className="text-sm text-destructive">{error}</p>}

                    <Button type="submit" className="mt-2 w-full" disabled={isPending}>
                        {isPending ? "Please wait..." : hasUsers ? "Sign in" : "Sign up"}
                    </Button>
                </form>
            </div>
        </div>
    )
}
