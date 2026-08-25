export function slugify(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}
export function fileTemplate(displayName: string, description?: string): string {
    return `---
name: ${slugify(displayName)}
description: ${description}
sources: []
aliases: []
---

`
}
