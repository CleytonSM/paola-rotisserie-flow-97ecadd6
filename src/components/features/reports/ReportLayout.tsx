import { ReactNode } from "react";
import { ReportsFilters } from "./ReportsFilters";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb"; // Using global one or specific? The existing Reports.tsx used AppBreadcrumb.
import { Scaffolding } from "@/components/ui/Scaffolding";
import type { ReportsFilter } from "./types";
import type { DateRange } from "react-day-picker";

interface ReportLayoutProps {
    title: string;
    subtitle?: string;
    children: ReactNode;
    filter: ReportsFilter;
    setFilter: (f: ReportsFilter) => void;
    customDateRange: DateRange | undefined;
    setCustomDateRange: (range: DateRange | undefined) => void;
    onExport?: () => void;
}

export function ReportLayout({
    title,
    subtitle,
    children,
    filter,
    setFilter,
    customDateRange,
    setCustomDateRange,
    onExport
}: ReportLayoutProps) {
    return (
        <Scaffolding>
            <PageHeader
                title={title}
                subtitle={subtitle}
                action={
                    <ReportsFilters
                        filter={filter}
                        onFilterChange={setFilter}
                        customDateRange={customDateRange}
                        onCustomDateRangeChange={setCustomDateRange}
                        onExport={onExport || (() => { })}
                    />
                }
                children={<AppBreadcrumb />}
            />

            <div className="space-y-6">
                {children}
            </div>
        </Scaffolding>
    );
}
