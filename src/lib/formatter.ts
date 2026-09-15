import { formatDistanceToNowStrict } from "date-fns";

export function formatBytes(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatRelativeTime(date: Date) {
	return formatDistanceToNowStrict(date, { addSuffix: true });
}
