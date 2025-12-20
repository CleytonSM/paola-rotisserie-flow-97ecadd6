import { KanbanColumn } from "./kanban.types";

export const KANBAN_COLUMNS: KanbanColumn[] = [
    { status: 'received', color: 'bg-blue-50 border-blue-200', dropColor: 'ring-blue-400 bg-blue-100/50' },
    { status: 'preparing', color: 'bg-amber-50 border-amber-200', dropColor: 'ring-amber-400 bg-amber-100/50' },
    { status: 'ready', color: 'bg-emerald-50 border-emerald-200', dropColor: 'ring-emerald-400 bg-emerald-100/50' },
    { status: 'delivered', color: 'bg-primary/10 border-primary/30', dropColor: 'ring-primary bg-primary/20' },
];
