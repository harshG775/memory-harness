import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query"
import { z } from "zod"
import { RiBrainLine } from "@remixicon/react"
import { getMemoriesFn } from "#/lib/server/memories.function"
import { categoryIdEnum } from "#/lib/db/schema/memory-schema"
import { Skeleton } from "#/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs"
import { Button } from "#/components/ui/button"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "#/components/ui/empty"

type CategoryId = (typeof categoryIdEnum.enumValues)[number]

const CATEGORY_LABELS: Record<CategoryId, string> = {
    you: "You",
    topics: "Topics",
    areas: "Areas",
    people: "People",
    sessions: "Sessions",
}

const PAGE_SIZE = 20

const memoriesQueryOptions = (categoryId: CategoryId | undefined, page: number) =>
    queryOptions({
        queryKey: ["memories", { categoryId: categoryId ?? "all", page }],
        queryFn: () => getMemoriesFn({ data: { categoryId, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE } }),
    })

export const Route = createFileRoute("/_authed/memories/")({
    validateSearch: z.object({
        category: z.enum(categoryIdEnum.enumValues).optional(),
        page: z.coerce.number().int().positive().optional().catch(undefined),
    }),
    loaderDeps: ({ search }) => ({ category: search.category, page: search.page }),
    loader: ({ context, deps }) => context.queryClient.query(memoriesQueryOptions(deps.category, deps.page ?? 1)),
    pendingComponent: MemoriesSkeleton,
    component: RouteComponent,
})

function RouteComponent() {
    const navigate = useNavigate({ from: Route.fullPath })
    const { category, page } = Route.useSearch()
    const activeCategory = category ?? "all"
    const currentPage = page ?? 1
    const { data } = useSuspenseQuery(memoriesQueryOptions(category, currentPage))

    function setActiveCategory(next: CategoryId | "all") {
        void navigate({ search: { category: next === "all" ? undefined : next, page: undefined } })
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
                    <div className="space-y-2">
                        {data.memories.map((memory) => (
                            <div key={memory.id} className="rounded-2xl border p-4">
                                <p className="font-medium">{memory.displayName}</p>
                                <p className="text-muted-foreground text-sm">{memory.description}</p>
                            </div>
                        ))}
                    </div>

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
                </>
            )}
        </div>
    )
}

function MemoriesSkeleton() {
    return (
        <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
            ))}
        </div>
    )
}
