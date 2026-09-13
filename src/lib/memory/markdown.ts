type ParseFrontMatterType = {
    name: string
    description: string
    sources: string[]
    aliases: string[]
}

type ParseMarkdownType = {
    frontmatter: ParseFrontMatterType
    content: string
}

const unquote = (value: string): string => {
    const trimmed = value.trim()
    if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
        return trimmed.slice(1, -1)
    }
    return trimmed
}

const parseInlineArray = (value: string): string[] => {
    const inner = value.trim().slice(1, -1).trim()
    if (!inner) return []
    return inner.split(",").map((item) => unquote(item))
}

const parseFrontMatter = (row: string): ParseFrontMatterType => {
    const result: ParseFrontMatterType = {
        name: "",
        description: "",
        sources: [],
        aliases: [],
    }

    const lines = row.split(/\r?\n/)

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const match = line.match(/^(\w+):\s*(.*)$/)
        if (!match) continue

        const [, key, rawValue] = match
        const value = rawValue.trim()

        switch (key) {
            case "name":
            case "description":
                result[key] = unquote(value)
                break

            case "sources":
            case "aliases":
                if (value.startsWith("[") && value.endsWith("]")) {
                    result[key] = parseInlineArray(value)
                    break
                }

                if (value === "") {
                    const items: string[] = []
                    while (i + 1 < lines.length && /^\s*-\s*/.test(lines[i + 1])) {
                        i++
                        items.push(unquote(lines[i].replace(/^\s*-\s*/, "")))
                    }
                    result[key] = items
                }
                break

            default:
                break
        }
    }

    return result
}

export const parseMarkdown = (raw: string): ParseMarkdownType => {
    const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
    if (!match) {
        return {
            frontmatter: {
                name: "",
                description: "",
                sources: [],
                aliases: [],
            },
            content: raw,
        }
    }

    const [, frontmatterRaw, content] = match
    const frontmatter = parseFrontMatter(frontmatterRaw)

    return { frontmatter, content: content.replace(/^\r?\n/, "") }
}
