import { RiCloseLine, RiCollapseDiagonalLine, RiExpandDiagonalLine } from "@remixicon/react";
import { type ReactNode, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "#/components/ui/resizable";
import { Sheet, SheetContent } from "#/components/ui/sheet";
import { useIsMobile } from "#/hooks/use-mobile";
import { cn } from "#/lib/utils";
import { Button } from "./ui/button";

const SIDEBAR_DEFAULT_WIDTH = 300;
const SIDEBAR_MIN_WIDTH = 200;

type WorkspaceProps = {
	primarySidebar: ReactNode;
	main: ReactNode;
	isMainOpen: boolean;
	onMainOpenChange: (open: boolean) => void;
	onMainOpenChangeComplete: (open: boolean) => void;
};

export function Workspace({
	primarySidebar,
	main,
	isMainOpen,
	onMainOpenChange,
	onMainOpenChangeComplete,
}: WorkspaceProps) {
	const isMo = useIsMobile();
	const [isMaximized, setIsMaximized] = useState(true);

	return (
		<ResizablePanelGroup orientation="horizontal" className="fixed inset-0">
			<ResizablePanel
				{...(isMo
					? {}
					: {
							defaultSize: SIDEBAR_DEFAULT_WIDTH,
							minSize: SIDEBAR_MIN_WIDTH,
							maxSize: "50%",
							groupResizeBehavior: "preserve-pixel-size",
						})}
				className="overflow-auto"
			>
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
							"rounded-t-2xl transition-[height,opacity,translate] duration-200 shadow-2xl rounded-2xl overflow-hidden",
							isMaximized
								? "data-[side=bottom]:h-dvh data-[side=bottom]:rounded-t-none"
								: "data-[side=bottom]:h-[70dvh]",
						)}
					>
						<div className="sticky top-0 right-0 flex justify-end bg-sidebar">
							<Button variant="ghost" size="icon-sm" onClick={() => setIsMaximized((value) => !value)}>
								{isMaximized ? <RiCollapseDiagonalLine /> : <RiExpandDiagonalLine />}
								<span className="sr-only">{isMaximized ? "Minimize" : "Maximize"}</span>
							</Button>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => {
									onMainOpenChange(false);
								}}
							>
								<RiCloseLine />
								<span className="sr-only">Close</span>
							</Button>
						</div>
						<div className="overflow-auto">{main}</div>
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
