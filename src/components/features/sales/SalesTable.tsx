import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/utils/format";
import { format } from "date-fns";
import { Search, Eye, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SalesTableProps {
    sales: any[];
    loading: boolean;
    searchTerm: string;
    onSearchChange: (value: string) => void;
    onViewDetails: (sale: any) => void;
}

export function SalesTable({
    sales,
    loading,
    searchTerm,
    onSearchChange,
    onViewDetails
}: SalesTableProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-stone-100 shadow-sm">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por número do pedido..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 bg-stone-50 border-stone-200"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl border border-stone-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-stone-50">
                        <TableRow>
                            <TableHead className="font-semibold text-stone-700">Venda</TableHead>
                            <TableHead className="font-semibold text-stone-700">Data</TableHead>
                            <TableHead className="font-semibold text-stone-700">Cliente</TableHead>
                            <TableHead className="font-semibold text-stone-700">Total</TableHead>
                            <TableHead className="font-semibold text-stone-700">Pagamento</TableHead>
                            <TableHead className="font-semibold text-stone-700 w-[100px]">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Carregando vendas...
                                </TableCell>
                            </TableRow>
                        ) : sales.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center text-stone-400">
                                        <ShoppingBag className="h-12 w-12 mb-4 opacity-20" />
                                        <p>Nenhuma venda encontrada</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            sales.map((sale) => (
                                <TableRow key={sale.id} className="hover:bg-stone-50/50 transition-colors">
                                    <TableCell className="font-mono font-medium text-stone-700">
                                        #{sale.display_id || sale.id.slice(0, 8)}
                                    </TableCell>
                                    <TableCell className="text-stone-600">
                                        {format(new Date(sale.created_at), "dd/MM/yyyy HH:mm")}
                                    </TableCell>
                                    <TableCell className="text-stone-600">
                                        {sale.clients?.name || "Consumidor Final"}
                                    </TableCell>
                                    <TableCell className="font-medium text-emerald-600">
                                        {formatCurrency(sale.total_amount)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {sale.sale_payments?.map((payment: any, index: number) => (
                                                <Badge
                                                    key={index}
                                                    variant="secondary"
                                                    className="bg-stone-100 text-stone-600 border border-stone-200"
                                                >
                                                    {payment.payment_method === 'card_credit' ? 'Crédito' :
                                                        payment.payment_method === 'card_debit' ? 'Débito' :
                                                            payment.payment_method === 'pix' ? 'Pix' : 'Dinheiro'}
                                                </Badge>
                                            ))}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onViewDetails(sale)}
                                            className="hover:text-primary hover:bg-primary/10"
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Detalhes
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
