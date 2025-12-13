import * as React from "react";
import { CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface GenericTableHeaderProps {
    searchTerm?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;
    filterControls?: React.ReactNode;
}

export function GenericTableHeader({
    searchTerm,
    onSearchChange,
    searchPlaceholder,
    filterControls
}: GenericTableHeaderProps) {
    return (
        <CardHeader className="flex flex-col gap-4 border-b bg-accent/30 p-4 md:flex-row md:items-center md:justify-between md:p-6">
            {(onSearchChange && searchTerm !== undefined) && (
                <div className="relative w-full md:max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder={searchPlaceholder}
                        className="pl-10"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>
            )}
            {filterControls && (
                <div className="flex flex-wrap gap-2">
                    {filterControls}
                </div>
            )}
        </CardHeader>
    );
}
