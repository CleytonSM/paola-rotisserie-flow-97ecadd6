import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DetailedProjectionRow } from "./types";
import { formatCurrency, formatDate } from "@/utils/format";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ProjectionTableProps {
    title: string;
    data?: DetailedProjectionRow[];
    loading: boolean;
    type: "payable" | "receivable";
}

export function ProjectionTable({ title, data, loading, type }: ProjectionTableProps) {
    if (loading || !data) {
        return (
            <Card className="shadow-sm h-[400px]">
                <CardHeader>
                    <Skeleton className="h-6 w-[150px]" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    const isPayable = type === "payable";
    // Use semantic colors text-destructive/text-secondary instead of hardcoded
    const valueColor = isPayable ? "text-destructive" : "text-secondary";

    const daysLabel = (count: number) => {
        if (count === 1) return "1 dia com lançamentos";
        return `${count} dias com lançamentos`;
    }

    return (
        <Card className="shadow-sm h-full flex flex-col">
            <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                    <CardTitle className="font-display text-lg font-semibold tracking-wide text-foreground">
                        {title}
                    </CardTitle>
                    <Badge variant="outline" className="font-medium text-xs">
                        {daysLabel(data.length)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[400px]">
                    <Table>
                        <TableHeader className="bg-muted/50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="w-[120px]">Data</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                        Nenhum lançamento previsto.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                data.map((row, index) => (
                                    <TableRow key={index} className="hover:bg-muted/30">
                                        <TableCell className="font-medium font-sans text-muted-foreground align-top">
                                            {formatDate(row.date)}
                                        </TableCell>
                                        <TableCell className="align-top">
                                            <div className="flex flex-col gap-1">
                                                {row.items.map((item, idx) => (
                                                    <div key={idx} className="text-sm flex justify-between items-start gap-4">
                                                        <span className="text-foreground/80 truncate">{item.origin}</span>
                                                        <span className="font-sans text-xs text-muted-foreground whitespace-nowrap hidden sm:inline-block">
                                                            {formatCurrency(item.value)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className={`text-right font-bold font-sans align-top ${valueColor}`}>
                                            {formatCurrency(row.total)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
