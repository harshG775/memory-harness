import {
	RiContractUpDownLine,
	RiEditBoxLine,
	RiExpandUpDownLine,
	RiFolderLine,
	RiSearchLine,
	RiSortAsc,
	RiSortDesc,
} from "@remixicon/react";
import { type ReactNode, useState } from "react";
import { Button } from "#/components/ui/button";
import { FileTree, FileTreeFile, FileTreeFolder } from "#/components/ui/file-tree";
import { InputGroup, InputGroupAddon, InputGroupInput } from "#/components/ui/input-group";
import { Skeleton } from "#/components/ui/skeleton";
import { CATEGORY_ICONS, type CategoryId } from "#/lib/memory/category";
import { cn } from "#/lib/utils";

export type MemoryTreeItem = {
	id: string;
	/** e.g. `areas/anchor.md`; the segments become folders. */
	path: string;
	kind: "entry" | "toc";
};

type FolderNode = { type: "folder"; name: string; path: string; children: TreeNode[] };
type FileNode = { type: "file"; name: string; item: MemoryTreeItem };
type TreeNode = FolderNode | FileNode;

function buildTree(items: MemoryTreeItem[]): TreeNode[] {
	const root: FolderNode = { type: "folder", name: "", path: "", children: [] };

	for (const item of items) {
		const segments = item.path.split("/").filter(Boolean);
		const fileName = (segments.pop() ?? item.path).replace(/\.md$/, "");

		let folder = root;
		for (const segment of segments) {
			const folderPath = folder.path ? `${folder.path}/${segment}` : segment;
			let next = folder.children.find(
				(child): child is FolderNode => child.type === "folder" && child.path === folderPath,
			);
			if (!next) {
				next = { type: "folder", name: segment, path: folderPath, children: [] };
				folder.children.push(next);
			}
			folder = next;
		}
		folder.children.push({ type: "file", name: fileName, item });
	}

	return root.children;
}

/** Folders first, then files; each group sorted by name. */
function sortNodes(nodes: TreeNode[], descending: boolean): TreeNode[] {
	const direction = descending ? -1 : 1;
	return nodes
		.map((node) => (node.type === "folder" ? { ...node, children: sortNodes(node.children, descending) } : node))
		.sort((a, b) => {
			if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
			return direction * a.name.localeCompare(b.name);
		});
}

function collectFolderPaths(nodes: TreeNode[]): string[] {
	return nodes.flatMap((node) => (node.type === "folder" ? [node.path, ...collectFolderPaths(node.children)] : []));
}

/** Keeps files whose name or path matches, plus the folders that lead to them. */
function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
	return nodes.flatMap((node): TreeNode[] => {
		if (node.type === "file") {
			const matches = node.name.toLowerCase().includes(query) || node.item.path.toLowerCase().includes(query);
			return matches ? [node] : [];
		}
		const children = filterTree(node.children, query);
		return children.length > 0 ? [{ ...node, children }] : [];
	});
}

type TreeNodesProps = {
	nodes: TreeNode[];
	/** While searching, every folder on the way to a match stays open. */
	forceOpen: boolean;
	collapsed: Set<string>;
	selectedId: string | null;
	onToggleFolder: (path: string) => void;
	onSelect: (id: string) => void;
};

/** Top-level folders are the memory categories, so they get their category icon. */
function FolderIcon({ name, path }: { name: string; path: string }) {
	const isCategory = !path.includes("/") && Object.hasOwn(CATEGORY_ICONS, name);
	const Icon = isCategory ? CATEGORY_ICONS[name as CategoryId] : RiFolderLine;
	return <Icon />;
}

/** Maps the memory tree onto the generic FileTree components. */
function TreeNodes({ nodes, forceOpen, collapsed, selectedId, onToggleFolder, onSelect }: TreeNodesProps) {
	return (
		<>
			{nodes.map((node) =>
				node.type === "folder" ? (
					<FileTreeFolder
						key={node.path}
						name={node.name}
						icon={<FolderIcon name={node.name} path={node.path} />}
						open={forceOpen || !collapsed.has(node.path)}
						onOpenChange={() => onToggleFolder(node.path)}
					>
						<TreeNodes
							nodes={node.children}
							forceOpen={forceOpen}
							collapsed={collapsed}
							selectedId={selectedId}
							onToggleFolder={onToggleFolder}
							onSelect={onSelect}
						/>
					</FileTreeFolder>
				) : (
					<FileTreeFile
						key={node.item.id}
						name={node.name}
						selected={node.item.id === selectedId}
						badge={node.item.kind === "toc" ? "TOC" : undefined}
						onClick={() => onSelect(node.item.id)}
					/>
				),
			)}
		</>
	);
}

type MemoryExplorerProps = {
	memories: MemoryTreeItem[];
	selectedId: string | null;
	onSelect: (id: string) => void;
	onNewMemory: () => void;
	/** Pinned to the top, e.g. the app logo and name. */
	header?: ReactNode;
	/** Pinned to the bottom, e.g. the signed-in user menu. */
	footer?: ReactNode;
};

