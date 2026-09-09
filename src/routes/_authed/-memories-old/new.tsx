import { useState } from "react"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Textarea } from "#/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select"
import { RiArrowLeftLine } from "@remixicon/react"
import type { CategoryId } from "./-mock-memories"
import { CATEGORY_META, CREATABLE_CATEGORIES, addMemory } from "./-mock-memories"

export const Route = createFileRoute("/_authed/memories/new")({
    component: RouteComponent,
})

function RouteComponent() {
    const navigate = useNavigate()

    const [category, setCategory] = useState<CategoryId>("topics")
    const [displayName, setDisplayName] = useState("")
    const [description, setDescription] = useState("")
    const [content, setContent] = useState("")

    function handleCreate(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        addMemory({ categoryId: category, displayName, description, content })
        void navigate({ to: "/memories" })
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
                onSubmit={handleCreate}
            >
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={(value) => setCategory(value as CategoryId)}>
                        <SelectTrigger id="category" className="w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {CREATABLE_CATEGORIES.map((categoryId) => (
                                <SelectItem key={categoryId} value={categoryId}>
                                    {CATEGORY_META[categoryId].label}
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
                        value={content}
                        onChange={(event) => setContent(event.target.value)}
                    />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="outline" nativeButton={false} render={<Link to="/memories" />}>
                        Cancel
                    </Button>
                    <Button type="submit">Create</Button>
                </div>
            </form>
        </div>
    )
}
