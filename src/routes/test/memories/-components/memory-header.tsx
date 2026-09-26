import { RiBookOpenLine, RiDeleteBinLine, RiMore2Fill, RiPencilLine } from "@remixicon/react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "#/components/ui/sheet";
import { formatBytes, formatRelativeTime } from "#/lib/formatter";

type MemoryHeaderProps = {
	memory: {
		path: string;
		version: number;
		sizeBytes: number;
		updatedAt: string | Date;
	};
	isEditing: boolean;
	onToggleEditing: () => void;
	onDelete: () => void;
};

export function MemoryHeader({ memory, isEditing, onToggleEditing, onDelete }: MemoryHeaderProps) {
	const { path, version, sizeBytes, updatedAt } = memory;
	return (
		<header className="sticky top-0 bg-background shadow flex items-center justify-between px-5 py-2 text-foreground">
			<div>
				<div className="truncate text-sm font-medium">{path || "Untitled"}</div>
				<div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
					<span>v{version}</span>
					<span>&middot;</span>
					<span>{formatBytes(sizeBytes)}</span>
					<span>&middot;</span>
					<span>Updated {formatRelativeTime(new Date(updatedAt))}</span>
				</div>
			</div>
			<div className="flex items-center gap-1">
				<button
					type="button"
					onClick={onToggleEditing}
					className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
				>
					{isEditing ? <RiBookOpenLine className="size-4" /> : <RiPencilLine className="size-4" />}
					<span className="sr-only">{isEditing ? "Editing" : "Reading"}</span>
				</button>
				<Sheet>
					<SheetTrigger
						render={
							<button
								type="button"
								className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
							>
								<RiMore2Fill className="size-4" />
								<span className="sr-only">More</span>
							</button>
						}
					/>
					<SheetContent side="top">
						<SheetHeader>
							<SheetTitle>{path || "Untitled"}</SheetTitle>
						</SheetHeader>
						<button
							type="button"
							onClick={onDelete}
							className="mx-4 flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
						>
							<RiDeleteBinLine className="size-4" />
							Delete
						</button>
					</SheetContent>
				</Sheet>
			</div>
		</header>
	);
}
