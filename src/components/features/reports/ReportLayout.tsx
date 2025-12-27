import { ReactNode } from "react";
import { ReportsFilters } from "./ReportsFilters";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { Scaffolding } from "@/components/ui/Scaffolding";
import { ReportPrintHeader } from "./ReportPrintHeader";
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
    onExportPdf?: () => void;
    onExportCsv?: () => void;
    onShareWhatsApp?: () => void;
    loading?: boolean;
    periodLabel?: string;
    reportContentId?: string;
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
    onExportPdf,
    onExportCsv,
    onShareWhatsApp,
    loading,
    periodLabel = "",
    reportContentId = "report-content",
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
                        onExportPdf={onExportPdf}
                        onExportCsv={onExportCsv}
                        onShareWhatsApp={onShareWhatsApp}
                        loading={loading}
                    />
                }
                children={<AppBreadcrumb />}
            />

            <div id={reportContentId} className="space-y-6">
                <ReportPrintHeader title={title} periodLabel={periodLabel} />
                {children}
            </div>
        </Scaffolding>
    );
}
