import { mkdir, writeFile, access, readFile } from "node:fs/promises"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import { fileTemplate, metaTemplate, slugify } from "./templates"

type TreeNode = {
    name: string
    type: "directory" | "file"
    _meta?: string
    content?: string
    children?: TreeNode[]
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
        await writeIfAbsent(join(parentPath, `${slug}.md`), fileTemplate(node.name, node.content))
        return
    }

    // directory
    const dirPath = join(parentPath, slug)
    await ensureDir(dirPath)

    if (node._meta) {
        await writeIfAbsent(join(dirPath, "_meta.md"), metaTemplate(node.name, node._meta))
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

export async function generateMemoryStructure(rootPath: string, tree: TreeNode): Promise<void> {
    if (tree.type !== "directory") {
        throw new Error("Root tree node must be of type 'directory'")
    }

    await ensureDir(rootPath)

    if (!tree.children || tree.children.length === 0) return

    for (const child of tree.children) {
        await buildNode(child, rootPath)
    }
}

const DEFAULT_TREE: TreeNode = {
    name: "Assistant memory",
    type: "directory",
    children: [
        {
            name: "User",
            type: "directory",
            _meta: "Facts about the user, split into two fixed files: preferences (how they like to work) and profile (who they are — role, goals, responsibilities). These two do not gain siblings.",
            children: [
                {
                    name: "preferences",
                    type: "file",
                    content:
                        "# User Preferences\n\n- **Communication Style:**\n- **Formatting:**\n- **Code Style:**\n- **Timezone:**",
                },
                {
                    name: "profile",
                    type: "file",
                    content:
                        "# User Profile\n\n- **Role:**\n- **Skill Level:**\n- **Primary Goals:**\n- **Working Hours:**",
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

// CLI entry: `tsx src/lib/memory/generate-memory-structure.ts <rootPath>/assistant-memory [treeJsonPath]`
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const [rootPath, treeJsonPath] = process.argv.slice(2)

    if (!rootPath) {
        console.error("Usage: tsx generate-memory-structure.ts <folder-path> [tree-json-path]")
        process.exit(1)
    }

    const loadTree = async (): Promise<TreeNode> => {
        if (!treeJsonPath) return DEFAULT_TREE
        const raw = await readFile(treeJsonPath, "utf-8")
        return JSON.parse(raw) as TreeNode
    }

    loadTree()
        .then((tree) => generateMemoryStructure(rootPath, tree))
        .then(() => console.log(`Memory structure ready at ${rootPath}`))
        .catch((err) => {
            console.error(err)
            process.exit(1)
        })
}

/**

assitantMemory.User.preferences()
assitantMemory.User.profile()
assitantMemory.Topics()
assitantMemory.Areas()
assitantMemory.People()
assitantMemory.Sessions()
 
*/
