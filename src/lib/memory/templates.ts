import { slugify } from "../slugify"


function yamlString(value: string): string {
    const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
    return `"${escaped}"`
}

export function fileTemplate(name: string, description = ""): string {
    return `---
name: ${slugify(name)}
description: ${yamlString(description)}
sources: []
aliases: []
---

`
}

export function stripFrontmatter(content: string): string {
    return content.replace(/^---\n[\s\S]*?\n---\n\n?/, "")
}
