import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { Scaffolding } from "@/components/ui/Scaffolding";
import { GenericTable } from "@/components/ui/generic-table";
import { SalesDetailsDialog } from "@/components/sales/SalesDetailsDialog";
import { useSales } from "@/hooks/useSales";

export default function Sales() {
    const {
        loading,
        sales,
        searchTerm,
        setSearchTerm,
        selectedSale,
        detailsOpen,
        setDetailsOpen,
        columns,
        handleViewDetails,
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
                searchPlaceholder="Buscar por número do pedido..."
                emptyStateMessage="Nenhuma venda encontrada."
                page={page}
                rowsPerPage={pageSize}
                count={totalCount}
                onPageChange={setPage}
            />

            <SalesDetailsDialog
                open={detailsOpen}
                onOpenChange={setDetailsOpen}
                sale={selectedSale}
            />
        </Scaffolding>
    );
}
