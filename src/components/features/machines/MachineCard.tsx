import { Edit, Trash2, CreditCard } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CardMachine } from "@/services/database";

interface MachineCardProps {
    machine: CardMachine;
    onEdit: (machine: CardMachine) => void;
    onDelete: (machine: CardMachine) => void;
}

export function MachineCard({ machine, onEdit, onDelete }: MachineCardProps) {
    return (
        <Card className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-video w-full bg-muted/30 relative flex items-center justify-center">
                {machine.image_url ? (
                    <img
                        src={machine.image_url}
                        alt={machine.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <CreditCard className="w-16 h-16 text-muted-foreground/20" />
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 opacity-90 hover:opacity-100 shadow-sm"
                        onClick={() => onEdit(machine)}
                    >
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 opacity-90 hover:opacity-100"
                        onClick={() => onDelete(machine)}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-playfair">{machine.name}</CardTitle>
            </CardHeader>

            <CardContent>
                <div className="space-y-3">
                    <div className="text-sm font-medium text-muted-foreground">
                        Taxas e Bandeiras
                    </div>
                    {machine.flags && machine.flags.length > 0 ? (
                        <div className="space-y-2">
                            {machine.flags.map((flag) => (
                                <div
                                    key={flag.id}
                                    className="flex items-center justify-between text-sm border-b last:border-0 pb-1 last:pb-0"
                                >
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="font-normal">
                                            {flag.brand}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground capitalize">
                                            {flag.type === "credit" ? "Crédito" : "Débito"}
                                        </span>
                                    </div>
                                    <span className="font-medium font-mono">
                                        {flag.tax_rate}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground italic">
                            Nenhuma bandeira configurada
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
