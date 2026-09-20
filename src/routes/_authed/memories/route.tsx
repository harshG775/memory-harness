import { RiBrainLine } from "@remixicon/react";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useMatch, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { MemoryExplorer, MemoryExplorerSkeleton } from "#/components/memory-explorer";
import { Skeleton } from "#/components/ui/skeleton";
import { UserMenu } from "#/components/user-menu";
import { Workspace, WorkspaceProvider } from "#/components/workspace";
import { authClient } from "#/lib/auth/auth-client";
import { categoryIdEnum } from "#/lib/db/schema";
import type { CategoryId } from "#/lib/memory/category";
import { getMemoriesFn, type SortBy, type SortOrder, sortByEnum, sortOrderEnum } from "#/lib/server/memories.function";

// The explorer shows every memory as a folder tree, so load the server's max page.
const PAGE_SIZE = 100;
const NEW_KEY = "new";

const memoriesQueryOptions = (categoryId: CategoryId | undefined, sortBy: SortBy, sortOrder: SortOrder, page: number) =>
	queryOptions({
		queryKey: ["memories", { categoryId: categoryId ?? "all", sortBy, sortOrder, page }],
		queryFn: () =>
			getMemoriesFn({
				data: { categoryId, sortBy, sortOrder, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE },
			}),
	});

// Pure CSS layout (no useIsMobile): this also renders on the server, which can't
// know the viewport. Full width on mobile, the sidebar column on desktop.
function MemoriesSkeleton() {
	return (
		<div className="fixed inset-0 flex">
			{/* md:w-75 = 300px, the Workspace sidebar's default width */}
			<div className="w-full md:w-75 md:border-r md:border-border">
				<MemoryExplorerSkeleton />
			</div>
		</div>
	);
}
function MemorySheetSkeleton() {
	return (
		<div className="space-y-3 p-4">
			<Skeleton className="h-6 w-1/3" />
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-5/6" />
			<Skeleton className="h-4 w-2/3" />
		</div>
	);
}

function RouteComponent() {
	const { category, sortBy, sortOrder, page } = Route.useSearch();
	const { data } = useSuspenseQuery(
		memoriesQueryOptions(category, sortBy ?? "updatedAt", sortOrder ?? "desc", page ?? 1),
	);

	const { user } = Route.useRouteContext();
	const navigate = useNavigate();
	const { id } = useParams({ strict: false });
	// /memories/new has no id, but it still needs the sheet open on mobile.
	const isNewRoute = useMatch({ from: "/_authed/memories/new/", shouldThrow: false }) !== undefined;
	const urlId = isNewRoute ? NEW_KEY : (id ?? null);

	const [openId, setOpenId] = useState(urlId);
	const [prevUrlId, setPrevUrlId] = useState(urlId);
	if (urlId !== prevUrlId) {
		setPrevUrlId(urlId);
		setOpenId(urlId);
	}

	const isLoadingContent = openId !== null && openId !== urlId;

	function openMemory(memoryId: string) {
		setOpenId(memoryId);
		void navigate({ to: "/memories/$id", params: { id: memoryId } });
	}

	function openNewMemory() {
		setOpenId(NEW_KEY);
		void navigate({ to: "/memories/new" });
	}

	async function signOut() {
		await authClient.signOut();
		void navigate({ to: "/sign-in" });
	}

	return (
		<WorkspaceProvider
			mainOpen={openId !== null}
			onMainOpenChange={(open) => {
				if (!open) setOpenId(null);
			}}
			onMainOpenChangeComplete={(open) => {
				if (!open && urlId !== null) void navigate({ to: "/memories", search: (prev) => prev });
			}}
		>
			<Workspace
				primarySidebar={
					<MemoryExplorer
						memories={data.memories}
						selectedId={openId === NEW_KEY ? null : openId}
						onSelect={openMemory}
						onNewMemory={openNewMemory}
						header={
							<>
								<span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
									<RiBrainLine className="size-4" />
								</span>
								<span className="truncate font-heading text-base font-medium">Memory Harness</span>
							</>
						}
						footer={
							<UserMenu
								name={user.name}
								email={user.email}
								image={user.image}
								onOpenConnections={() => void navigate({ to: "/connections" })}
								onSignOut={signOut}
							/>
						}
					/>
				}
				main={isLoadingContent ? <MemorySheetSkeleton /> : <Outlet />}
			/>
		</WorkspaceProvider>
	);
}

export const Route = createFileRoute("/_authed/memories")({
	ssr: false,
	validateSearch: z.object({
		category: z.enum(categoryIdEnum.enumValues).optional(),
		sortBy: z.enum(sortByEnum).optional(),
		sortOrder: z.enum(sortOrderEnum).optional(),
		page: z.coerce.number().int().positive().optional().catch(undefined),
	}),
	loaderDeps: ({ search }) => ({
		category: search.category,
		sortBy: search.sortBy,
		sortOrder: search.sortOrder,
		page: search.page,
	}),
	loader: ({ context, deps }) =>
		context.queryClient.query(
			memoriesQueryOptions(deps.category, deps.sortBy ?? "updatedAt", deps.sortOrder ?? "desc", deps.page ?? 1),
		),
	pendingComponent: MemoriesSkeleton,
	component: RouteComponent,
});
