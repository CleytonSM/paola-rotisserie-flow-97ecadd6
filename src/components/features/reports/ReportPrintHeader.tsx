import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReportPrintHeaderProps {
    title: string;
    periodLabel: string;
}

export function ReportPrintHeader({ title, periodLabel }: ReportPrintHeaderProps) {
    return (
        <div className="hidden print:block mb-6 border-b border-border pb-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-foreground">
                        Paola Gonçalves Rotisseria
                    </h1>
                    <h2 className="text-lg font-medium text-foreground mt-1">{title}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{periodLabel}</p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                    <p>Gerado em</p>
                    <p>{format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                </div>
            </div>
        </div>
    );
}
