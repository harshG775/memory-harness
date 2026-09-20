import type { ReactNode } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "#/components/ui/resizable";
import { Sheet, SheetContent } from "#/components/ui/sheet";
import { useIsMobile } from "#/hooks/use-mobile";
import { cn } from "#/lib/utils";

type WorkspaceProps = {
	primarySidebar: ReactNode;
	main: ReactNode;
	/** Mobile only: whether the bottom sheet showing `main` is open. */
	isMainOpen: boolean;
	onMainOpenChange: (open: boolean) => void;
	/** Mobile only: fires once the sheet has finished its open/close animation. */
	onMainOpenChangeComplete: (open: boolean) => void;
};

/** Presentational layout: sidebar + main panel (desktop) or bottom sheet (mobile). */
export function Workspace({
	primarySidebar,
	main,
	isMainOpen,
	onMainOpenChange,
	onMainOpenChangeComplete,
}: WorkspaceProps) {
	const isMo = useIsMobile();
	const isMaximized = false;

	return (
		<ResizablePanelGroup orientation="horizontal" className="fixed inset-0">
			<ResizablePanel minSize={"20%"} defaultSize={"20%"} className="overflow-auto">
				{primarySidebar}
			</ResizablePanel>

			{isMo ? (
				<Sheet
					open={isMainOpen}
					modal={false}
					onOpenChange={onMainOpenChange}
					onOpenChangeComplete={onMainOpenChangeComplete}
				>
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
						{main}
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