/** Obsidian-style file explorer: toolbar, search, and a folder tree built from memory paths. */
export function MemoryExplorer({ memories, selectedId, onSelect, onNewMemory, header, footer }: MemoryExplorerProps) {
	const [query, setQuery] = useState("");
	const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
	const [descending, setDescending] = useState(false);

	const tree = sortNodes(buildTree(memories), descending);
	const folderPaths = collectFolderPaths(tree);
	const allCollapsed = folderPaths.length > 0 && folderPaths.every((path) => collapsed.has(path));

	const normalizedQuery = query.trim().toLowerCase();
	const visibleTree = normalizedQuery ? filterTree(tree, normalizedQuery) : tree;

	function toggleFolder(path: string) {
		setCollapsed((prev) => {
			const next = new Set(prev);
			if (next.has(path)) {
				next.delete(path);
			} else {
				next.add(path);
			}
			return next;
		});
	}

	return (
		<div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
			{header && <div className="flex items-center gap-2 px-3 pt-3 pb-1">{header}</div>}

			<div className="flex items-center justify-center gap-1 p-2">
				<Button variant="ghost" size="icon-sm" onClick={onNewMemory}>
					<RiEditBoxLine />
					<span className="sr-only">New memory</span>
				</Button>
				<Button variant="ghost" size="icon-sm" onClick={() => setDescending((value) => !value)}>
					{descending ? <RiSortDesc /> : <RiSortAsc />}
					<span className="sr-only">{descending ? "Sort A to Z" : "Sort Z to A"}</span>
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					disabled={folderPaths.length === 0}
					onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(folderPaths))}
				>
					{allCollapsed ? <RiExpandUpDownLine /> : <RiContractUpDownLine />}
					<span className="sr-only">{allCollapsed ? "Expand all" : "Collapse all"}</span>
				</Button>
			</div>

			<div className="px-2 pb-2">
				<InputGroup className="border-border bg-background shadow-xs">
					<InputGroupAddon>
						<RiSearchLine />
					</InputGroupAddon>
					<InputGroupInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search..." />
				</InputGroup>
			</div>

			<nav aria-label="Memories" className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
				{visibleTree.length === 0 ? (
					<p className="p-4 text-center text-sm text-muted-foreground">
						{memories.length === 0 ? "No memories yet." : "No matches."}
					</p>
				) : (
					<FileTree>
						<TreeNodes
							nodes={visibleTree}
							forceOpen={normalizedQuery !== ""}
							collapsed={collapsed}
							selectedId={selectedId}
							onToggleFolder={toggleFolder}
							onSelect={onSelect}
						/>
					</FileTree>
				)}
			</nav>

			{footer && (
				<div className="border-t border-border bg-sidebar p-2 shadow-[0_-4px_12px_-6px_rgb(0_0_0/0.08)]">{footer}</div>
			)}
		</div>
	);
}

const SKELETON_TOOLBAR_KEYS = ["new", "sort", "collapse"];
const SKELETON_ROWS = [
	{ key: "row-1", width: "w-2/3" },
	{ key: "row-2", width: "w-1/2" },
	{ key: "row-3", width: "w-3/4" },
	{ key: "row-4", width: "w-3/5" },
	{ key: "row-5", width: "w-1/2" },
	{ key: "row-6", width: "w-2/3" },
	{ key: "row-7", width: "w-3/4" },
	{ key: "row-8", width: "w-1/2" },
];

export function MemoryExplorerSkeleton() {
	return (
		<div className="flex h-full min-h-0 flex-col bg-sidebar text-sidebar-foreground">
			<div className="flex items-center gap-2 px-3 pt-3">
				<Skeleton className="size-7 rounded-md" />
				<Skeleton className="h-5 w-32" />
			</div>

			<div className="flex items-center justify-center gap-1 p-2">
				{SKELETON_TOOLBAR_KEYS.map((key) => (
					<Skeleton key={key} className="size-8 rounded-md" />
				))}
			</div>

			<div className="px-2 pb-2">
				<Skeleton className="h-9 w-full rounded-4xl" />
			</div>

			<div className="min-h-0 flex-1 overflow-hidden px-2 pb-2">
				<div className="px-2 py-1.5">
					<Skeleton className="h-5 w-24" />
				</div>
				<div className="ml-3.5 flex flex-col gap-0.5 border-l border-border pl-1.5">
					{SKELETON_ROWS.map((row) => (
						<div key={row.key} className="px-2 py-1.5">
							<Skeleton className={cn("h-5", row.width)} />
						</div>
					))}
				</div>
			</div>

			<div className="flex items-center gap-2.5 border-t border-border p-3.5">
				<Skeleton className="size-8 rounded-full" />
				<Skeleton className="h-5 w-28" />
			</div>
		</div>
	);
}
