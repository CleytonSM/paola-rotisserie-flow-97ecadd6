import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ColumnDef } from "@/components/ui/common/generic-table";
import { formatCurrency } from "@/utils/format";
import { PAGE_SIZE } from "@/config/constants";
import { printerService } from "@/services/printer/PrinterService";
import { DateRange } from "react-day-picker";

// Helper to format date as YYYY-MM-DD
const formatDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export function useSales() {
    const [loading, setLoading] = useState(true);
    const [sales, setSales] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Date range filter
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    // Pagination / Filtering state
    const [page, setPage] = useState(1);
    const [pageSize] = useState(PAGE_SIZE);

    const [totalCount, setTotalCount] = useState(0);

    const [selectedSale, setSelectedSale] = useState<any | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    useEffect(() => {
        fetchSales();
    }, [page, searchTerm, dateRange]);

    const fetchSales = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from("sales")
                .select(`
                    id,
                    display_id,
                    created_at,
                    total_amount,
                    clients ( name ),
                    sale_items ( * ),
                    sale_payments ( payment_method, amount )
                `, { count: 'exact' })
                .order("created_at", { ascending: false });

            // Apply date range filter
            if (dateRange?.from) {
                const fromDateStr = formatDateToYYYYMMDD(dateRange.from);
                query = query.gte("created_at", fromDateStr);

                if (dateRange.to) {
                    // Add one day to include all of the end date
                    const toDate = new Date(dateRange.to);
                    toDate.setDate(toDate.getDate() + 1);
                    const toDateStr = formatDateToYYYYMMDD(toDate);
                    query = query.lt("created_at", toDateStr);
                }
            }

            // Apply search filter
            if (searchTerm) {
                if (!isNaN(Number(searchTerm))) {
                    query = query.eq("display_id", searchTerm);
                }
            }

            // Pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);

            const { data, error, count } = await query;

            if (error) throw error;
            setSales(data || []);
            setTotalCount(count || 0);
        } catch (error) {
            toast.error("Erro ao carregar vendas");
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (sale: any) => {
        setSelectedSale(sale);
        setDetailsOpen(true);
    };

    const translatePaymentMethod = (method: string) => {
        const methods: Record<string, string> = {
            "credit_card": "Crédito",
            "card_credit": "Crédito",
            "debit_card": "Débito",
            "card_debit": "Débito",
            "pix": "Pix",
            "cash": "Dinheiro"
        };
        return methods[method] || method;
    };

    const columns: ColumnDef<any>[] = [
        {
            header: "ID",
            cell: (sale) => <span className="font-medium">#{sale.display_id}</span>
        },
        {
            header: "Data",
            cell: (sale) => <span className="text-muted-foreground">{format(new Date(sale.created_at), "dd/MM/yyyy HH:mm")}</span>
        },
        {
            header: "Cliente",
            cell: (sale) => sale.clients?.name || "Consumidor Final"
        },
        {
            header: "Pagamento",
            cell: (sale) => (
                <span className="capitalize">
                    {sale.sale_payments?.map((p: any) => translatePaymentMethod(p.payment_method)).join(", ") || "-"}
                </span>
            )
        },
        {
            header: "Total",
            headerClassName: "text-right",
            cellClassName: "text-right",
            cell: (sale) => <span className="font-medium text-emerald-600">{formatCurrency(sale.total_amount)}</span>
        }
    ];

    const handlePrint = async (sale: any) => {
        try {
            // Determine payment method string
            const paymentMethods = sale.sale_payments?.map((p: any) => translatePaymentMethod(p.payment_method));
            const paymentMethodStr = paymentMethods?.length > 1 ? "Múltiplos" : (paymentMethods?.[0] || "Desconhecido");

            await printerService.printReceipt({
                storeName: "Paola Gonçalves Rotisseria",
                date: new Date(sale.created_at),
                orderId: `#${sale.display_id}`,
                clientName: sale.clients?.name,
                items: sale.sale_items.map((item: any) => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.unit_price,
                    total: item.total_price
                })),
                subtotal: sale.total_amount, // Assuming no extra discounts/fees logic separate from total for now in this view
                total: sale.total_amount,
                paymentMethod: paymentMethodStr,
                change: sale.change_amount || 0
            });
        } catch (error) {
            toast.error("Erro ao imprimir");
        }
    };

    return {
        loading,
        sales,
        searchTerm,
        setSearchTerm,
        dateRange,
        setDateRange,
        page,
        setPage,
        pageSize,
        totalCount,
        selectedSale,
        detailsOpen,
        setDetailsOpen,
        handleViewDetails,
        handlePrint,
        refreshSales: fetchSales,
        columns
    };
}
