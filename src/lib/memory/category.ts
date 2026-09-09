import { RiBrainLine, RiPriceTag3Line, RiCompassLine, RiUserLine, RiHistoryLine } from "@remixicon/react"
import type { categoryIdEnum } from "#/lib/db/schema/memory-schema"

export type CategoryId = (typeof categoryIdEnum.enumValues)[number]

export const CATEGORY_LABELS: Record<CategoryId, string> = {
    you: "You",
    topics: "Topics",
    areas: "Areas",
    people: "People",
    sessions: "Sessions",
}

export const CATEGORY_ICONS: Record<CategoryId, typeof RiBrainLine> = {
    you: RiBrainLine,
    topics: RiPriceTag3Line,
    areas: RiCompassLine,
    people: RiUserLine,
    sessions: RiHistoryLine,
}
