import { RiAppsLine, RiBrainLine, RiCheckLine, RiShieldKeyholeLine } from "@remixicon/react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import { env } from "#/env";
import { authClient } from "#/lib/auth/auth-client";
import { describeScope, getKnownClient } from "#/lib/oauth/known-clients";
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

function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/);
	const initials = parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : parts[0]?.slice(0, 2);
	return (initials ?? "").toUpperCase();
}

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
	const known = getKnownClient(clientName);
	const scopes = scope.split(" ").filter(Boolean);
	const requestedClaims = claims ? (JSON.parse(claims) as { userinfo?: Record<string, unknown> }) : undefined;
	const claimNames = requestedClaims?.userinfo ? Object.keys(requestedClaims.userinfo) : [];
	const permissionCount = scopes.length + claimNames.length;

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
					<Avatar size="lg" className="size-14 bg-muted">
						<AvatarImage src={client?.logo_uri ?? known?.logo ?? undefined} alt="" />
						<AvatarFallback className="bg-transparent">
							<RiAppsLine className="size-6 text-muted-foreground" />
						</AvatarFallback>
					</Avatar>
					<div className="flex items-center gap-1.5">
						<span className="h-px w-5 border-t border-dashed border-border" />
						<span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
							<RiCheckLine className="size-3" />
						</span>
						<span className="h-px w-5 border-t border-dashed border-border" />
					</div>
					<Avatar size="lg" className="size-14 bg-primary/10">
						<AvatarFallback className="bg-transparent text-primary">
							<RiBrainLine className="size-6" />
						</AvatarFallback>
					</Avatar>
				</div>

				<div className="flex flex-col items-center gap-1.5">
					<h1 className="text-center font-heading text-xl font-medium text-balance">
						{clientName} wants to access your account
					</h1>
					<div className="flex items-center gap-1.5 text-sm text-muted-foreground">
						<RiShieldKeyholeLine className="size-3.5 shrink-0" />
						{known ? <span>{known.description}</span> : <span>This application is not verified by {APP_NAME}</span>}
					</div>
				</div>
			</div>

			<div className="grid w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-lg sm:grid-cols-[1fr_15rem]">
				<div className="flex flex-col gap-3 p-6">
					<div className="flex items-center justify-between">
						<p className="text-sm font-medium">Permissions this app will be granted</p>
						<span className="shrink-0 text-xs text-muted-foreground">{permissionCount} total</span>
					</div>
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

				<div className="flex flex-col gap-4 border-t border-border bg-muted/30 p-6 sm:border-t-0 sm:border-l">
					<div className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-2.5">
						<Avatar size="sm">
							<AvatarImage src={user?.image ?? undefined} alt="" />
							<AvatarFallback>{getInitials(user?.name ?? user?.email ?? "?")}</AvatarFallback>
						</Avatar>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-medium text-foreground">{user?.name}</p>
							<p className="truncate text-xs text-muted-foreground">{user?.email}</p>
						</div>
					</div>

					{error && <p className="text-sm text-destructive">{error}</p>}

					<div className="flex flex-col gap-2">
						<Button type="button" className="w-full" disabled={isPending !== null} onClick={() => respond(true)}>
							{isPending === "allow" ? "Please wait..." : "Authorize"}
						</Button>
						<Button
							type="button"
							variant="outline"
							className="w-full"
							disabled={isPending !== null}
							onClick={() => respond(false)}
						>
							{isPending === "deny" ? "Please wait..." : "Cancel"}
						</Button>
					</div>

					<p className="text-center text-xs text-muted-foreground">
						Only authorize access if you trust {clientName}.
						{redirectHost && (
							<>
								{" "}
								You'll be redirected to <span className="font-medium text-foreground">{redirectHost}</span>.
							</>
						)}
					</p>
				</div>
			</div>
		</div>
	);
}
