import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileDown, MessageSquare, ChevronDown } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";

interface ReportExportActionsProps {
    onExportPdf: () => void;
    onExportCsv: () => void;
    onShareWhatsApp?: () => void;
    loading?: boolean;
}

export function ReportExportActions({
    onExportPdf,
    onExportCsv,
    onShareWhatsApp,
    loading = false,
}: ReportExportActionsProps) {
    const isMobile = useMediaQuery("(max-width: 768px)");

    if (isMobile) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="outline"
                        className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
                        disabled={loading}
                    >
                        <FileDown className="mr-2 h-4 w-4" />
                        Exportar
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={onExportPdf} disabled={loading}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Exportar PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onExportCsv} disabled={loading}>
                        <FileDown className="mr-2 h-4 w-4" />
                        Exportar CSV
                    </DropdownMenuItem>
                    {onShareWhatsApp && (
                        <DropdownMenuItem onClick={onShareWhatsApp} disabled={loading}>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Enviar WhatsApp
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                onClick={onExportPdf}
                disabled={loading}
                className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
            >
                <FileDown className="mr-2 h-4 w-4" />
                PDF
            </Button>
            <Button
                variant="outline"
                onClick={onExportCsv}
                disabled={loading}
                className="border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
            >
                <FileDown className="mr-2 h-4 w-4" />
                CSV
            </Button>
            {onShareWhatsApp && (
                <Button
                    variant="outline"
                    onClick={onShareWhatsApp}
                    disabled={loading}
                    className="border-secondary/30 bg-secondary/5 text-secondary hover:bg-secondary/10 hover:text-secondary"
                >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    WhatsApp
                </Button>
            )}
        </div>
    );
}
