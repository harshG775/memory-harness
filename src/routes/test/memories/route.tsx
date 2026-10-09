import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useIsMobile } from "#/hooks/use-mobile";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/vaul-drawer";
export const Route = createFileRoute("/test/memories")({
	component: RouteComponent,
});

function RouteComponent() {
	const isMobile = useIsMobile();

	return (
		<Drawer>
			{isMobile ? (
				<>
					<DrawerTrigger>item</DrawerTrigger>
					<DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-screen data-[vaul-drawer-direction=top]:max-h-screen">
						<Outlet />
					</DrawerContent>
				</>
			) : (
				<div className="grid grid-cols-[16rem_1fr]">
					<div>item</div>
					<div>
						<Outlet />
					</div>
				</div>
			)}
		</Drawer>
	);
}
