import { config } from "dotenv"
import { defineConfig } from "drizzle-kit"

config({ path: [".env", ".env.local"] })

const DB_FILE_NAME = process.env.DB_FILE_NAME
if (!DB_FILE_NAME) throw new Error(".env DB_FILE_NAME not found")

export default defineConfig({
    out: "./src/lib/db/migrations",
    schema: "./src/lib/db/schema/index.ts",
    dialect: "sqlite",
    dbCredentials: {
        url: DB_FILE_NAME,
    },
})
