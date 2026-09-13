import { useState } from "react"
import { createFileRoute, notFound, useRouter, useNavigate } from "@tanstack/react-router"
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query"
import { z } from "zod"
import {
    RiArrowLeftLine,
    RiFileTextLine,
    RiListCheck2,
    RiPriceTag3Line,
    RiDeleteBinLine,
    RiPencilLine,
} from "@remixicon/react"
import { creatableCategoryIdEnum, deleteMemoryFn, getMemoryByIdFn, updateMemoryFn } from "#/lib/server/memories.function"
import { parseMarkdown, stringifyMarkdown } from "#/lib/memory/markdown"
import type { CategoryId } from "#/lib/memory/category"
import { CATEGORY_LABELS, CATEGORY_ICONS } from "#/lib/memory/category"
import { formatBytes, formatRelativeTime } from "#/lib/memory/format"
import { cn } from "#/lib/utils"
import { Button } from "#/components/ui/button"
import { Badge } from "#/components/ui/badge"
import { Input } from "#/components/ui/input"
import { Label } from "#/components/ui/label"
import { Textarea } from "#/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "#/components/ui/select"
import { TagsInput } from "#/components/ui/tag-input"

type CreatableCategoryId = (typeof creatableCategoryIdEnum)[number]

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

const memoryQueryOptions = (id: string) =>
    queryOptions({
        queryKey: ["memory", id],
        queryFn: () => getMemoryByIdFn({ data: { id } }),
    })

export const Route = createFileRoute("/_authed/memories/$memory_id/")({
    validateSearch: z.object({
        edit: z.boolean().optional(),
    }),
    loader: async ({ context, params }) => {
        const memory = await context.queryClient.query(memoryQueryOptions(params.memory_id))
        if (!memory) throw notFound()
    },
    component: RouteComponent,
})

function RouteComponent() {
    const { memory_id } = Route.useParams()
    const { edit } = Route.useSearch()
    const { data: memory } = useSuspenseQuery(memoryQueryOptions(memory_id))
    const router = useRouter()
    const navigate = useNavigate({ from: Route.fullPath })
    const queryClient = useQueryClient()

    const [categoryId, setCategoryId] = useState<CreatableCategoryId>(
        (memory?.categoryId as CreatableCategoryId | undefined) ?? creatableCategoryIdEnum[0],
    )
    const [name, setName] = useState(memory?.name ?? "")
    const [description, setDescription] = useState(memory?.description ?? "")
    const [sources, setSources] = useState<string[]>(memory ? parseMarkdown(memory.content).frontmatter.sources : [])
    const [aliases, setAliases] = useState<string[]>(memory ? parseMarkdown(memory.content).frontmatter.aliases : [])
    const [content, setContent] = useState(memory ? parseMarkdown(memory.content).content : "")

    const { mutate: deleteMemory, isPending: isDeleting } = useMutation({
        mutationFn: deleteMemoryFn,
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["memories"] })
            void navigate({ to: "/memories" })
        },
    })

    const {
        mutate: saveMemory,
        isPending: isSaving,
        error: saveError,
    } = useMutation({
        mutationFn: updateMemoryFn,
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["memories"] }),
                queryClient.invalidateQueries({ queryKey: ["memory", memory_id] }),
            ])
            void navigate({ search: (prev) => ({ ...prev, edit: undefined }) })
        },
    })

    if (!memory) return null

    const isEditing = edit === true
    const CategoryIcon = CATEGORY_ICONS[memory.categoryId]

    const handleBack = () => {
        if (router.history.canGoBack()) {
            router.history.back()
        } else {
            void navigate({ to: "/memories" })
        }
    }

    const startEdit = () => {
        const parsed = parseMarkdown(memory.content)
        setCategoryId(memory.categoryId as CreatableCategoryId)
        setName(parsed.frontmatter.name)
        setDescription(parsed.frontmatter.description)
        setSources(parsed.frontmatter.sources)
        setAliases(parsed.frontmatter.aliases)
        setContent(parsed.content)
        void navigate({ search: (prev) => ({ ...prev, edit: true }) })
    }

    const cancelEdit = () => {
        void navigate({ search: (prev) => ({ ...prev, edit: undefined }) })
    }

    const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        saveMemory({
            data: {
                id: memory_id,
                categoryId,
                content: stringifyMarkdown({
                    frontmatter: { name, description, sources, aliases },
                    content,
                }),
            },
        })
    }

    return (
        <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
            <button
                type="button"
                onClick={handleBack}
                className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
                <RiArrowLeftLine className="size-4" />
                Memories
            </button>

            {isEditing ? (
                <form onSubmit={handleSubmit}>
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="category">Category</Label>
                            <Select
                                value={categoryId}
                                onValueChange={(value) => setCategoryId(value as CreatableCategoryId)}
                            >
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

                        <div className="flex flex-col gap-0.5 rounded-2xl border border-border bg-card p-3">
                            <div className="mb-1 text-sm font-medium">Properties</div>
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
                                    className={ghostTagsInputClassName}
                                    placeholder="Empty"
                                />
                            </PropertyRow>
                            <PropertyRow icon={RiPriceTag3Line} label="Aliases">
                                <TagsInput
                                    value={aliases}
                                    onValueChange={setAliases}
                                    className={ghostTagsInputClassName}
                                    placeholder="Empty"
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

                    {saveError && <p className="text-sm text-destructive">{saveError.message}</p>}

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={cancelEdit} disabled={isSaving}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </form>
            ) : (
                <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xs">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
                                <CategoryIcon className="size-5 text-foreground/70" />
                            </span>
                            <div className="flex flex-col gap-0.5">
                                <h1 className="font-heading text-lg font-medium">{memory.name}</h1>
                                <span className="font-mono text-xs text-muted-foreground">{memory.path}</span>
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            <Badge variant="outline">{CATEGORY_LABELS[memory.categoryId]}</Badge>
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
                        <span className="flex items-center gap-1">
                            <span
                                className={cn(
                                    "size-1.5 rounded-full",
                                    memory.embedding ? "bg-emerald-500" : "bg-muted-foreground/40",
                                )}
                            />
                            {memory.embedding ? "Embedded" : "Not embedded"}
                        </span>
                        <span>&middot;</span>
                        <span>{formatBytes(memory.sizeBytes)}</span>
                        <span>&middot;</span>
                        <span>Updated {formatRelativeTime(memory.updatedAt)}</span>
                    </div>

                    <pre className="overflow-x-auto rounded-2xl bg-muted p-4 text-sm whitespace-pre-wrap text-foreground/90">
                        {memory.content}
                    </pre>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" data-icon="inline-start" onClick={startEdit}>
                            <RiPencilLine />
                            Edit
                        </Button>
                        <Button
                            variant="destructive"
                            data-icon="inline-start"
                            disabled={isDeleting}
                            onClick={() => deleteMemory({ data: { id: memory.id } })}
                        >
                            <RiDeleteBinLine />
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
