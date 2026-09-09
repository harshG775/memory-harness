import { createFileRoute, useNavigate, Link } from "@tanstack/react-router"
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query"
import { z } from "zod"
import {
    RiAddLine,
    RiBrainLine,
    RiPriceTag3Line,
    RiCompassLine,
    RiUserLine,
    RiHistoryLine,
    RiFileTextLine,
    RiListCheck2,
} from "@remixicon/react"
import type { SortBy, SortOrder } from "#/lib/server/memories.function"
import { getMemoriesFn, sortByEnum, sortOrderEnum } from "#/lib/server/memories.function"
import { categoryIdEnum } from "#/lib/db/schema/memory-schema"
import { formatBytes, formatRelativeTime } from "#/lib/memory/format"
import { Skeleton } from "#/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs"
import { Button } from "#/components/ui/button"
import { Badge } from "#/components/ui/badge"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "#/components/ui/empty"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select"

type CategoryId = (typeof categoryIdEnum.enumValues)[number]

const CATEGORY_LABELS: Record<CategoryId, string> = {
    you: "You",
    topics: "Topics",
    areas: "Areas",
    people: "People",
    sessions: "Sessions",
}

const CATEGORY_ICONS: Record<CategoryId, typeof RiBrainLine> = {
    you: RiBrainLine,
    topics: RiPriceTag3Line,
    areas: RiCompassLine,
    people: RiUserLine,
    sessions: RiHistoryLine,
}

const SORT_LABELS: Record<SortBy, string> = {
    updatedAt: "Last updated",
    createdAt: "Date created",
    displayName: "Name",
}

const SORT_ORDER_LABELS: Record<SortOrder, string> = {
    desc: "Descending",
    asc: "Ascending",
}

const PAGE_SIZE = 20

const memoriesQueryOptions = (categoryId: CategoryId | undefined, sortBy: SortBy, sortOrder: SortOrder, page: number) =>
    queryOptions({
        queryKey: ["memories", { categoryId: categoryId ?? "all", sortBy, sortOrder, page }],
        queryFn: () =>
            getMemoriesFn({
                data: { categoryId, sortBy, sortOrder, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE },
            }),
    })

export const Route = createFileRoute("/_authed/memories/")({
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
})

function RouteComponent() {
    const navigate = useNavigate({ from: Route.fullPath })
    const { category, sortBy, sortOrder, page } = Route.useSearch()
    const activeCategory = category ?? "all"
    const activeSortBy = sortBy ?? "updatedAt"
    const activeSortOrder = sortOrder ?? "desc"
    const currentPage = page ?? 1
    const { data } = useSuspenseQuery(memoriesQueryOptions(category, activeSortBy, activeSortOrder, currentPage))

    const groupedMemories = categoryIdEnum.enumValues
        .map((categoryId) => ({
            categoryId,
            items: data.memories.filter((memory) => memory.categoryId === categoryId),
        }))
        .filter((group) => group.items.length > 0)

    function setActiveCategory(next: CategoryId | "all") {
        void navigate({ search: (prev) => ({ ...prev, category: next === "all" ? undefined : next, page: undefined }) })
    }

    function setSortBy(next: SortBy) {
        void navigate({
            search: (prev) => ({ ...prev, sortBy: next === "updatedAt" ? undefined : next, page: undefined }),
        })
    }

    function setSortOrder(next: SortOrder) {
        void navigate({
            search: (prev) => ({ ...prev, sortOrder: next === "desc" ? undefined : next, page: undefined }),
        })
    }

    function setPage(next: number) {
        void navigate({ search: (prev) => ({ ...prev, page: next === 1 ? undefined : next }) })
    }

    return (
        <div className="space-y-4 p-4">
            <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as CategoryId | "all")}>
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    {categoryIdEnum.enumValues.map((categoryId) => (
                        <TabsTrigger key={categoryId} value={categoryId}>
                            {CATEGORY_LABELS[categoryId]}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Select value={activeSortBy} onValueChange={(value) => setSortBy(value as SortBy)}>
                        <SelectTrigger size="sm">
                            <SelectValue>{(value: SortBy) => SORT_LABELS[value]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {sortByEnum.map((value) => (
                                <SelectItem key={value} value={value}>
                                    {SORT_LABELS[value]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={activeSortOrder} onValueChange={(value) => setSortOrder(value as SortOrder)}>
                        <SelectTrigger size="sm">
                            <SelectValue>{(value: SortOrder) => SORT_ORDER_LABELS[value]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {sortOrderEnum.map((value) => (
                                <SelectItem key={value} value={value}>
                                    {SORT_ORDER_LABELS[value]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Button data-icon="inline-start" nativeButton={false} render={<Link to="/memories/new" />}>
                    <RiAddLine />
                    New memory
                </Button>
            </div>

            {data.memories.length === 0 ? (
                <Empty>
                    <EmptyHeader>
                        <EmptyMedia variant="icon">
                            <RiBrainLine />
                        </EmptyMedia>
                        <EmptyTitle>No memories found</EmptyTitle>
                        <EmptyDescription>
                            {activeCategory === "all"
                                ? "Nothing has been remembered yet."
                                : "No memories in this category yet."}
                        </EmptyDescription>
                    </EmptyHeader>
                </Empty>
            ) : (
                <>
                    <div className="min-h-96 space-y-6">
                        {groupedMemories.map((group) => {
                            const CategoryIcon = CATEGORY_ICONS[group.categoryId]
                            return (
                                <section key={group.categoryId} className="space-y-2">
                                    <h2 className="text-sm font-medium text-muted-foreground">
                                        {CATEGORY_LABELS[group.categoryId]}
                                    </h2>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        {group.items.map((memory) => (
                                            <div
                                                key={memory.id}
                                                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-xs"
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                                                            <CategoryIcon className="size-4 text-foreground/70" />
                                                        </span>
                                                        <h3 className="font-heading text-sm font-medium">
                                                            {memory.displayName}
                                                        </h3>
                                                    </div>
                                                    {memory.kind === "toc" ? (
                                                        <Badge variant="secondary" data-icon="inline-start">
                                                            <RiListCheck2 />
                                                            TOC
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline" data-icon="inline-start">
                                                            <RiFileTextLine />
                                                            Entry
                                                        </Badge>
                                                    )}
                                                </div>

                                                <p className="line-clamp-2 text-sm text-muted-foreground">
                                                    {memory.description}
                                                </p>

                                                <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                                                    <span className="truncate font-mono text-xs text-muted-foreground">
                                                        {memory.path}
                                                    </span>
                                                    <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                                                        <span>{formatBytes(memory.sizeBytes)}</span>
                                                        <span>&middot;</span>
                                                        <span>{formatRelativeTime(memory.updatedAt)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )
                        })}
                    </div>

                    {data.total > PAGE_SIZE && (
                        <div className="flex items-center justify-between pt-2">
                            <p className="text-muted-foreground text-sm">
                                {`${(currentPage - 1) * PAGE_SIZE + 1}-${(currentPage - 1) * PAGE_SIZE + data.memories.length} of ${data.total}`}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => setPage(currentPage - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!data.hasMore}
                                    onClick={() => setPage(currentPage + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

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
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                ))}
            </div>
        </div>
    )
}
