import { and, asc, eq, gt, isNull, like, sql } from "drizzle-orm";
import { db } from "../db";
import type { categoryIdEnum } from "../db/schema/memory-schema";
import { memory } from "../db/schema/memory-schema";

type CategoryId = (typeof categoryIdEnum.enumValues)[number];

export class MemoryConflictError extends Error {}
export class MemoryNotFoundError extends Error {}
export class MemoryValidationError extends Error {}

const MAX_CONTENT_BYTES = 256 * 1024;

function assertContentSize(content: string) {
	const bytes = new TextEncoder().encode(content).length;
	if (bytes > MAX_CONTENT_BYTES) {
		throw new MemoryValidationError(`content is ${bytes} bytes, exceeds the ${MAX_CONTENT_BYTES} byte limit`);
	}
	return bytes;
}

function assertPathMatchesCategory(path: string, categoryId: CategoryId) {
	if (!path.startsWith(`${categoryId}/`)) {
		throw new MemoryValidationError(
			`path "${path}" must start with "${categoryId}/" to match categoryId "${categoryId}"`,
		);
	}
}

function deriveNameFromPath(path: string): string {
	const basename = path.split("/").at(-1) ?? path;
	return basename.replace(/\.[^./]+$/, "");
}

export async function readMemory(userId: string, input: { path: string }) {
	const [row] = await db
		.select()
		.from(memory)
		.where(and(eq(memory.userId, userId), eq(memory.path, input.path), isNull(memory.deletedAt)))
		.limit(1);

	if (!row) throw new MemoryNotFoundError(`no memory found at path "${input.path}"`);
	return row;
}

export async function writeMemory(
	userId: string,
	input: {
		path: string;
		content: string;
		categoryId: CategoryId;
		description: string;
		if_version: number | "new";
	},
) {
	assertPathMatchesCategory(input.path, input.categoryId);
	const sizeBytes = assertContentSize(input.content);
	const name = deriveNameFromPath(input.path);

	if (input.if_version === "new") {
		const [row] = await db
			.insert(memory)
			.values({
				id: crypto.randomUUID(),
				userId,
				path: input.path,
				categoryId: input.categoryId,
				name,
				description: input.description,
				content: input.content,
				sizeBytes,
			})
			.onConflictDoUpdate({
				target: [memory.userId, memory.path],
				set: {
					categoryId: input.categoryId,
					name,
					description: input.description,
					content: input.content,
					sizeBytes,
					version: 1,
					deletedAt: null,
				},
				setWhere: sql`${memory.deletedAt} IS NOT NULL`,
			})
			.returning();

		if (!row) throw new MemoryConflictError(`memory already exists at path "${input.path}"`);
		return row;
	}

	const [row] = await db
		.update(memory)
		.set({
			categoryId: input.categoryId,
			name,
			description: input.description,
			content: input.content,
			sizeBytes,
			version: sql`${memory.version} + 1`,
		})
		.where(
			and(
				eq(memory.userId, userId),
				eq(memory.path, input.path),
				eq(memory.version, input.if_version),
				isNull(memory.deletedAt),
			),
		)
		.returning();

	if (!row) throw await conflictOrNotFound(userId, input.path, input.if_version);
	return row;
}

export async function appendMemory(userId: string, input: { path: string; content: string; if_version: number }) {
	const current = await readMemory(userId, { path: input.path });
	if (current.version !== input.if_version) {
		throw new MemoryConflictError(`expected version ${input.if_version} but current version is ${current.version}`);
	}

	const newContent =
		current.content.endsWith("\n") || current.content === ""
			? current.content + input.content
			: `${current.content}\n${input.content}`;
	const sizeBytes = assertContentSize(newContent);

	const [row] = await db
		.update(memory)
		.set({ content: newContent, sizeBytes, version: sql`${memory.version} + 1` })
		.where(
			and(
				eq(memory.userId, userId),
				eq(memory.path, input.path),
				eq(memory.version, input.if_version),
				isNull(memory.deletedAt),
			),
		)
		.returning();

	if (!row) throw new MemoryConflictError(`memory at "${input.path}" changed since version ${input.if_version}, retry`);
	return row;
}

