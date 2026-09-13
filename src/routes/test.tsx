import { Button } from "#/components/ui/button"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { TagsInput } from "#/components/ui/tag-input"
import { Textarea } from "#/components/ui/textarea"
import { stringifyMarkdown } from "#/lib/memory/markdown"
import { cn } from "#/lib/utils"
import { RiArrowLeftLine, RiFileTextLine, RiListCheck2, RiPriceTag3Line } from "@remixicon/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

export const Route = createFileRoute("/test")({
    component: RouteComponent,
})

type PropertyRowProps = {
    icon: React.ComponentType<{ className?: string }>
    label: string
    required?: boolean
    children: React.ReactNode
}

function PropertyRow({ icon: Icon, label, required, children }: PropertyRowProps) {
    return (
        <div className="group flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted/50">
            <div className="flex w-32 shrink-0 items-center gap-2 text-sm text-muted-foreground">
                <Icon className="size-4" />
                {label}
                {required && <span className="text-destructive">*</span>}
            </div>
            <div className="flex-1">{children}</div>
        </div>
    )
}

const ghostInputClassName =
    "h-7 flex-1 rounded-md border-none bg-transparent px-1.5 shadow-none focus-visible:bg-background focus-visible:ring-1"
const ghostTagsInputClassName =
    "min-h-7 rounded-md border-none bg-transparent px-1.5 py-0.5 shadow-none has-[input:focus-visible]:bg-background has-[input:focus-visible]:ring-1"

function RouteComponent() {
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [sources, setSources] = useState<string[]>([])
    const [aliases, setAliases] = useState<string[]>([])
    const [content, setContent] = useState("")

    const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
        const payload = {
            frontmatter: {
                name,
                description,
                sources,
                aliases,
            },
            content,
        }
        const markdown = stringifyMarkdown(payload)
        console.log("final markdown:\n", markdown)

        // createMemoryFn(payload)
    }
    return (
        <div className="p-4">
            <section className="mx-auto flex max-w-2xl flex-col gap-6">
                <Link
                    to="/memories"
                    className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                    replace
                >
                    <RiArrowLeftLine className="size-4" />
                    Memories
                </Link>

                <div className="flex flex-col gap-1">
                    <h1 className="font-heading text-2xl font-medium">New memory</h1>
                    <p className="text-sm text-muted-foreground">Add a new entry to the memory store.</p>
                </div>

                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        handleSubmit(e)
                    }}
                >
                    <div className={cn("flex flex-col gap-2 rounded-2xl border border-border bg-card p-3")}>
                        <div>
                            <div className="text-sm font-medium mb-1">Properties</div>
                            <PropertyRow icon={RiFileTextLine} label="Name" required>
                                <Input
                                    value={name}
                                    placeholder="Empty"
                                    required
                                    onChange={(event) => setName(event.target.value)}
                                    className={ghostInputClassName}
                                />
                            </PropertyRow>
                            <PropertyRow icon={RiFileTextLine} label="Description">
                                <Input
                                    value={description}
                                    placeholder="Empty"
                                    onChange={(event) => setDescription(event.target.value)}
                                    className={ghostInputClassName}
                                />
                            </PropertyRow>
                            <PropertyRow icon={RiListCheck2} label="Sources">
                                <TagsInput
                                    value={sources}
                                    onValueChange={setSources}
                                    placeholder="Empty"
                                    className={ghostTagsInputClassName}
                                />
                            </PropertyRow>
                            <PropertyRow icon={RiPriceTag3Line} label="Aliases">
                                <TagsInput
                                    value={aliases}
                                    onValueChange={setAliases}
                                    placeholder="Empty"
                                    className={ghostTagsInputClassName}
                                />
                            </PropertyRow>
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
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" nativeButton={false} render={<Link to="/memories" />}>
                            Cancel
                        </Button>
                        <Button type="submit">Create</Button>
                    </div>
                </form>
            </section>
        </div>
    )
}
