import {
	RiAppsLine,
	RiArrowDownSLine,
	RiCloseLine,
	RiMore2Line,
	RiSearchLine,
	RiShieldKeyholeLine,
} from "@remixicon/react";
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "#/components/ui/avatar";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "#/components/ui/empty";
import { Input } from "#/components/ui/input";
import { Skeleton } from "#/components/ui/skeleton";
import { formatRelativeTime } from "#/lib/formatter";
import { describeScope, getKnownClient } from "#/lib/oauth/known-clients";
import { getConnectionsFn, revokeConnectionFn } from "#/lib/server/connections.function";
import { cn } from "#/lib/utils";

const SKELETON_ROW_KEYS = ["skeleton-1", "skeleton-2", "skeleton-3"];

const connectionsQueryOptions = queryOptions({
	queryKey: ["connections"],
	queryFn: () => getConnectionsFn(),
});

export const Route = createFileRoute("/_authed/connections/")({
	loader: ({ context }) => context.queryClient.query(connectionsQueryOptions),
	pendingComponent: ConnectionsSkeleton,
	component: RouteComponent,
});

type Connection = Awaited<ReturnType<typeof getConnectionsFn>>[number];

type ConnectionGroup = {
	key: string;
	displayName: string;
	items: Connection[];
};

function groupConnections(connections: Connection[]): ConnectionGroup[] {
	const groups = new Map<string, ConnectionGroup>();

	for (const connection of connections) {
		const displayName = connection.clientName ?? connection.clientId;
		const key = displayName.trim().toLowerCase();
		const group = groups.get(key);
		if (group) {
			group.items.push(connection);
		} else {
			groups.set(key, { key, displayName, items: [connection] });
		}
	}

	for (const group of groups.values()) {
		group.items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
	}

	return [...groups.values()].sort((a, b) => b.items[0].updatedAt.getTime() - a.items[0].updatedAt.getTime());
}

function RouteComponent() {
	const { data: connections } = useSuspenseQuery(connectionsQueryOptions);
	const [search, setSearch] = useState("");

	const groups = groupConnections(connections);
	const filteredGroups = groups.filter((group) =>
		group.displayName.toLowerCase().includes(search.trim().toLowerCase()),
	);

	return (
		<div className="mx-auto max-w-2xl space-y-4 p-4">
			<div className="space-y-1">
				<h1 className="font-heading text-xl font-medium">Connected apps</h1>
				<p className="text-sm text-muted-foreground">Apps and tools that have access to your account.</p>
			</div>

			<div className="relative">
				<RiSearchLine className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
				<Input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search connected apps"
					className="pl-9"
				/>
			</div>

			{connections.length === 0 ? (
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<RiShieldKeyholeLine />
						</EmptyMedia>
						<EmptyTitle>No connected apps</EmptyTitle>
						<EmptyDescription>Apps and tools you authorize will show up here.</EmptyDescription>
					</EmptyHeader>
				</Empty>
			) : filteredGroups.length === 0 ? (
				<p className="py-8 text-center text-sm text-muted-foreground">No apps match "{search}".</p>
			) : (
				<div className="divide-y divide-border rounded-2xl border border-border bg-card">
					{filteredGroups.map((group) =>
						group.items.length === 1 ? (
							<ConnectionRow key={group.key} connection={group.items[0]} />
						) : (
							<ConnectionGroupRow key={group.key} group={group} />
						),
					)}
				</div>
			)}
		</div>
	);
}

function ConnectionGroupRow({ group }: { group: ConnectionGroup }) {
	const [expanded, setExpanded] = useState(false);
	const known = getKnownClient(group.displayName);
	const icon = group.items[0].clientIcon ?? known?.logo ?? undefined;

	return (
		<div>
			<button
				type="button"
				className="flex w-full items-center gap-3 p-4 text-left"
				onClick={() => setExpanded((value) => !value)}
			>
				<Avatar size="lg" className="bg-muted">
					<AvatarImage src={icon} alt="" />
					<AvatarFallback className="bg-transparent">
						<RiAppsLine className="size-5 text-muted-foreground" />
					</AvatarFallback>
				</Avatar>

				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-medium text-foreground">{group.displayName}</p>
					<p className="truncate text-xs text-muted-foreground">
						{group.items.length} connections · last used {formatRelativeTime(group.items[0].updatedAt)}
					</p>
				</div>

				<RiArrowDownSLine
					className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")}
				/>
			</button>

			{expanded && (
				<div className="divide-y divide-border border-t border-border bg-muted/30 pl-8">
					{group.items.map((connection) => (
						<ConnectionRow key={connection.id} connection={connection} showClientId />
					))}
				</div>
			)}
		</div>
	);
}

function ConnectionRow({ connection, showClientId }: { connection: Connection; showClientId?: boolean }) {
	const queryClient = useQueryClient();
	const clientName = connection.clientName ?? connection.clientId;
	const known = getKnownClient(clientName);

	const { mutate: revoke, isPending } = useMutation({
		mutationFn: revokeConnectionFn,
		onSuccess: () => queryClient.invalidateQueries({ queryKey: ["connections"] }),
	});

	const scopeSummary = connection.scopes.map(describeScope).join(" · ");

	return (
		<div className="flex items-center gap-3 p-4">
			{!showClientId && (
				<Avatar size="lg" className="bg-muted">
					<AvatarImage src={connection.clientIcon ?? known?.logo ?? undefined} alt="" />
					<AvatarFallback className="bg-transparent">
						<RiAppsLine className="size-5 text-muted-foreground" />
					</AvatarFallback>
				</Avatar>
			)}

			<div className="min-w-0 flex-1">
				<p className="truncate text-sm font-medium text-foreground">
					{showClientId ? connection.clientId : clientName}
				</p>
				<p className="truncate text-xs text-muted-foreground">
					Connected {formatRelativeTime(connection.createdAt)}
					{scopeSummary && <> · {scopeSummary}</>}
				</p>
			</div>

			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button variant="ghost" size="icon-sm" disabled={isPending}>
							<RiMore2Line />
							<span className="sr-only">Connection actions</span>
						</Button>
					}
				/>
				<DropdownMenuContent align="end">
					<DropdownMenuItem
						variant="destructive"
						data-icon="inline-start"
						onClick={() => revoke({ data: { id: connection.id } })}
					>
						<RiCloseLine />
						Remove access
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

function ConnectionsSkeleton() {
	return (
		<div className="mx-auto max-w-2xl space-y-4 p-4">
			<div className="space-y-2">
				<Skeleton className="h-6 w-40" />
				<Skeleton className="h-4 w-72" />
			</div>
			<Skeleton className="h-9 w-full rounded-3xl" />
			<div className="space-y-2">
				{SKELETON_ROW_KEYS.map((key) => (
					<Skeleton key={key} className="h-16 w-full" />
				))}
			</div>
		</div>
	);
}
