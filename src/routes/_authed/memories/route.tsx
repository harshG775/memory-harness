import { SidebarInset, SidebarProvider } from "#/components/ui/sidebar"
import { createFileRoute, Outlet } from "@tanstack/react-router"
import { MemoriesSidebar } from "./-components/memories-sidebar"

export const Route = createFileRoute("/_authed/memories")({
    component: RouteComponent,
})

function RouteComponent() {
    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "20rem",
                    "--sidebar-width-mobile": "20rem",
                } as React.CSSProperties
            }
        >
            <MemoriesSidebar />
            <SidebarInset>
                <Outlet />
            </SidebarInset>
        </SidebarProvider>
    )
}
