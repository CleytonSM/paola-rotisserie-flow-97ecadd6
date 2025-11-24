import {
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { NavGroupProps } from "@/types";

/**
 * A smart navigation group that behaves as a Collapsible in expanded mode
 * and a DropdownMenu in collapsed mode.
 */
export function NavGroup({ title, icon: Icon, items, isActive }: NavGroupProps) {
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";
    const hasActiveChild = items.some((item) => isActive(item.url));

    if (isCollapsed) {
        return (
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            tooltip={title}
                            isActive={hasActiveChild}
                            className="justify-center w-full"
                        >
                            <Icon className="size-5" />
                            <span className="sr-only">{title}</span>
                            <span className="hidden">{title}</span>
                            <ChevronRight className="hidden" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        side="right"
                        align="start"
                        className="min-w-56 rounded-xl shadow-lg border-border/50 bg-popover/95 backdrop-blur-sm p-2"
                    >
                        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2 py-1.5">
                            {title}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border/50" />
                        {items.map((item) => (
                            <DropdownMenuItem
                                key={item.title}
                                disabled={item.disabled}
                                asChild={!item.disabled}
                                className={`rounded-lg px-2 py-2 focus:bg-accent focus:text-accent-foreground ${item.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                    }`}
                            >
                                {item.disabled ? (
                                    <span className="flex items-center gap-2 w-full">
                                        {item.icon && <item.icon className="size-4" />}
                                        <span>{item.title}</span>
                                    </span>
                                ) : (
                                    <Link to={item.url} className="flex items-center gap-2 w-full">
                                        {item.icon && <item.icon className="size-4" />}
                                        <span>{item.title}</span>
                                    </Link>
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        );
    }

    return (
        <Collapsible asChild defaultOpen={hasActiveChild} className="group/collapsible">
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={title} isActive={hasActiveChild}>
                        <Icon />
                        <span>{title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub>
                        {items.map((item) => (
                            <SidebarMenuSubItem key={item.title}>
                                <SidebarMenuSubButton
                                    asChild={!item.disabled}
                                    isActive={isActive(item.url)}
                                    className={item.disabled ? "opacity-50 cursor-not-allowed" : ""}
                                >
                                    {item.disabled ? (
                                        <span className="flex items-center gap-2">
                                            {item.icon && <item.icon className="size-4" />}
                                            <span>{item.title}</span>
                                        </span>
                                    ) : (
                                        <Link to={item.url}>
                                            {item.icon && <item.icon className="size-4" />}
                                            <span>{item.title}</span>
                                        </Link>
                                    )}
                                </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}