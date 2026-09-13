import { createServerFn } from "@tanstack/react-start"
import { authedMiddleware } from "./auth.middleware"
import { z } from "zod"
import { categoryIdEnum, memory } from "../db/schema/memory-schema"
import { db } from "../db"
import { and, asc, count, desc, eq, isNull, sql } from "drizzle-orm"
import { parseFrontMatter } from "../memory/markdown"
import { slugify } from "../slugify"

export const sortByEnum = ["updatedAt", "createdAt", "name"] as const
export type SortBy = (typeof sortByEnum)[number]

export const sortOrderEnum = ["asc", "desc"] as const
export type SortOrder = (typeof sortOrderEnum)[number]

const SORT_COLUMNS = {
    updatedAt: memory.updatedAt,
    createdAt: memory.createdAt,
    name: memory.name,
} as const

export const creatableCategoryIdEnum = categoryIdEnum.enumValues.filter((categoryId) => categoryId !== "you")

const memoryPayloadSchema = z.object({
    categoryId: z.enum(creatableCategoryIdEnum),
    content: z.string().default(""),
})

export const getMemoriesFn = createServerFn({ method: "GET" })
    .middleware([authedMiddleware])
    .validator(
        z.object({
            categoryId: z.enum(categoryIdEnum.enumValues).optional(),
            sortBy: z.enum(sortByEnum).default("updatedAt"),
            sortOrder: z.enum(sortOrderEnum).default("desc"),
            limit: z.number().int().positive().max(100).default(20),
            offset: z.number().int().nonnegative().default(0),
        }),
    )
    .handler(async ({ context, data }) => {
        const whereClause = and(
            eq(memory.userId, context.session.user.id),
            isNull(memory.deletedAt),
            data.categoryId ? eq(memory.categoryId, data.categoryId) : undefined,
        )

        const sortColumn = SORT_COLUMNS[data.sortBy]
        const orderBy = data.sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn)

        const [memories, [{ total }]] = await Promise.all([
            db.select().from(memory).where(whereClause).orderBy(orderBy).limit(data.limit).offset(data.offset),
            db.select({ total: count() }).from(memory).where(whereClause),
        ])

        return {
            memories,
            total,
            limit: data.limit,
            offset: data.offset,
            hasMore: data.offset + memories.length < total,
        }
    })

export const getMemoryByIdFn = createServerFn({ method: "GET" })
    .middleware([authedMiddleware])
    .validator(z.object({ id: z.string() }))
    .handler(async ({ context, data }) => {
        const found = await db
            .select()
            .from(memory)
            .where(and(eq(memory.id, data.id), eq(memory.userId, context.session.user.id), isNull(memory.deletedAt)))
            .limit(1)

        return found.length === 0 ? null : found[0]
    })

export const createMemoryFn = createServerFn({ method: "POST" })
    .middleware([authedMiddleware])
    .validator(memoryPayloadSchema)
    .handler(async ({ context, data }) => {
        const frontmatter = parseFrontMatter(data.content)

        const [created] = await db
            .insert(memory)
            .values({
                id: crypto.randomUUID(),
                userId: context.session.user.id,
                path: `${data.categoryId}/${slugify(frontmatter.name)}.md`,
                sizeBytes: new TextEncoder().encode(data.content).length,
                categoryId: data.categoryId,
                name: frontmatter.name,
                description: frontmatter.description,
                content: data.content,
            })
            .returning()

        return created
    })

export const updateMemoryFn = createServerFn({ method: "POST" })
    .middleware([authedMiddleware])
    .validator(memoryPayloadSchema.extend({ id: z.string() }))
    .handler(async ({ context, data }) => {
        const frontmatter = parseFrontMatter(data.content)

        const updated = await db
            .update(memory)
            .set({
                categoryId: data.categoryId,
                name: frontmatter.name,
                description: frontmatter.description,
                content: data.content,
                path: `${data.categoryId}/${slugify(frontmatter.name)}.md`,
                sizeBytes: new TextEncoder().encode(data.content).length,
                version: sql`${memory.version} + 1`,
            })
            .where(and(eq(memory.id, data.id), eq(memory.userId, context.session.user.id)))
            .returning()

        return updated.length === 0 ? null : updated[0]
    })

export const deleteMemoryFn = createServerFn({ method: "POST" })
    .middleware([authedMiddleware])
    .validator(z.object({ id: z.string() }))
    .handler(async ({ context, data }) => {
        await db
            .update(memory)
            .set({ deletedAt: new Date() })
            .where(and(eq(memory.id, data.id), eq(memory.userId, context.session.user.id)))
    })
