import { access, mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { DEFAULT_BASE_PATH, generateDefaultMemoryTree, slugify } from "#/lib/memory/default-memories-tree"
import type { TreeNode } from "#/lib/memory/default-memories-tree"

async function pathExists(path: string): Promise<boolean> {
    try {
        await access(path)
        return true
    } catch {
        return false
    }
}

async function writeTree(basePath: string, node: TreeNode): Promise<void> {
    const nodePath = join(basePath, node.name)

    if (node.type === "file") {
        if (await pathExists(nodePath)) return
        await writeFile(nodePath, node.content ?? "", "utf-8")
        return
    }

    await mkdir(nodePath, { recursive: true })
    for (const child of node.children ?? []) {
        await writeTree(nodePath, child)
    }
}

async function generateMemoryStructure(
    cwd: string,
    user: string,
    rootMeta: string[] = [],
    basePath: string = DEFAULT_BASE_PATH,
): Promise<{ root: string; isFirstRun: boolean }> {
    const root = join(cwd, slugify(basePath))
    const isFirstRun = !(await pathExists(root))

    const tree = generateDefaultMemoryTree({ user, rootMeta, basePath })
    for (const node of tree) {
        await writeTree(cwd, node)
    }

    return { root, isFirstRun }
}

export { generateMemoryStructure }
