import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Skeleton } from "#/components/ui/skeleton";
import { Workspace } from "#/components/workspace";
import { categoryIdEnum } from "#/lib/db/schema";
import type { CategoryId } from "#/lib/memory/category";
import { getMemoriesFn, type SortBy, type SortOrder, sortByEnum, sortOrderEnum } from "#/lib/server/memories.function";

const PAGE_SIZE = 20;

const memoriesQueryOptions = (categoryId: CategoryId | undefined, sortBy: SortBy, sortOrder: SortOrder, page: number) =>
	queryOptions({
		queryKey: ["memories", { categoryId: categoryId ?? "all", sortBy, sortOrder, page }],
		queryFn: () =>
			getMemoriesFn({
				data: { categoryId, sortBy, sortOrder, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE },
			}),
	});

function MemoriesSkeleton() {
	return (
		<div className="space-y-4 p-4">
			<Skeleton className="h-9 w-80 rounded-3xl" />

			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex items-center gap-2">
					<Skeleton className="h-9 w-32 rounded-3xl" />
					<Skeleton className="h-9 w-28 rounded-3xl" />
				</div>
				<Skeleton className="h-9 w-36 rounded-3xl" />
			</div>

			<div className="min-h-96 space-y-2">
				{["skeleton-1", "skeleton-2", "skeleton-3", "skeleton-4", "skeleton-5", "skeleton-6"].map((key) => (
					<Skeleton key={key} className="h-16 w-full" />
				))}
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

	const navigate = useNavigate();
	const { id } = useParams({ strict: false });
	const urlId = id ?? null;


	const [openId, setOpenId] = useState(urlId);
	const [prevUrlId, setPrevUrlId] = useState(urlId);
	if (urlId !== prevUrlId) {
		setPrevUrlId(urlId);
		setOpenId(urlId);
	}

	const isLoadingContent = openId !== null && openId !== urlId;

	return (
		<Workspace
			isMainOpen={openId !== null}
			onMainOpenChange={(open) => {
				if (!open) setOpenId(null);
			}}
			onMainOpenChangeComplete={(open) => {
				if (!open && urlId !== null) void navigate({ to: "/memories", search: (prev) => prev });
			}}
			primarySidebar={
				<>
					<div>primarySidebar</div>
					<div>
						{data.memories.map((memory) => (
							<Link to="/memories/$id" params={{ id: memory.id }} key={memory.id} onClick={() => setOpenId(memory.id)}>
								{memory.name}
							</Link>
						))}
					</div>
				</>
			}
			main={isLoadingContent ? <MemorySheetSkeleton /> : <Outlet />}
		/>
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
