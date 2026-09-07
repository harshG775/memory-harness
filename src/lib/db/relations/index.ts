import * as schema from "#/lib/db/schema"
import { defineRelations } from "drizzle-orm"

export const relations = defineRelations(schema, (r) => ({
    user: {
        sessions: r.many.session(),
        accounts: r.many.account(),
        memories: r.many.memory(),
    },
    session: {
        user: r.one.user({
            from: r.session.userId,
            to: r.user.id,
        }),
    },
    account: {
        user: r.one.user({
            from: r.account.userId,
            to: r.user.id,
        }),
    },
    memory: {
        user: r.one.user({ from: r.memory.userId, to: r.user.id }),
    },
}))
