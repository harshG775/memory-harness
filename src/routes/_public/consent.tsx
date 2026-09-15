import { RiCheckLine, RiShieldKeyholeLine } from "@remixicon/react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { authClient } from "#/lib/auth/auth-client";
import { getSession } from "#/lib/server/auth.functions";

type ConsentSearch = {
	client_id: string;
	scope: string;
	claims?: string;
	redirect_uri?: string;
};

type PublicClient = {
	client_name?: string | null;
	logo_uri?: string | null;
};

const SCOPE_LABELS: Record<string, string> = {
	openid: "Verify it's you",
	profile: "View your name and profile info",
	email: "View your email address",
	offline_access: "Stay connected when you're not using the app",
};

function describeScope(scope: string): string {
	return SCOPE_LABELS[scope] ?? `Access "${scope}"`;
}

export const Route = createFileRoute("/_public/consent")({
	validateSearch: (search: Record<string, unknown>): ConsentSearch => ({
		client_id: typeof search.client_id === "string" ? search.client_id : "",
		scope: typeof search.scope === "string" ? search.scope : "",
		claims: typeof search.claims === "string" ? search.claims : undefined,
		redirect_uri: typeof search.redirect_uri === "string" ? search.redirect_uri : undefined,
	}),
	loader: async ({ location }) => {
		const session = await getSession();
		if (!session?.user) {
			throw redirect({ to: "/sign-in", search: { redirectTo: location.href } });
		}
		return { user: session.user };
	},
	component: RouteComponent,
});

function RouteComponent() {
	const { client_id, scope, claims, redirect_uri } = Route.useSearch();
	const { user } = Route.useLoaderData();

	const [client, setClient] = useState<PublicClient | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [isPending, setIsPending] = useState<"allow" | "deny" | null>(null);

	useEffect(() => {
		if (!client_id) return;
		authClient.oauth2.publicClient({ query: { client_id } }).then(({ data }) => {
			setClient(data);
		});
	}, [client_id]);

	const scopes = scope.split(" ").filter(Boolean);
	const requestedClaims = claims ? (JSON.parse(claims) as { userinfo?: Record<string, unknown> }) : undefined;
	const claimNames = requestedClaims?.userinfo ? Object.keys(requestedClaims.userinfo) : [];

	let redirectHost: string | null = null;
	try {
		redirectHost = redirect_uri ? new URL(redirect_uri).host : null;
	} catch {
		redirectHost = null;
	}

	async function respond(accept: boolean) {
		setError(null);
		setIsPending(accept ? "allow" : "deny");

		const { data, error: consentError } = await authClient.oauth2.consent({
			accept,
			claims: requestedClaims,
		});

		if (consentError || !data?.url) {
			setIsPending(null);
			setError(consentError?.message ?? "Something went wrong");
			return;
		}

		window.location.href = data.url;
	}

	return (
		<div className="flex min-h-svh items-center justify-center p-4">
			<div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-lg">
				<div className="mb-6 flex flex-col items-center gap-3 text-center">
					<Avatar size="lg" className="size-14">
						<AvatarImage src={client?.logo_uri ?? undefined} alt="" />
						<AvatarFallback className="text-lg font-medium">
							{(client?.client_name ?? client_id).slice(0, 1).toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-col gap-1">
						<h1 className="font-heading text-xl font-medium">{client?.client_name ?? client_id}</h1>
						<p className="text-sm text-muted-foreground">wants to access your account</p>
					</div>
				</div>

				{user && (
					<div className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
						<span>
							Signed in as <span className="font-medium text-foreground">{user.email}</span>
						</span>
					</div>
				)}

				<div className="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-4">
					<p className="text-sm font-medium">This will allow {client?.client_name ?? "this app"} to:</p>
					<ul className="flex flex-col gap-2.5">
						{scopes.map((s) => (
							<li key={s} className="flex items-start gap-2 text-sm text-muted-foreground">
								<RiCheckLine className="mt-0.5 size-4 shrink-0 text-primary" />
								<span>{describeScope(s)}</span>
							</li>
						))}
						{claimNames.map((c) => (
							<li key={c} className="flex items-start gap-2 text-sm text-muted-foreground">
								<RiCheckLine className="mt-0.5 size-4 shrink-0 text-primary" />
								<span>Share your {c.replace(/_/g, " ")}</span>
							</li>
						))}
					</ul>
				</div>

				{redirectHost && (
					<div className="mb-6 flex items-start gap-2 text-xs text-muted-foreground">
						<RiShieldKeyholeLine className="mt-0.5 size-3.5 shrink-0" />
						<span>
							You'll be redirected to <span className="font-medium text-foreground">{redirectHost}</span> after you
							continue.
						</span>
					</div>
				)}

				{error && <p className="mb-4 text-sm text-destructive">{error}</p>}

				<div className="flex gap-2">
					<Button
						type="button"
						variant="outline"
						className="flex-1"
						disabled={isPending !== null}
						onClick={() => respond(false)}
					>
						{isPending === "deny" ? "Please wait..." : "Deny"}
					</Button>
					<Button type="button" className="flex-1" disabled={isPending !== null} onClick={() => respond(true)}>
						{isPending === "allow" ? "Please wait..." : "Allow"}
					</Button>
				</div>
			</div>
		</div>
	);
}
