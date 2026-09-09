import { sql } from "drizzle-orm"
import { pgTable, text, timestamp, integer, pgEnum, vector, uniqueIndex, index, boolean } from "drizzle-orm/pg-core"
import { user } from "./auth-schema"

export const categoryIdEnum = pgEnum("category_id", ["you", "topics", "areas", "people", "sessions"])
export const memoryKindEnum = pgEnum("memory_kind", ["entry", "toc"])

export const memory = pgTable(
    "memory",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),

        path: text("path").notNull(),
        sizeBytes: integer("size_bytes").notNull(),

        //
        categoryId: categoryIdEnum("category_id").notNull(),
        isSingleton: boolean("is_singleton").notNull().default(false),
        kind: memoryKindEnum("kind").notNull().default("entry"),

        //
        displayName: text("display_name").notNull(),
        description: text("description").notNull(),
        content: text("content").notNull().default(""),

        //
        embedding: vector("embedding", { dimensions: 1536 }),
        embeddingModel: text("embedding_model"),

        version: integer("version").notNull().default(1),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
        deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (table) => [
        uniqueIndex("memory_user_path_idx").on(table.userId, table.path),
        index("memory_user_category_idx").on(table.userId, table.categoryId),
        uniqueIndex("memory_singleton_idx")
            .on(table.userId, table.categoryId)
            .where(sql`${table.isSingleton} = true`),
        index("memory_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
    ],
)

export type Memory = typeof memory.$inferSelect
export type NewMemory = typeof memory.$inferInsert