export async function strReplaceMemory(
	userId: string,
	input: { path: string; old_str: string; new_str: string; if_version: number },
) {
	const current = await readMemory(userId, { path: input.path });
	if (current.version !== input.if_version) {
		throw new MemoryConflictError(`expected version ${input.if_version} but current version is ${current.version}`);
	}

	const occurrences = current.content.split(input.old_str).length - 1;
	if (occurrences === 0) throw new MemoryValidationError(`old_str not found in "${input.path}"`);
	if (occurrences > 1)
		throw new MemoryConflictError(`old_str matches ${occurrences} times in "${input.path}", must be unique`);

	const newContent = current.content.replace(input.old_str, input.new_str);
	const sizeBytes = assertContentSize(newContent);

	const [row] = await db
		.update(memory)
		.set({ content: newContent, sizeBytes, version: sql`${memory.version} + 1` })
		.where(
			and(
				eq(memory.userId, userId),
				eq(memory.path, input.path),
				eq(memory.version, input.if_version),
				isNull(memory.deletedAt),
			),
		)
		.returning();

	if (!row) throw new MemoryConflictError(`memory at "${input.path}" changed since version ${input.if_version}, retry`);
	return row;
}

export async function listMemories(
	userId: string,
	input: { categoryId?: CategoryId; pathPrefix?: string; cursor?: string; limit: number },
) {
	const whereClause = and(
		eq(memory.userId, userId),
		isNull(memory.deletedAt),
		input.categoryId ? eq(memory.categoryId, input.categoryId) : undefined,
		input.pathPrefix ? like(memory.path, `${input.pathPrefix}%`) : undefined,
		input.cursor ? gt(memory.path, input.cursor) : undefined,
	);

	const rows = await db
		.select({
			path: memory.path,
			name: memory.name,
			description: memory.description,
			categoryId: memory.categoryId,
			version: memory.version,
			updatedAt: memory.updatedAt,
		})
		.from(memory)
		.where(whereClause)
		.orderBy(asc(memory.path))
		.limit(input.limit);

	return {
		memories: rows,
		nextCursor: rows.length === input.limit ? rows.at(-1)?.path : undefined,
	};
}

export async function deleteMemory(userId: string, input: { path: string; if_version: number }) {
	const [row] = await db
		.update(memory)
		.set({ deletedAt: new Date() })
		.where(
			and(
				eq(memory.userId, userId),
				eq(memory.path, input.path),
				eq(memory.version, input.if_version),
				isNull(memory.deletedAt),
			),
		)
		.returning();

	if (!row) throw await conflictOrNotFound(userId, input.path, input.if_version);
	return row;
}

export async function searchMemories(userId: string, input: { query: string; categoryId?: CategoryId; limit: number }) {
	const tsvector = sql`to_tsvector('english', coalesce(${memory.name}, '') || ' ' || coalesce(${memory.description}, '') || ' ' || coalesce(${memory.content}, ''))`;
	const tsquery = sql`plainto_tsquery('english', ${input.query})`;

	const rows = await db
		.select({
			path: memory.path,
			name: memory.name,
			description: memory.description,
			categoryId: memory.categoryId,
		})
		.from(memory)
		.where(
			and(
				eq(memory.userId, userId),
				isNull(memory.deletedAt),
				input.categoryId ? eq(memory.categoryId, input.categoryId) : undefined,
				sql`${tsvector} @@ ${tsquery}`,
			),
		)
		.orderBy(sql`ts_rank(${tsvector}, ${tsquery}) DESC`)
		.limit(input.limit);

	return rows;
}

/** Only called on the empty-RETURNING path of a version-gated UPDATE, to tell a real 404 apart from a stale version. */
async function conflictOrNotFound(userId: string, path: string, expectedVersion: number) {
	const [row] = await db
		.select({ version: memory.version, deletedAt: memory.deletedAt })
		.from(memory)
		.where(and(eq(memory.userId, userId), eq(memory.path, path)))
		.limit(1);

	if (!row || row.deletedAt) return new MemoryNotFoundError(`no memory found at path "${path}"`);
	return new MemoryConflictError(`expected version ${expectedVersion} but current version is ${row.version}`);
}
