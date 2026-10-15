import { RiBookOpenLine, RiDeleteBinLine, RiMore2Fill, RiPencilLine } from "@remixicon/react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "#/components/ui/dropdown-menu";
import { DrawerDescription, DrawerHeader, DrawerTitle } from "#/components/ui/vaul-drawer";
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
        <DrawerHeader className="flex-row justify-between items-center">
            <div>
                <DrawerTitle className="text-left">{path || "Untitled"}</DrawerTitle>
                <DrawerDescription className="text-left">
                    <span>v{version}</span>
                    <span>&middot;</span>
                    <span>{formatBytes(sizeBytes)}</span>
                    <span>&middot;</span>
                    <span>Updated {formatRelativeTime(new Date(updatedAt))}</span>
                </DrawerDescription>
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
                <DropdownMenu>
                    <DropdownMenuTrigger
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
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem variant="destructive" onClick={onDelete}>
                            <RiDeleteBinLine className="size-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </DrawerHeader>
    );
}
