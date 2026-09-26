import { formatDistanceToNowStrict } from "date-fns";

export function formatBytes(bytes: number) {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatRelativeTime(date: Date) {
	return formatDistanceToNowStrict(date, { addSuffix: true });
}

const SHORT_TIME_UNITS = [
	["y", 60 * 60 * 24 * 365],
	["mo", 60 * 60 * 24 * 30],
	["d", 60 * 60 * 24],
	["h", 60 * 60],
	["m", 60],
] as const;

/** Compact relative time for tight rows: "4d ago", "1mo ago". */
export function formatRelativeTimeShort(date: Date) {
	const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
	for (const [label, size] of SHORT_TIME_UNITS) {
		if (seconds >= size) return `${Math.floor(seconds / size)}${label} ago`;
	}
	return "just now";
}
