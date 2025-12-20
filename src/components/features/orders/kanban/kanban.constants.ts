import { KanbanColumn } from "./kanban.types";

export const KANBAN_COLUMNS: KanbanColumn[] = [
    { status: 'received', color: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800', dropColor: 'ring-blue-400 bg-blue-100/50 dark:bg-blue-900/50' },
    { status: 'preparing', color: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800', dropColor: 'ring-amber-400 bg-amber-100/50 dark:bg-amber-900/50' },
    { status: 'ready', color: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800', dropColor: 'ring-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/50' },
    { status: 'delivered', color: 'bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/40', dropColor: 'ring-primary bg-primary/20 dark:bg-primary/30' },
];

