import { drizzle } from "drizzle-orm/node-sqlite"
import { DatabaseSync } from "node:sqlite"

import { env } from "#/env"
import { relations } from "./relations"

const sqlite = new DatabaseSync(env.DB_FILE_NAME)
export const db = drizzle({ client: sqlite, relations })
