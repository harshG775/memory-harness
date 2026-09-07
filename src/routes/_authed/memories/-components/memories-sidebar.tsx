import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarSeparator,
} from "@/components/ui/sidebar"
import { RiArchive2Fill } from "@remixicon/react"

import { Link, useSearch } from "@tanstack/react-router"
import type { CategoryId } from "../-mock-memories"
import { CATEGORY_META, MOCK_MEMORIES } from "../-mock-memories"
import { MemoriesNavUser } from "./memories-nav-user"

const CATEGORY_IDS = Object.keys(CATEGORY_META) as CategoryId[]

export function MemoriesSidebar() {
    const activeCategory = useSearch({
        strict: false,
        select: (search) => (search as { category?: CategoryId }).category,
    })

    return (
        <Sidebar>
            <SidebarHeader className="h-16  flex flex-col justify-center">
                <Link to="/">Logo</Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Memories</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton isActive={!activeCategory} render={<Link to="/memories" />}>
                                <RiArchive2Fill />
                                All
                            </SidebarMenuButton>
                            <SidebarMenuBadge>{MOCK_MEMORIES.length}</SidebarMenuBadge>
                        </SidebarMenuItem>
                        {CATEGORY_IDS.map((categoryId) => {
                            const CategoryIcon = CATEGORY_META[categoryId].icon
                            const count = MOCK_MEMORIES.filter((memory) => memory.categoryId === categoryId).length
                            return (
                                <SidebarMenuItem key={categoryId}>
                                    <SidebarMenuButton
                                        isActive={activeCategory === categoryId}
                                        render={<Link to="/memories" search={{ category: categoryId }} />}
                                    >
                                        <CategoryIcon />
                                        {CATEGORY_META[categoryId].label}
                                    </SidebarMenuButton>
                                    <SidebarMenuBadge>{count}</SidebarMenuBadge>
                                </SidebarMenuItem>
                            )
                        })}
                    </SidebarMenu>
                </SidebarGroup>
                <SidebarSeparator className={"max-w-[calc(100%-2rem)]"} />
                <SidebarGroup>
                    <SidebarGroupLabel>Settings</SidebarGroupLabel>
                    <SidebarMenu></SidebarMenu>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-3">
                <MemoriesNavUser />
            </SidebarFooter>
        </Sidebar>
    )
}
