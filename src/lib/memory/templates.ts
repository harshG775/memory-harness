export function slugify(value: string): string {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

function yamlString(value: string): string {
    const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
    return `"${escaped}"`
}

export function fileTemplate(displayName: string, description = ""): string {
    return `---
name: ${slugify(displayName)}
description: ${yamlString(description)}
sources: []
aliases: []
---

`
}
