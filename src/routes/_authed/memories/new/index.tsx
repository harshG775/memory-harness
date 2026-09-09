import { useState } from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { RiArrowLeftLine } from "@remixicon/react"
import { createMemoryFn, creatableCategoryIdEnum } from "#/lib/server/memories.function"
import type { categoryIdEnum } from "#/lib/db/schema/memory-schema"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Textarea } from "#/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select"

type CategoryId = (typeof categoryIdEnum.enumValues)[number]
type CreatableCategoryId = (typeof creatableCategoryIdEnum)[number]

const CATEGORY_LABELS: Record<CategoryId, string> = {
    you: "You",
    topics: "Topics",
    areas: "Areas",
    people: "People",
    sessions: "Sessions",
}

export const Route = createFileRoute("/_authed/memories/new/")({
    component: RouteComponent,
})

function RouteComponent() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const [categoryId, setCategoryId] = useState<CreatableCategoryId>(creatableCategoryIdEnum[0])
    const [displayName, setDisplayName] = useState("")
    const [description, setDescription] = useState("")
    const [content, setContent] = useState("")

    const { mutate, isPending, error } = useMutation({
        mutationFn: createMemoryFn,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["memories"] })
            void navigate({ to: "/memories" })
        },
    })

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        mutate({ data: { categoryId, displayName, description, content } })
    }

    return (
        <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6 md:p-8">
            <Link
                to="/memories"
                className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
                <RiArrowLeftLine className="size-4" />
                Memories
            </Link>

            <div className="flex flex-col gap-1">
                <h1 className="font-heading text-2xl font-medium">New memory</h1>
                <p className="text-sm text-muted-foreground">Add a new entry to the memory store.</p>
            </div>

            <form
                className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-xs"
                onSubmit={handleSubmit}
            >
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="category">Category</Label>
                    <Select value={categoryId} onValueChange={(value) => setCategoryId(value as CreatableCategoryId)}>
                        <SelectTrigger id="category" className="w-full">
                            <SelectValue>{(value: CategoryId) => CATEGORY_LABELS[value]}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {creatableCategoryIdEnum.map((value) => (
                                <SelectItem key={value} value={value}>
                                    {CATEGORY_LABELS[value]}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="displayName">Display name</Label>
                    <Input
                        id="displayName"
                        required
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="description">Description</Label>
                    <Input
                        id="description"
                        required
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                        id="content"
                        className="min-h-40"
                        placeholder="Frontmatter (name, description, sources, aliases) is generated automatically — write the memory body here."
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                    />
                </div>

                {error && <p className="text-sm text-destructive">{error.message}</p>}

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" nativeButton={false} render={<Link to="/memories" />}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Creating..." : "Create"}
                    </Button>
                </div>
            </form>
        </div>
    )
}
