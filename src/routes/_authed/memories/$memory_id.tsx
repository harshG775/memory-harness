import { createFileRoute, Link, notFound } from "@tanstack/react-router"
import { Button } from "#/components/ui/button"
import { Badge } from "#/components/ui/badge"
import {
    RiArrowLeftLine,
    RiFileTextLine,
    RiListCheck2,
    RiPencilLine,
    RiDeleteBinLine,
} from "@remixicon/react"
import { CATEGORY_META, MOCK_MEMORIES, formatBytes, formatRelativeTime } from "./-mock-memories"

export const Route = createFileRoute("/_authed/memories/$memory_id")({
    loader: ({ params }) => {
        const memory = MOCK_MEMORIES.find((item) => item.id === params.memory_id)
        if (!memory) throw notFound()
        return memory
    },
    component: RouteComponent,
})

function RouteComponent() {
    const memory = Route.useLoaderData()
    const CategoryIcon = CATEGORY_META[memory.categoryId].icon

    return (
        <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
            <Link
                to="/memories"
                className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
                <RiArrowLeftLine className="size-4" />
                Memories
            </Link>

            <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xs">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                            <CategoryIcon className="size-5 text-foreground/70" />
                        </span>
                        <div className="flex flex-col gap-0.5">
                            <h1 className="font-heading text-lg font-medium">{memory.displayName}</h1>
                            <span className="font-mono text-xs text-muted-foreground">{memory.path}</span>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <Badge variant="outline">{CATEGORY_META[memory.categoryId].label}</Badge>
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
                </div>

                <p className="text-sm text-muted-foreground">{memory.description}</p>

                <div className="flex items-center gap-3 border-y border-border py-3 text-xs text-muted-foreground">
                    <span>{formatBytes(memory.sizeBytes)}</span>
                    <span>&middot;</span>
                    <span>Updated {formatRelativeTime(memory.updatedAt)}</span>
                </div>

                <pre className="overflow-x-auto rounded-2xl bg-muted p-4 text-sm whitespace-pre-wrap text-foreground/90">
                    {memory.content}
                </pre>

                <div className="flex justify-end gap-2">
                    <Button variant="outline" data-icon="inline-start">
                        <RiPencilLine />
                        Edit
                    </Button>
                    <Button variant="destructive" data-icon="inline-start">
                        <RiDeleteBinLine />
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    )
}
