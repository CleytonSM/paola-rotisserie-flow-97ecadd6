import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ColumnDef } from "@/components/ui/generic-table";
import { formatCurrency } from "@/utils/format";

export function useSales() {
    const [loading, setLoading] = useState(true);
    const [sales, setSales] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Pagination / Filtering state
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);

    const [selectedSale, setSelectedSale] = useState<any | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);

    useEffect(() => {
        fetchSales();
    }, [page, searchTerm]);

    const fetchSales = async () => {
        try {
            setLoading(true);

            let query = supabase
                .from("sales")
                .select(`
                    *,
                    clients ( name ),
                    sale_items ( * ),
                    sale_payments ( * )
                `)
                .order("created_at", { ascending: false });

            if (searchTerm) {
                // If search term looks like a number, try searching by display_id
                if (!isNaN(Number(searchTerm))) {
                    query = query.eq("display_id", searchTerm);
                } else {
                    // Otherwise search by client name is tricky with joined tables in simple filters, 
                    // but we can try or maybe just filter locally for now if list is small, 
                    // OR rely on exact ID match for now to keep it simple and performant.
                    // Let's rely on ID search primarily as requested "Show sequential ID".
                }
            }

            // Pagination
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);

            const { data, error } = await query;

            if (error) throw error;
            setSales(data || []);
        } catch (error) {
            console.error("Error fetching sales:", error);
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

    return {
        loading,
        sales,
        searchTerm,
        setSearchTerm,
        page,
        setPage,
        selectedSale,
        detailsOpen,
        setDetailsOpen,
        handleViewDetails,
        refreshSales: fetchSales,
        columns
    };
}
