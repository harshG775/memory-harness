import { createServerFn } from "@tanstack/react-start"
import { db } from "#/lib/db"
import { user } from "#/lib/db/schema/index"

export const getHasUsers = createServerFn({ method: "GET" }).handler(async () => {
    const [existing] = await db.select({ id: user.id }).from(user).limit(1)
    return Boolean(existing)
})
