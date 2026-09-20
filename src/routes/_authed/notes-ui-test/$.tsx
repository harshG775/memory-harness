import {
	RiCloseLine,
	RiCollapseDiagonalLine,
	RiDeleteBinLine,
	RiExpandDiagonalLine,
	RiMoreLine,
} from "@remixicon/react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import { Button } from "#/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { Skeleton } from "#/components/ui/skeleton";
import { useIsMobile } from "#/hooks/use-mobile";
import { formatRelativeTimeShort } from "#/lib/formatter";
import type { CategoryId } from "#/lib/memory/category";
import { CATEGORY_LABELS } from "#/lib/memory/category";
import { cn } from "#/lib/utils";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

type WorkspaceProps = {
	primarySidebar: ReactNode;
	main: ReactNode;
	/** Header title on mobile. `null` shows a skeleton while it loads. */
	title: string | null;
	/** Mobile only: whether the bottom sheet showing `main` is open. */
	isMainOpen: boolean;
	onMainOpenChange: (open: boolean) => void;
};
function Workspace({ primarySidebar, main, title, isMainOpen, onMainOpenChange }: WorkspaceProps) {
	const isMo = useIsMobile();
	const [isMaximized, setIsMaximized] = useState(false);

	// While open, track the latest content; once closed, keep the last one so the
	// sheet doesn't flash its empty state during the exit animation.
	const [lastSheet, setLastSheet] = useState({ main, title });
	if (isMainOpen && (lastSheet.main !== main || lastSheet.title !== title)) {
		setLastSheet({ main, title });
	}
	const sheet = isMainOpen ? { main, title } : lastSheet;

	return (
		<ResizablePanelGroup orientation="horizontal" className="fixed inset-0">
			<ResizablePanel minSize={"20%"} defaultSize={"20%"}>
				{primarySidebar}
			</ResizablePanel>
			{isMo ? (
				<Sheet open={isMainOpen} onOpenChange={onMainOpenChange} modal={false}>
					<SheetContent
						side="bottom"
						showCloseButton={false}
						overlayClassName="pointer-events-none bg-black opacity-10 supports-backdrop-filter:backdrop-blur-none"
						className={cn(
							"rounded-t-2xl transition-[height,opacity,translate] duration-200",
							isMaximized
								? "data-[side=bottom]:h-dvh data-[side=bottom]:rounded-t-none"
								: "data-[side=bottom]:h-[60dvh]",
						)}
					>
						<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-border px-3 py-2">
							<div />
							{sheet.title === null ? (
								<>
									<Skeleton className="h-5 w-28" />
									<SheetTitle className="sr-only">Loading note</SheetTitle>
								</>
							) : (
								<SheetTitle className="max-w-48 truncate text-center font-heading text-base font-medium">
									{sheet.title}
								</SheetTitle>
							)}
							<div className="flex items-center justify-end gap-1">
								<Button variant="ghost" size="icon-sm" onClick={() => setIsMaximized((value) => !value)}>
									{isMaximized ? <RiCollapseDiagonalLine /> : <RiExpandDiagonalLine />}
									<span className="sr-only">{isMaximized ? "Minimize" : "Maximize"}</span>
								</Button>
								<SheetClose
									render={
										<Button variant="ghost" size="icon-sm">
											<RiCloseLine />
											<span className="sr-only">Close</span>
										</Button>
									}
								/>
							</div>
						</div>
						<SheetDescription className="sr-only">Note details</SheetDescription>
						<div className="min-h-0 flex-1 overflow-y-auto p-4">{sheet.main}</div>
					</SheetContent>
				</Sheet>
			) : (
				<>
					<ResizableHandle withHandle />
					<ResizablePanel minSize={"50%"}>{main}</ResizablePanel>
				</>
			)}
		</ResizablePanelGroup>
	);
}

type TestNote = {
	id: string;
	name: string;
	categoryId: CategoryId;
	content: string;
	updatedAt: Date;
};

const DAY_MS = 1000 * 60 * 60 * 24;

function createMockNotes(): TestNote[] {
	const ago = (days: number) => new Date(Date.now() - days * DAY_MS);
	return [
		{
			id: "note-1",
			name: "_meta",
			categoryId: "people",
			content: "How the people/ folder is organized.",
			updatedAt: ago(4),
		},
		{
			id: "note-2",
			name: "jordan-lee",
			categoryId: "people",
			content: "- Teammate\n- Prefers async updates",
			updatedAt: ago(5),
		},
		{
			id: "note-3",
			name: "sam-rivera",
			categoryId: "people",
			content: "- Designer\n- Owns the design system",
			updatedAt: ago(7),
		},
		{ id: "note-4", name: "family-mom", categoryId: "people", content: "- Birthday in March", updatedAt: ago(18) },
		{ id: "note-5", name: "alex-chen", categoryId: "people", content: "- Former colleague", updatedAt: ago(35) },
		{ id: "note-6", name: "dr-patel", categoryId: "people", content: "- Annual checkup in June", updatedAt: ago(70) },
	];
}

