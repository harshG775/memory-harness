import { mkdir, writeFile, access, readFile } from "node:fs/promises"
import { join } from "node:path"
import { pathToFileURL } from "node:url"

type TreeNode = {
    name: string
    type: "directory" | "file"
    _meta?: string
    description?: string
    content?: string
    children?: TreeNode[]
}

export function slugify(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

export function fileTemplate(displayName: string, description?: string, body?: string): string {
    const bodyContent = body ? `${body}\n` : ""
    return `---
name: ${slugify(displayName)}
description: ${description ?? displayName}
sources: []
aliases: []
---

${bodyContent}`
}

async function pathExists(path: string): Promise<boolean> {
    try {
        await access(path)
        return true
    } catch {
        return false
    }
}

async function ensureDir(path: string): Promise<void> {
    await mkdir(path, { recursive: true })
}

async function writeIfAbsent(path: string, content: string): Promise<void> {
    if (await pathExists(path)) return
    await writeFile(path, content, "utf-8")
}

async function buildNode(node: TreeNode, parentPath: string): Promise<void> {
    const slug = slugify(node.name)

    if (node.type === "file") {
        await writeIfAbsent(join(parentPath, `${slug}.md`), fileTemplate(node.name, node.description, node.content))
        return
    }

    // directory
    const dirPath = join(parentPath, slug)
    await ensureDir(dirPath)

    if (node._meta) {
        await writeIfAbsent(join(dirPath, "_meta.md"), fileTemplate(`${node.name}-meta`, node._meta))
    }

    if (!node.children || node.children.length === 0) {
        if (!node._meta) {
            await writeIfAbsent(join(dirPath, ".gitkeep"), "")
        }
        return
    }

    for (const child of node.children) {
        await buildNode(child, dirPath)
    }
}

const MEMORIES_DIR_NAME = "memories"

export async function generateMemoryStructure(basePath: string, tree: TreeNode): Promise<void> {
    if (tree.type !== "directory") {
        throw new Error("Root tree node must be of type 'directory'")
    }

    const rootPath = join(basePath, MEMORIES_DIR_NAME)
    await ensureDir(rootPath)

    if (tree._meta) {
        await writeIfAbsent(join(rootPath, "_meta.md"), fileTemplate(`${tree.name}-meta`, tree._meta))
    }

    if (!tree.children || tree.children.length === 0) return

    for (const child of tree.children) {
        await buildNode(child, rootPath)
    }
}

export async function ensureMemoryStructure(basePath: string): Promise<string> {
    await generateMemoryStructure(basePath, DEFAULT_TREE)
    return join(basePath, MEMORIES_DIR_NAME)
}

const DEFAULT_TREE: TreeNode = {
    name: "Assistant memory",
    type: "directory",
    _meta: "Top-level index of the assistant's persistent memory. Contains one subdirectory per memory category (You, Topics, Areas, People, Sessions) — see each subdirectory's own _meta.md for what belongs there.",
    children: [
        {
            name: "You",
            type: "directory",
            _meta: "Facts about the user, split into two fixed files: preferences (how they like to work) and profile (who they are — role, goals, responsibilities). These two do not gain siblings.",
            children: [
                {
                    name: "preferences",
                    type: "file",
                    description: "How the {user} likes the assistant to work",
                    content: "",
                },
                {
                    name: "profile",
                    type: "file",
                    description: "Who the {user} is — role, goals, responsibilities",
                    content: "",
                },
            ],
        },
        {
            name: "Topics",
            type: "directory",
            _meta: "Subject-matter notes the assistant has built up (summary + key takeaways per topic). One file per topic, created the first time it comes up in depth.",
            children: [],
        },
        {
            name: "Areas",
            type: "directory",
            _meta: "Ongoing responsibilities or domains the user maintains (career, a project area, personal infrastructure). One file per area, listing active projects and standing responsibilities.",
            children: [],
        },
        {
            name: "People",
            type: "directory",
            _meta: "People the user works or interacts with, and how to work with them. One file per person, created when they're first mentioned with enough detail to be useful later.",
            children: [],
        },
        {
            name: "Sessions",
            type: "directory",
            _meta: "Reference pointers to past sessions only (id, date, summary, links to referenced topics/people) — never the full session transcript.",
            children: [],
        },
    ],
}

// CLI entry: `tsx src/lib/memory/generate-memory-structure.ts <folder-path> [tree-json-path]`
// A `memories` subdirectory is created automatically inside <folder-path>.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const [basePath, treeJsonPath] = process.argv.slice(2)

    if (!basePath) {
        console.error("Usage: tsx generate-memory-structure.ts <folder-path> [tree-json-path]")
        process.exit(1)
    }

    const loadTree = async (): Promise<TreeNode> => {
        if (!treeJsonPath) return DEFAULT_TREE
        const raw = await readFile(treeJsonPath, "utf-8")
        return JSON.parse(raw) as TreeNode
    }

    loadTree()
        .then((tree) => generateMemoryStructure(basePath, tree))
        .then(() => console.log(`Memory structure ready at ${join(basePath, "memories")}`))
        .catch((err) => {
            console.error(err)
            process.exit(1)
        })
}

/**

assistantMemory.User.preferences()
assistantMemory.User.profile()
assistantMemory.Topics(slug)
assistantMemory.Areas(slug)
assistantMemory.People(slug)
assistantMemory.Sessions(slug)

*/
