import { createContext, type ReactNode, useContext, useState } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "#/components/ui/resizable";
import { Drawer, DrawerContent } from "#/components/ui/vaul-drawer";
import { useIsMobile } from "#/hooks/use-mobile";

const SIDEBAR_DEFAULT_WIDTH = 300;
const SIDEBAR_MIN_WIDTH = 200;

type WorkspaceContextProps = {
	isMobile: boolean;
	isMainOpen: boolean;
	setMainOpen: (open: boolean) => void;
	isMaximized: boolean;
	setMaximized: (maximized: boolean) => void;
	toggleMaximized: () => void;
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
				<Drawer
					open={isMainOpen}
					// modal={false}
					direction="bottom"
					onOpenChange={setMainOpen}
					onAnimationEnd={onMainOpenChangeComplete}
				>
					<DrawerContent>{main}</DrawerContent>
				</Drawer>
			) : (
				<>
					<ResizableHandle withHandle />
					<ResizablePanel minSize={"50%"}>{main}</ResizablePanel>
				</>
			)}
		</ResizablePanelGroup>
	);
}
