import { EmptyState } from "./EmptyState";
import { MachineCard } from "./MachineCard";
import { CardMachine } from "@/services/database";

interface MachinesGridProps {
    machines?: CardMachine[];
    onEdit: (machine: CardMachine) => void;
    onDelete: (machine: CardMachine) => void;
    onCreate: () => void;
}

export function MachinesGrid({ machines, onEdit, onDelete, onCreate }: MachinesGridProps) {
    if (machines?.length === 0) {
        return <EmptyState onCreate={onCreate} />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {machines?.map((machine) => (
                <MachineCard
                    key={machine.id}
                    machine={machine}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}
