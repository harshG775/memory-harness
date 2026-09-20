import { RiArrowDownSLine } from "@remixicon/react";
import { cn } from "cn";
import type * as React from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "#/components/ui/collapsible";

const rowClassName =
	"flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-ring/50";

function FileTree({ className, ...props }: React.ComponentProps<"ul">) {
	return <ul data-slot="file-tree" className={cn("flex flex-col gap-0.5", className)} {...props} />;
}

type FileTreeFolderProps = {
	name: string;
	/** Optional icon shown between the chevron and the name. */
	icon?: React.ReactNode;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children?: React.ReactNode;
	className?: string;
};

function FileTreeFolder({ name, icon, open, onOpenChange, children, className }: FileTreeFolderProps) {
	return (
		<li data-slot="file-tree-folder" className={className}>
			<Collapsible open={open} onOpenChange={onOpenChange}>
				<CollapsibleTrigger className={rowClassName}>
					<RiArrowDownSLine
						className={cn("size-4 shrink-0 text-muted-foreground transition-transform", !open && "-rotate-90")}
					/>
					{icon && <span className="shrink-0 text-muted-foreground [&_svg]:size-4">{icon}</span>}
					<span className="truncate">{name}</span>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<FileTree className="ml-3.5 border-l border-border pl-1.5">{children}</FileTree>
				</CollapsibleContent>
			</Collapsible>
		</li>
	);
}

type FileTreeFileProps = Omit<React.ComponentProps<"button">, "children"> & {
	name: string;
	selected?: boolean;
	/** Small label on the right, e.g. a file type. */
	badge?: React.ReactNode;
};

function FileTreeFile({ name, selected, badge, className, ...props }: FileTreeFileProps) {
	return (
		<li data-slot="file-tree-file">
			<button
				type="button"
				aria-current={selected ? "true" : undefined}
				className={cn(
					rowClassName,
					selected && "bg-background shadow-sm ring-1 ring-foreground/10 hover:bg-background",
					className,
				)}
				{...props}
			>
				<span className="min-w-0 flex-1 truncate">{name}</span>
				{badge && <span className="shrink-0 text-[10px] font-medium text-muted-foreground uppercase">{badge}</span>}
			</button>
		</li>
	);
}

export { FileTree, FileTreeFile, FileTreeFolder };
