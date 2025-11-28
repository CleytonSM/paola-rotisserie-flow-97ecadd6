import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CardMachine } from "@/services/database/machines";
import { formatCurrency } from "@/utils/format";

interface MethodCardProps {
    machines: CardMachine[];
    selectedMachine: string;
    setSelectedMachine: (id: string) => void;
    selectedFlag: string;
    setSelectedFlag: (id: string) => void;
    type: 'credit' | 'debit';
    totalWithFees: number;
    originalTotal: number;
}

export function MethodCard({
    machines,
    selectedMachine,
    setSelectedMachine,
    selectedFlag,
    setSelectedFlag,
    type,
    totalWithFees,
    originalTotal
}: MethodCardProps) {
    const selectedMachineData = machines.find(m => m.id === selectedMachine);
    const availableFlags = selectedMachineData?.flags?.filter(f => f.type === type) || [];

    return (
        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
            <Select value={selectedMachine} onValueChange={(val) => {
                setSelectedMachine(val);
                setSelectedFlag(""); // Reset flag when machine changes
            }}>
                <SelectTrigger className="border-sidebar-border focus:ring-primary/20">
                    <SelectValue placeholder="Selecione a maquininha" />
                </SelectTrigger>
                <SelectContent>
                    {machines.map(machine => (
                        <SelectItem key={machine.id} value={machine.id}>
                            {machine.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {selectedMachine && (
                <Select value={selectedFlag} onValueChange={setSelectedFlag}>
                    <SelectTrigger className="border-sidebar-border focus:ring-primary/20">
                        <SelectValue placeholder="Selecione a bandeira" />
                    </SelectTrigger>
                    <SelectContent>
                        {availableFlags.map(flag => (
                            <SelectItem key={flag.id} value={flag.id}>
                                {flag.brand} ({flag.tax_rate}%)
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}

            {selectedFlag && totalWithFees > originalTotal && (
                <div className="flex justify-between items-center p-3 bg-sidebar-accent/50 rounded-lg border border-sidebar-border border-dashed">
                    <span className="text-sm font-medium text-muted-foreground">Total com Taxas</span>
                    <span className="text-lg font-bold text-primary">{formatCurrency(totalWithFees)}</span>
                </div>
            )}
        </div>
    );
}
