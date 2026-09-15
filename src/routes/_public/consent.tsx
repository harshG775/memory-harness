import { RiBrainLine, RiCheckLine, RiShieldKeyholeLine } from "@remixicon/react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { env } from "#/env";
import { authClient } from "#/lib/auth/auth-client";
import { getSession } from "#/lib/server/auth.functions";

const APP_NAME = env.VITE_APP_TITLE ?? "Memory Harness";

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

	const clientName = client?.client_name ?? client_id;
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
		<div className="flex min-h-svh flex-col items-center justify-center gap-6 p-4">
			<div className="flex flex-col items-center gap-5">
				<div className="flex items-center gap-3">
					<Avatar size="lg" className="size-14 bg-primary/10">
						<AvatarFallback className="bg-transparent text-primary">
							<RiBrainLine className="size-6" />
						</AvatarFallback>
					</Avatar>
					<div className="flex items-center gap-1.5">
						<span className="h-px w-5 border-t border-dashed border-border" />
						<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
							<RiCheckLine className="size-3" />
						</span>
						<span className="h-px w-5 border-t border-dashed border-border" />
					</div>
					<Avatar size="lg" className="size-14">
						<AvatarImage src={client?.logo_uri ?? undefined} alt="" />
						<AvatarFallback className="text-lg font-medium">{clientName.slice(0, 1).toUpperCase()}</AvatarFallback>
					</Avatar>
				</div>

				<h1 className="text-center font-heading text-xl font-medium text-balance">Authorize {clientName}</h1>
			</div>

			<div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-lg">
				<p className="mb-5 text-sm text-muted-foreground">
					<span className="font-medium text-foreground">{clientName}</span> wants to access your {APP_NAME} account
					{user && (
						<>
							{" "}
							as <span className="font-medium text-foreground">{user.email}</span>
						</>
					)}
					.
				</p>

				<div className="mb-5 flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-4">
					<p className="text-sm font-medium">This will allow {clientName} to:</p>
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

				{error && <p className="mb-4 text-sm text-destructive">{error}</p>}

				<Button type="button" className="w-full" disabled={isPending !== null} onClick={() => respond(true)}>
					{isPending === "allow" ? "Please wait..." : `Authorize ${clientName}`}
				</Button>

				{redirectHost && (
					<p className="mt-3 text-center text-xs text-muted-foreground">
						Authorizing will redirect to <span className="font-medium text-foreground">{redirectHost}</span>
					</p>
				)}

				<Button
					type="button"
					variant="ghost"
					className="mt-2 w-full text-muted-foreground"
					disabled={isPending !== null}
					onClick={() => respond(false)}
				>
					{isPending === "deny" ? "Please wait..." : "Deny access"}
				</Button>
			</div>

			<div className="flex w-full max-w-sm items-start gap-2 rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
				<RiShieldKeyholeLine className="mt-0.5 size-3.5 shrink-0" />
				<span>
					This app was not verified by {APP_NAME}. Only continue if you trust <strong>{clientName}</strong>.
				</span>
			</div>
		</div>
	);
}
