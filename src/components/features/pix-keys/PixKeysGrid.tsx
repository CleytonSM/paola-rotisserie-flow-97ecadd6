import { PixKey } from "@/services/database";
import { PixKeyCard } from "./PixKeyCard";
import { PixKeysEmptyState } from "./PixKeysEmptyState";


interface PixKeysGridProps {
    pixKeys?: PixKey[];
    onEdit: (pixKey: PixKey) => void;
    onDelete: (pixKey: PixKey) => void;
    onToggleStatus: (pixKey: PixKey) => void;
    onCreate: () => void;
}

export function PixKeysGrid({
    pixKeys,
    onEdit,
    onDelete,
    onToggleStatus,
    onCreate
}: PixKeysGridProps) {
    if (pixKeys?.length === 0) {
        return <PixKeysEmptyState onCreate={onCreate} />;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {pixKeys?.map((pixKey) => (
                <PixKeyCard
                    key={pixKey.id}
                    pixKey={pixKey}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onToggleStatus={onToggleStatus}
                />
            ))}
        </div>
    );
}
