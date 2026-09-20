import { createContext, type ReactNode, useContext, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "#/components/ui/resizable";
import { Sheet, SheetContent } from "#/components/ui/sheet";
import { useIsMobile } from "#/hooks/use-mobile";
import { cn } from "#/lib/utils";

const SIDEBAR_DEFAULT_WIDTH = 300;
const SIDEBAR_MIN_WIDTH = 200;

type WorkspaceContextProps = {
	isMobile: boolean;
	/** Mobile only: whether the bottom sheet showing the main content is open. */
	isMainOpen: boolean;
	setMainOpen: (open: boolean) => void;
	/** Mobile only: whether the sheet fills the screen. */
	isMaximized: boolean;
	setMaximized: (maximized: boolean) => void;
	toggleMaximized: () => void;
	/** Mobile only: fires once the sheet has finished its open/close animation. */
	onMainOpenChangeComplete?: (open: boolean) => void;
};

const WorkspaceContext = createContext<WorkspaceContextProps | null>(null);

export function useWorkspace() {
	const context = useContext(WorkspaceContext);
	if (!context) {
		throw new Error("useWorkspace must be used within a WorkspaceProvider.");
	}

	return context;
}

type WorkspaceProviderProps = {
	defaultMainOpen?: boolean;
	/** Controlled open state; pass it together with `onMainOpenChange`. */
	mainOpen?: boolean;
	onMainOpenChange?: (open: boolean) => void;
	onMainOpenChangeComplete?: (open: boolean) => void;
	defaultMaximized?: boolean;
	children: ReactNode;
};

export function WorkspaceProvider({
	defaultMainOpen = false,
	mainOpen: mainOpenProp,
	onMainOpenChange,
	onMainOpenChangeComplete,
	defaultMaximized = true,
	children,
}: WorkspaceProviderProps) {
	const isMobile = useIsMobile();

	// Works uncontrolled (internal state) or controlled (e.g. driven by the URL).
	const [uncontrolledMainOpen, setUncontrolledMainOpen] = useState(defaultMainOpen);
	const isMainOpen = mainOpenProp ?? uncontrolledMainOpen;

	function setMainOpen(open: boolean) {
		if (mainOpenProp === undefined) setUncontrolledMainOpen(open);
		onMainOpenChange?.(open);
	}

	const [isMaximized, setMaximized] = useState(defaultMaximized);

	return (
		<WorkspaceContext.Provider
			value={{
				isMobile,
				isMainOpen,
				setMainOpen,
				isMaximized,
				setMaximized,
				toggleMaximized: () => setMaximized((value) => !value),
				onMainOpenChangeComplete,
			}}
		>
			{children}
		</WorkspaceContext.Provider>
	);
}

type WorkspaceProps = {
	primarySidebar: ReactNode;
	main: ReactNode;
};

/** Layout only; open/maximized state comes from the surrounding WorkspaceProvider. */
export function Workspace({ primarySidebar, main }: WorkspaceProps) {
	const { isMobile, isMainOpen, setMainOpen, isMaximized, onMainOpenChangeComplete } = useWorkspace();

	return (
		<ResizablePanelGroup orientation="horizontal" className="fixed inset-0">
			<ResizablePanel
				{...(isMobile
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

			{isMobile ? (
				<Sheet
					open={isMainOpen}
					modal={false}
					onOpenChange={setMainOpen}
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
