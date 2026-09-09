// src/lib/server/memories.function.ts
import { createServerFn } from "@tanstack/react-start"
import { authedMiddleware } from "./auth.middleware"
import { z } from "zod"
import { categoryIdEnum, memory } from "../db/schema/memory-schema"
import { db } from "../db"
import { and, asc, count, desc, eq, isNull } from "drizzle-orm"

export const sortByEnum = ["updatedAt", "createdAt", "displayName"] as const
export type SortBy = (typeof sortByEnum)[number]

export const sortOrderEnum = ["asc", "desc"] as const
export type SortOrder = (typeof sortOrderEnum)[number]

const SORT_COLUMNS = {
    updatedAt: memory.updatedAt,
    createdAt: memory.createdAt,
    displayName: memory.displayName,
} as const

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
            db
                .select()
                .from(memory)
                .where(whereClause)
                .orderBy(orderBy)
                .limit(data.limit)
                .offset(data.offset),
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

export const getMemoryByIdFn = createServerFn()
    .middleware([authedMiddleware])
    .validator(z.object({}))
    .handler(() => {})

export const createMemoryFn = createServerFn()
    .middleware([authedMiddleware])
    .validator(z.object({}))
    .handler(() => {})

export const updateMemoryFn = createServerFn()
    .middleware([authedMiddleware])
    .validator(z.object({}))
    .handler(() => {})

export const deleteMemoryFn = createServerFn()
    .middleware([authedMiddleware])
    .validator(z.object({}))
    .handler(() => {})