function NoteList({
	notes,
	selectedId,
	onSelect,
	onDelete,
}: {
	notes: TestNote[];
	selectedId: string | null;
	onSelect: (id: string) => void;
	onDelete: (id: string) => void;
}) {
	return (
		<ul className="flex flex-col gap-0.5 p-2">
			{notes.map((note) => (
				<li
					key={note.id}
					className={cn(
						"flex items-center rounded-md pr-1 text-sm hover:bg-muted",
						selectedId === note.id && "bg-muted",
					)}
				>
					<button
						type="button"
						onClick={() => onSelect(note.id)}
						className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 text-left"
					>
						<span className="flex size-5 shrink-0 items-center justify-center text-xs font-medium text-muted-foreground">
							{CATEGORY_LABELS[note.categoryId][0]}
						</span>
						<span className="min-w-0 flex-1 truncate">{note.name}</span>
						<span className="shrink-0 text-xs text-muted-foreground">{formatRelativeTimeShort(note.updatedAt)}</span>
					</button>

					<DropdownMenu>
						<DropdownMenuTrigger
							render={
								<Button variant="ghost" size="icon-xs" className="shrink-0 text-muted-foreground">
									<RiMoreLine />
									<span className="sr-only">Note actions</span>
								</Button>
							}
						/>
						<DropdownMenuContent align="end">
							<DropdownMenuItem variant="destructive" data-icon="inline-start" onClick={() => onDelete(note.id)}>
								<RiDeleteBinLine />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</li>
			))}
		</ul>
	);
}

const NOTE_LOAD_DELAY_MS = 600;

// Stand-in for a real server call so the loading state can be seen.
async function fetchNoteDetail(note: TestNote): Promise<Pick<TestNote, "name" | "content">> {
	await new Promise((resolve) => setTimeout(resolve, NOTE_LOAD_DELAY_MS));
	return { name: note.name, content: note.content };
}

function NoteDetailSkeleton() {
	return (
		<div className="space-y-3">
			<Skeleton className="h-4 w-1/3" />
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-5/6" />
			<Skeleton className="h-4 w-2/3" />
		</div>
	);
}

function RouteComponent() {
	const navigate = useNavigate();
	const { _splat } = Route.useParams();
	// URLs: /notes-ui-test/notes and /notes-ui-test/notes/<note-id>
	const [section, noteId] = (_splat ?? "").split("/");
	const urlId = section === "notes" ? (noteId ?? null) : null;

	// The UI follows local state so it responds on click instead of waiting for
	// the router (beforeLoad/loaders) to finish. The URL is kept in sync, and
	// external changes (back/forward, direct links) flow back into local state.
	const [selectedId, setSelectedId] = useState(urlId);
	const [prevUrlId, setPrevUrlId] = useState(urlId);
	if (urlId !== prevUrlId) {
		setPrevUrlId(urlId);
		setSelectedId(urlId);
	}

	const [notes, setNotes] = useState(createMockNotes);
	const selectedNote = notes.find((note) => note.id === selectedId) ?? null;

	const { data: detail, isLoading: isDetailLoading } = useQuery({
		queryKey: ["notes-ui-test", "note", selectedId],
		queryFn: () => {
			if (!selectedNote) throw new Error("No note selected");
			return fetchNoteDetail(selectedNote);
		},
		enabled: selectedNote !== null,
	});

	function openNote(id: string) {
		setSelectedId(id);
		void navigate({ to: "/notes-ui-test/$", params: { _splat: `notes/${id}` } });
	}

	function closeNote() {
		setSelectedId(null);
		void navigate({ to: "/notes-ui-test/$", params: { _splat: "notes" } });
	}

	function deleteNote(id: string) {
		setNotes((prev) => prev.filter((note) => note.id !== id));
		if (id === selectedId) closeNote();
	}

	return (
		<Workspace
			title={selectedNote === null ? "No note selected" : isDetailLoading ? null : (detail?.name ?? selectedNote.name)}
			isMainOpen={selectedNote !== null}
			onMainOpenChange={(open) => {
				if (!open) closeNote();
			}}
			primarySidebar={<NoteList notes={notes} selectedId={selectedId} onSelect={openNote} onDelete={deleteNote} />}
			main={
				selectedNote ? (
					isDetailLoading ? (
						<NoteDetailSkeleton />
					) : (
						<div className="whitespace-pre-wrap text-sm">{detail?.content ?? selectedNote.content}</div>
					)
				) : (
					<p className="text-sm text-muted-foreground">Select a note to view it here.</p>
				)
			}
		/>
	);
}

export const Route = createFileRoute("/_authed/notes-ui-test/$")({
	component: RouteComponent,
});
