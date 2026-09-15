import * as React from "react"
import { RiCloseLine } from "@remixicon/react"
import { cn } from "cn"
import { Badge } from "#/components/ui/badge"

type TagsInputProps = Omit<React.ComponentProps<"input">, "value" | "defaultValue" | "onChange" | "type"> & {
    value?: string[]
    defaultValue?: string[]
    onValueChange?: (value: string[]) => void
    maxTags?: number
    allowDuplicates?: boolean
    delimiters?: string[]
}

function TagsInput({
    value,
    defaultValue = [],
    onValueChange,
    maxTags,
    allowDuplicates = false,
    delimiters = ["Enter", ","],
    placeholder = "Add a tag...",
    disabled,
    className,
    id,
    ref,
    ...props
}: TagsInputProps & { ref?: React.Ref<HTMLInputElement> }) {
    const isControlled = value !== undefined
    const [internalTags, setInternalTags] = React.useState<string[]>(defaultValue)
    const tags = isControlled ? value : internalTags
    const [draft, setDraft] = React.useState("")
    const inputRef = React.useRef<HTMLInputElement>(null)
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    const atMax = typeof maxTags === "number" && tags.length >= maxTags

    const setTags = (next: string[]) => {
        if (!isControlled) setInternalTags(next)
        onValueChange?.(next)
    }

    const commitTag = (raw: string) => {
        const tag = raw.trim()
        if (!tag || atMax) return
        if (!allowDuplicates && tags.includes(tag)) {
            setDraft("")
            return
        }
        setTags([...tags, tag])
        setDraft("")
    }

    const removeTag = (index: number) => {
        if (disabled) return
        setTags(tags.filter((_, i) => i !== index))
    }

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (delimiters.includes(event.key)) {
            if (draft.trim()) {
                event.preventDefault()
                commitTag(draft)
            }
            return
        }

        if (event.key === "Backspace" && draft === "" && tags.length > 0) {
            event.preventDefault()
            removeTag(tags.length - 1)
        }
    }

    const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
        const text = event.clipboardData.getData("text")
        if (!text.includes(",") && !text.includes("\n")) return
        event.preventDefault()

        const parts = text
            .split(/[,\n]/)
            .map((part) => part.trim())
            .filter(Boolean)

        let next = tags
        for (const part of parts) {
            if (typeof maxTags === "number" && next.length >= maxTags) break
            if (!allowDuplicates && next.includes(part)) continue
            next = [...next, part]
        }
        setTags(next)
        setDraft("")
    }

    const handleBlur = () => {
        if (draft.trim()) commitTag(draft)
    }

    return (
        <div
            onClick={() => inputRef.current?.focus()}
            data-slot="tags-input"
            className={cn(
                "flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-3xl border border-transparent bg-input/50 px-3 py-1.5 transition-[color,box-shadow,background-color] outline-none has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/30",
                disabled && "pointer-events-none cursor-not-allowed opacity-50",
                className,
            )}
        >
            {tags.map((tag, index) => (
                <Badge key={`${tag}-${index}`} variant="secondary" data-icon={disabled ? undefined : "inline-end"}>
                    {tag}
                    {!disabled && (
                        <button
                            type="button"
                            aria-label={`Remove ${tag}`}
                            onClick={(event) => {
                                event.stopPropagation()
                                removeTag(index)
                            }}
                            className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        >
                            <RiCloseLine className="size-3" />
                        </button>
                    )}
                </Badge>
            ))}
            <input
                ref={inputRef}
                id={id}
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                onBlur={handleBlur}
                placeholder={tags.length === 0 ? placeholder : atMax ? "" : undefined}
                disabled={disabled || atMax}
                className="h-6 min-w-24 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed md:text-sm"
                {...props}
            />
        </div>
    )
}

export { TagsInput }
