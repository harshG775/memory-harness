import { sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * FTS5 virtual table backing memory_search. Created and kept in sync by triggers in a custom
 * migration — deliberately outside `schema/` so drizzle-kit doesn't try to manage it as a real table.
 */
export const memoryFts = sqliteTable("memory_fts", {
	memoryId: text("memory_id").notNull(),
	name: text("name"),
	description: text("description"),
	content: text("content"),
});
