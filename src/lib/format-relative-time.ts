import { formatDistanceToNow } from "date-fns"

export function formatRelativeTime(iso: string): string {
    return formatDistanceToNow(new Date(iso), { addSuffix: true })
}
