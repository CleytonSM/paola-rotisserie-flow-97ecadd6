import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, Download, MessageSquare, ChevronDown, FileDown } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
                        className="bg-background text-foreground hover:bg-muted"
                        disabled={loading}
                    >
                        <FileDown className="mr-2 h-4 w-4" />
                        Exportar
                        <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={onExportPdf} disabled={loading}>
                        <FileText className="mr-2 h-4 w-4" />
                        Exportar PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onExportCsv} disabled={loading}>
                        <Download className="mr-2 h-4 w-4" />
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
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={onExportPdf} disabled={loading}>
                        <FileText className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Exportar PDF</p>
                </TooltipContent>
            </Tooltip>

            <Tooltip>
                <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" onClick={onExportCsv} disabled={loading}>
                        <Download className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Exportar CSV</p>
                </TooltipContent>
            </Tooltip>

            {onShareWhatsApp && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={onShareWhatsApp} disabled={loading}>
                            <MessageSquare className="h-4 w-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Enviar WhatsApp</p>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}
