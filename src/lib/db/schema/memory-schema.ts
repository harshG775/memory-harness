import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

// SQLite has no native enums; same `.enumValues` shape as pgEnum so call sites stay unchanged.
export const categoryIdEnum = { enumValues: ["you", "topics", "areas", "people", "sessions"] as const };
export const memoryKindEnum = { enumValues: ["entry", "toc"] as const };

const now = sql`(cast(unixepoch('subsecond') * 1000 as integer))`;

export const memory = sqliteTable(
	"memory",
	{
		id: text("id").primaryKey(),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),

		path: text("path").notNull(),
		sizeBytes: integer("size_bytes").notNull(),

		//
		categoryId: text("category_id", { enum: categoryIdEnum.enumValues }).notNull(),
		isSingleton: integer("is_singleton", { mode: "boolean" }).notNull().default(false),
		kind: text("kind", { enum: memoryKindEnum.enumValues }).notNull().default("entry"),

		//
		name: text("name").notNull(),
		description: text("description").notNull(),
		content: text("content").notNull().default(""),

		version: integer("version").notNull().default(1),
		createdAt: integer("created_at", { mode: "timestamp_ms" }).default(now).notNull(),
		updatedAt: integer("updated_at", { mode: "timestamp_ms" })
			.default(now)
			.$onUpdate(() => /* @__PURE__ */ new Date())
			.notNull(),
		deletedAt: integer("deleted_at", { mode: "timestamp_ms" }),
	},
	(table) => [
		uniqueIndex("memory_user_path_idx").on(table.userId, table.path),
		index("memory_user_category_idx").on(table.userId, table.categoryId),
		uniqueIndex("memory_singleton_idx").on(table.userId, table.categoryId).where(sql`${table.isSingleton} = 1`),
	],
);

export type Memory = typeof memory.$inferSelect;
export type NewMemory = typeof memory.$inferInsert;
