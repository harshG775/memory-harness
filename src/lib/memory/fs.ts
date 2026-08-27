import { access, appendFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import { dirname, relative, resolve, sep } from "node:path"

export class MemoryPathError extends Error {}
export class MemoryFileNotFoundError extends Error {}
export class MemoryStrReplaceError extends Error {}

export interface MemoryEntry {
    path: string
    type: "file" | "directory"
}

function resolveMemoryPath(root: string, relPath: string): string {
    const resolvedRoot = resolve(root)
    const resolvedPath = resolve(resolvedRoot, relPath)
    if (resolvedPath !== resolvedRoot && !resolvedPath.startsWith(resolvedRoot + sep)) {
        throw new MemoryPathError(`Path "${relPath}" escapes the memory root`)
    }
    return resolvedPath
}

async function requireExists(target: string, relPath: string): Promise<void> {
    try {
        await access(target)
    } catch {
        throw new MemoryFileNotFoundError(`"${relPath}" does not exist. Use memory_write to create it first.`)
    }
}

export async function writeMemoryFile(root: string, relPath: string, content: string): Promise<void> {
    const target = resolveMemoryPath(root, relPath)
    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, content, "utf-8")
}

export async function appendMemoryFile(root: string, relPath: string, content: string): Promise<void> {
    const target = resolveMemoryPath(root, relPath)
    await requireExists(target, relPath)
    await appendFile(target, content, "utf-8")
}

export async function readMemoryFile(root: string, relPath: string): Promise<string> {
    const target = resolveMemoryPath(root, relPath)
    await requireExists(target, relPath)
    if ((await stat(target)).isDirectory()) {
        throw new MemoryPathError(`"${relPath}" is a directory, not a file. Use memory_list to list its contents.`)
    }
    return readFile(target, "utf-8")
}

export async function listMemoryEntries(root: string, relPath: string, recursive: boolean): Promise<MemoryEntry[]> {
    const target = resolveMemoryPath(root, relPath)
    await requireExists(target, relPath || ".")
    if (!(await stat(target)).isDirectory()) {
        throw new MemoryPathError(`"${relPath}" is a file, not a directory. Use memory_read to read it.`)
    }

    const entries: MemoryEntry[] = []

    async function walk(dirPath: string): Promise<void> {
        const dirents = (await readdir(dirPath, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))
        for (const dirent of dirents) {
            const fullPath = resolve(dirPath, dirent.name)
            const entryPath = relative(root, fullPath).split(sep).join("/")
            if (dirent.isDirectory()) {
                entries.push({ path: entryPath, type: "directory" })
                if (recursive) await walk(fullPath)
            } else {
                entries.push({ path: entryPath, type: "file" })
            }
        }
    }

    await walk(target)
    return entries
}

export async function deleteMemoryFile(root: string, relPath: string, recursive: boolean): Promise<void> {
    if (!relPath || relPath === ".") {
        throw new MemoryPathError("Refusing to delete the memory root")
    }
    const target = resolveMemoryPath(root, relPath)
    await requireExists(target, relPath)
    const isDirectory = (await stat(target)).isDirectory()
    if (isDirectory && !recursive) {
        throw new MemoryPathError(`"${relPath}" is a directory. Pass recursive: true to delete it and its contents.`)
    }
    await rm(target, { recursive: isDirectory })
}

export async function strReplaceMemoryFile(
    root: string,
    relPath: string,
    oldStr: string,
    newStr: string,
): Promise<void> {
    const target = resolveMemoryPath(root, relPath)
    await requireExists(target, relPath)
    const current = await readFile(target, "utf-8")

    const occurrences = current.split(oldStr).length - 1
    if (occurrences === 0) {
        throw new MemoryStrReplaceError(`old_str not found in "${relPath}"`)
    }
    if (occurrences > 1) {
        throw new MemoryStrReplaceError(
            `old_str matches ${occurrences} times in "${relPath}"; it must match exactly once`,
        )
    }

    await writeFile(target, current.replace(oldStr, newStr), "utf-8")
}
