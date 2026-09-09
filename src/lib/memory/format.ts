export function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatRelativeTime(date: Date) {
    const diffMs = Date.now() - date.getTime()
    const diffMin = Math.round(diffMs / (1000 * 60))
    if (diffMin < 1) return "just now"
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.round(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    const diffDay = Math.round(diffHr / 24)
    return `${diffDay}d ago`
}
