import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { Scaffolding } from "@/components/ui/Scaffolding";
import { GenericTable } from "@/components/ui/common/generic-table";
import { SalesDetailsDialog } from "@/components/features/sales/SalesDetailsDialog";
import { SalesFilters } from "@/components/features/sales/SalesFilters";
import { useSales } from "@/hooks/useSales";

export default function Sales() {
    const {
        loading,
        sales,
        searchTerm,
        setSearchTerm,
        dateRange,
        setDateRange,
        selectedSale,
        detailsOpen,
        setDetailsOpen,
        columns,
        handleViewDetails,
        handlePrint,
        page,
        setPage,
        pageSize,
        totalCount
    } = useSales();

    return (
        <Scaffolding>
            <PageHeader
                title="Histórico de Vendas"
                subtitle="Consulte e gerencie todas as vendas realizadas."
                children={<AppBreadcrumb />}
            />

            <GenericTable
                data={sales}
                columns={columns}
                isLoading={loading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onViewDetails={handleViewDetails}
                onPrint={handlePrint}
                searchPlaceholder="Buscar por número do pedido..."
                emptyStateMessage="Nenhuma venda encontrada."
                page={page}
                rowsPerPage={pageSize}
                count={totalCount}
                onPageChange={setPage}
                filterControls={
                    <SalesFilters
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                    />
                }
            />

            <SalesDetailsDialog
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                sale={selectedSale}
            />
        </Scaffolding>
    );
}
