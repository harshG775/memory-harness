import { drizzle } from "drizzle-orm/neon-http"
import { env } from "#/env"
import { neon } from "@neondatabase/serverless"
import { relations } from "./relations"

const sql = neon(env.DATABASE_URL)
export const db = drizzle({ client: sql, relations: relations })