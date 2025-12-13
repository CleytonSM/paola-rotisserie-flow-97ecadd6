import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import type { TopItem } from "./types";
import { formatCurrency } from "./utils";
import { Skeleton } from "@/components/ui/skeleton";

interface TopSuppliersListProps {
  suppliers: TopItem[];
  loading?: boolean;
}

export function TopSuppliersList({ suppliers, loading }: TopSuppliersListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl tracking-wide">Gastos por Fornecedor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="popLayout">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </motion.div>
          ) : suppliers.length > 0 ? (
            suppliers.map((supplier) => (
              <motion.div
                key={supplier.name}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-1"
              >
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">{supplier.name}</span>
                  <span className="font-sans font-medium tabular-nums text-destructive">
                    {formatCurrency(supplier.value)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-accent">
                  <motion.div
                    className="h-2 rounded-full bg-destructive"
                    initial={{ width: 0 }}
                    animate={{ width: `${supplier.percentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            ))
          ) : (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center text-muted-foreground"
            >
              Nenhuma saída no período.
            </motion.p>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

