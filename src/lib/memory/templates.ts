export  function slugify(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

function firstLine(content: string): string {
    const line = content.split("\n").find((l) => l.trim().length > 0) ?? ""
    return line.replace(/^#+\s*/, "").trim()
}

export function fileTemplate(displayName: string, body?: string): string {
    const description = body ? firstLine(body) : displayName
    const bodyContent = body ? `${body}\n` : ""
    return `---
name: ${slugify(displayName)}
description: ${description}
sources: []
---

${bodyContent}`
}

export function metaTemplate(displayName: string, note: string): string {
    return `---
name: ${slugify(displayName)}-meta
description: Notes on how this folder should be used
---

${note}
`
}
