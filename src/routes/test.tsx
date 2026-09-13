import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { TagsInput } from "#/components/ui/tag-input"
import { Textarea } from "#/components/ui/textarea"
import { cn } from "#/lib/utils"
import { RiFileTextLine, RiListCheck2, RiPriceTag3Line } from "@remixicon/react"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"

export const Route = createFileRoute("/test")({
    component: RouteComponent,
})

type PropertyRowProps = {
    icon: React.ComponentType<{ className?: string }>
    label: string
    children: React.ReactNode
}

function PropertyRow({ icon: Icon, label, children }: PropertyRowProps) {
    return (
        <div className="group flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-muted/50">
            <div className="flex w-32 shrink-0 items-center gap-2 text-sm text-muted-foreground">
                <Icon className="size-4" />
                {label}
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

    return (
        <div className="p-4">
            <section className="mx-auto flex max-w-2xl flex-col gap-6">
                <div className={cn("flex flex-col gap-0.5 rounded-2xl border border-border bg-card p-3")}>
                    <span className="px-2 pb-1 text-xs font-medium text-muted-foreground">Properties</span>
                    <PropertyRow icon={RiFileTextLine} label="Name">
                        <Input
                            value={name}
                            placeholder="Empty"
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
            </section>
        </div>
    )
}
