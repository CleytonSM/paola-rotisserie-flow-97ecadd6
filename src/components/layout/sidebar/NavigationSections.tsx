import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarSeparator,
    useSidebar,
} from "@/components/ui/sidebar";
import { navigationGroups } from "@/navigationConfig";
import { Link } from "react-router-dom";
import { NavGroup } from "./NavGroups";

interface NavigationSectionsProps {
    isActive: (path: string) => boolean;
}

export function NavigationSections({ isActive }: NavigationSectionsProps) {
    const { isMobile, setOpenMobile } = useSidebar();

    const handleClick = () => {
        if (isMobile) {
            setOpenMobile(false);
        }
    };

    return (
        <>
            {/* Overview Section */}
            <SidebarGroup className="pt-0">
                <SidebarGroupLabel>{navigationGroups.overview.label}</SidebarGroupLabel>
                <SidebarMenu>
                    {navigationGroups.overview.items.map((item) => (
                        <SidebarMenuItem key={item.url}>
                            <SidebarMenuButton
                                asChild
                                isActive={isActive(item.url)}
                                tooltip={item.title}
                                className="rounded-xl transition-all duration-200 hover:bg-sidebar-accent hover:shadow-sm group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2"
                            >
                                <Link to={item.url} onClick={handleClick}>
                                    {item.icon && <item.icon className="text-primary size-5" />}
                                    <span className="font-medium group-data-[collapsible=icon]:hidden">
                                        {item.title}
                                    </span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>

            <SidebarSeparator className="mx-4 bg-border/80 h-[2px]" />

            {/* Financial Section */}
            <SidebarGroup>
                <SidebarGroupLabel>{navigationGroups.financial.label}</SidebarGroupLabel>
                <SidebarMenu>
                    {navigationGroups.financial.items.map((item) => (
                        item.items ? (
                            <NavGroup
                                key={item.title}
                                title={item.title}
                                icon={item.icon!}
                                items={item.items}
                                isActive={isActive}
                            />
                        ) : (
                            <SidebarMenuItem key={item.url}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive(item.url)}
                                    tooltip={item.title}
                                    className="rounded-xl transition-all duration-200 hover:bg-sidebar-accent hover:shadow-sm group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2"
                                >
                                    <Link to={item.url} onClick={handleClick}>
                                        {item.icon && (
                                            <item.icon
                                                className={
                                                    item.url === "/admin/receivable"
                                                        ? "text-secondary"
                                                        : item.url === "/admin/payable"
                                                            ? "text-destructive"
                                                            : "text-foreground/70"
                                                }
                                            />
                                        )}
                                        <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        )
                    ))}
                </SidebarMenu>
            </SidebarGroup>

            <SidebarSeparator className="mx-4 bg-border/80 h-[2px]" />

            {/* Management Section */}
            <SidebarGroup>
                <SidebarGroupLabel>{navigationGroups.management.label}</SidebarGroupLabel>
                <SidebarMenu>
                    {navigationGroups.management.groups.map((group) => (
                        <NavGroup
                            key={group.title}
                            title={group.title}
                            icon={group.icon}
                            isActive={isActive}
                            items={group.items}
                        />
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        </>
    );
}
