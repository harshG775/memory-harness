import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"
import { Skeleton } from "#/components/ui/skeleton"
import { authClient } from "#/lib/auth/auth-client"
import { RiArrowDownSLine, RiArrowRightSLine, RiPaletteLine, RiLogoutBoxRLine } from "@remixicon/react"
import { useRouter } from "@tanstack/react-router"

export function MemoriesNavUser() {
    const router = useRouter()
    const { data: session, isPending } = authClient.useSession()
    if (isPending) {
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton size="lg" className="pointer-events-none">
                        <Skeleton className="size-8 rounded-lg" />
                        <div className="grid flex-1 gap-1.5">
                            <Skeleton className="h-3 w-3/4 rounded-sm" />
                            <Skeleton className="h-2.5 w-full rounded-sm" />
                        </div>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        )
    }

    if (session) {
        const user = session.user
        return (
            <SidebarMenu>
                <SidebarMenuItem>
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            render={
                                <SidebarMenuButton
                                    size="lg"
                                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                                />
                            }
                        >
                            <Avatar className="size-8 rounded-lg">
                                <AvatarImage src={user.image || ""} alt={user.name} />
                                <AvatarFallback className="rounded-lg uppercase bg-primary/20 text-primary text-xs font-semibold">
                                    {session.user.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">{user.name}</span>
                                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                            </div>
                            <RiArrowDownSLine className="ml-auto size-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="min-w-56 rounded-lg" side={"top"} align="end" sideOffset={4}>
                            <DropdownMenuGroup>
                                <DropdownMenuItem>
                                    <RiPaletteLine />
                                    Theme
                                    <RiArrowRightSLine className="ml-auto" />
                                </DropdownMenuItem>
                            </DropdownMenuGroup>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={() => {
                                    authClient.signOut().then(() => {
                                        router.navigate({
                                            to: "/sign-in",
                                            search: {
                                                from: router.state.location.href,
                                            },
                                        })
                                    })
                                }}
                                variant="destructive"
                            >
                                <RiLogoutBoxRLine />
                                Log out
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </SidebarMenuItem>
            </SidebarMenu>
        )
    }
}