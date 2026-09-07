import { useMemo, useState } from "react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Badge } from "#/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "#/components/ui/tabs"
import { RiAddLine, RiSearchLine, RiBrainLine, RiFileTextLine, RiListCheck2 } from "@remixicon/react"
import type { CategoryId } from "./-mock-memories"
import { CATEGORY_META, MOCK_MEMORIES, formatBytes, formatRelativeTime } from "./-mock-memories"

export const Route = createFileRoute("/_authed/memories/")({
    component: RouteComponent,
})

function RouteComponent() {
    const [query, setQuery] = useState("")
    const [activeCategory, setActiveCategory] = useState<CategoryId | "all">("all")

    const filtered = useMemo(() => {
        return MOCK_MEMORIES.filter((memory) => {
            const matchesCategory = activeCategory === "all" || memory.categoryId === activeCategory
            const matchesQuery =
                query.trim() === "" ||
                memory.displayName.toLowerCase().includes(query.toLowerCase()) ||
                memory.description.toLowerCase().includes(query.toLowerCase()) ||
                memory.path.toLowerCase().includes(query.toLowerCase())
            return matchesCategory && matchesQuery
        })
    }, [activeCategory, query])

    return (
        <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6 md:p-8">
            <div className="flex flex-col gap-1">
                <h1 className="font-heading text-2xl font-medium">Memories</h1>
                <p className="text-sm text-muted-foreground">
                    Everything remembered across categories, sessions, and topics.
                </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as CategoryId | "all")}>
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        {(Object.keys(CATEGORY_META) as CategoryId[]).map((categoryId) => (
                            <TabsTrigger key={categoryId} value={categoryId}>
                                {CATEGORY_META[categoryId].label}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <RiSearchLine className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search memories..."
                            className="w-full pl-9 sm:w-56"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                        />
                    </div>

                    <Button data-icon="inline-start" nativeButton={false} render={<Link to="/memories/new" />}>
                        <RiAddLine />
                        New memory
                    </Button>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center">
                    <RiBrainLine className="size-8 text-muted-foreground" />
                    <p className="text-sm font-medium">No memories found</p>
                    <p className="text-sm text-muted-foreground">Try a different search or category.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filtered.map((memory) => {
                        const CategoryIcon = CATEGORY_META[memory.categoryId].icon
                        return (
                            <Link
                                key={memory.id}
                                to="/memories/$memory_id"
                                params={{ memory_id: memory.id }}
                                className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-xs transition-shadow hover:shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                                            <CategoryIcon className="size-4 text-foreground/70" />
                                        </span>
                                        <h2 className="font-heading text-sm font-medium">{memory.displayName}</h2>
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

                                <p className="line-clamp-2 text-sm text-muted-foreground">{memory.description}</p>

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
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
