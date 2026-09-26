-- FTS5 index backing memory_search (see src/lib/db/fts.ts). Standalone (not external-content) table:
-- memory has a text PK, and its implicit rowid isn't stable across VACUUM, so we key on memory_id instead.
CREATE VIRTUAL TABLE `memory_fts` USING fts5(memory_id UNINDEXED, name, description, content, tokenize = 'porter unicode61');
--> statement-breakpoint
CREATE TRIGGER `memory_fts_ai` AFTER INSERT ON `memory` BEGIN
	INSERT INTO memory_fts (memory_id, name, description, content) VALUES (new.id, new.name, new.description, new.content);
END;
--> statement-breakpoint
CREATE TRIGGER `memory_fts_au` AFTER UPDATE OF name, description, content ON `memory` BEGIN
	UPDATE memory_fts SET name = new.name, description = new.description, content = new.content WHERE memory_id = new.id;
END;
--> statement-breakpoint
CREATE TRIGGER `memory_fts_ad` AFTER DELETE ON `memory` BEGIN
	DELETE FROM memory_fts WHERE memory_id = old.id;
END;
