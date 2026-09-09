import {
    RiBrainLine,
    RiPriceTag3Line,
    RiCompassLine,
    RiUserLine,
    RiHistoryLine,
} from "@remixicon/react"

export type CategoryId = "you" | "topics" | "areas" | "people" | "sessions"
export type MemoryKind = "entry" | "toc"

export type MemoryItem = {
    id: string
    path: string
    displayName: string
    description: string
    content: string
    categoryId: CategoryId
    kind: MemoryKind
    sizeBytes: number
    updatedAt: Date
}

export const CATEGORY_META: Record<CategoryId, { label: string; icon: typeof RiBrainLine }> = {
    you: { label: "You", icon: RiBrainLine },
    topics: { label: "Topics", icon: RiPriceTag3Line },
    areas: { label: "Areas", icon: RiCompassLine },
    people: { label: "People", icon: RiUserLine },
    sessions: { label: "Sessions", icon: RiHistoryLine },
}

// "you" is a fixed pair (profile + preferences) seeded outside this flow, so it's
// not offered as a destination for freeform new memories.
export const CREATABLE_CATEGORIES = (Object.keys(CATEGORY_META) as CategoryId[]).filter(
    (categoryId) => categoryId !== "you"
)

export function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatRelativeTime(date: Date) {
    const diffMs = Date.now() - date.getTime()
    const diffMin = Math.round(diffMs / (1000 * 60))
    if (diffMin < 1) return "just now"
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.round(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    const diffDay = Math.round(diffHr / 24)
    return `${diffDay}d ago`
}

export function slugify(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

export const MOCK_MEMORIES: MemoryItem[] = [
    {
        id: "1",
        path: "you/preferences.md",
        displayName: "Preferences",
        description: "Communication style, tone, and formatting preferences for responses.",
        content: "- Keep responses concise and direct.\n- Prefer code examples over long explanations.\n- Use markdown tables for comparisons.",
        categoryId: "you",
        kind: "entry",
        sizeBytes: 2140,
        updatedAt: new Date(Date.now() - 1000 * 60 * 45),
    },
    {
        id: "1b",
        path: "you/profile.md",
        displayName: "Profile",
        description: "Name, role, timezone, and other identifying details.",
        content: "Name: Harsh\nRole: Developer\nTimezone: Asia/Kolkata (IST, UTC+5:30)",
        categoryId: "you",
        kind: "entry",
        sizeBytes: 960,
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    },
    {
        id: "2",
        path: "topics/index.md",
        displayName: "Topics",
        description: "Table of contents for recurring topics across sessions.",
        content: "- memory-harness project\n- pgvector setup",
        categoryId: "topics",
        kind: "toc",
        sizeBytes: 512,
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6),
    },
    {
        id: "3",
        path: "topics/memory-harness.md",
        displayName: "memory-harness project",
        description: "Stack choices, schema decisions, and open threads for the memory-harness app.",
        content: "Stack: TanStack Start, Drizzle ORM, Neon Postgres, pgvector.\nAuth: better-auth with email OTP.\nOpen threads: migration baselining, memory detail UI.",
        categoryId: "topics",
        kind: "entry",
        sizeBytes: 4820,
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
    {
        id: "4",
        path: "areas/work.md",
        displayName: "Work",
        description: "Ongoing responsibilities and standing context for work-related tasks.",
        content: "Standing context for work-related tasks and responsibilities.",
        categoryId: "areas",
        kind: "entry",
        sizeBytes: 3110,
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    },
    {
        id: "5",
        path: "people/harsh.md",
        displayName: "Harsh",
        description: "Role, timezone, and recurring collaboration notes.",
        content: "Role: Developer\nTimezone: Asia/Kolkata\nNotes: prefers async updates over calls.",
        categoryId: "people",
        kind: "entry",
        sizeBytes: 1780,
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
        id: "6",
        path: "sessions/2026-09-07.md",
        displayName: "Sep 7 session",
        description: "pgvector setup, HNSW index, and migration baselining decisions.",
        content: "Enabled pgvector extension, added HNSW cosine index on memory.embedding, baselined the migrations journal against db:push history.",
        categoryId: "sessions",
        kind: "entry",
        sizeBytes: 6240,
        updatedAt: new Date(Date.now() - 1000 * 60 * 10),
    },
]

export function addMemory(input: {
    categoryId: CategoryId
    displayName: string
    description: string
    content: string
}) {
    const memory: MemoryItem = {
        id: crypto.randomUUID(),
        path: `${input.categoryId}/${slugify(input.displayName)}.md`,
        displayName: input.displayName,
        description: input.description,
        content: input.content,
        categoryId: input.categoryId,
        kind: "entry",
        sizeBytes: new Blob([input.content]).size,
        updatedAt: new Date(),
    }
    MOCK_MEMORIES.unshift(memory)
    return memory
}
