import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import type { TopItem } from "./types";
import { formatCurrency } from "./utils";

interface TopClientsListProps {
  clients: TopItem[];
}

export function TopClientsList({ clients }: TopClientsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-2xl tracking-wide">Receita por Cliente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="popLayout">
          {clients.length > 0 ? (
            clients.map((client) => (
              <motion.div
                key={client.name}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-1"
              >
                <div className="flex justify-between">
                  <span className="font-medium text-foreground">{client.name}</span>
                  <span className="font-sans font-medium tabular-nums text-secondary">
                    {formatCurrency(client.value)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-accent">
                  <motion.div
                    className="h-2 rounded-full bg-secondary"
                    initial={{ width: 0 }}
                    animate={{ width: `${client.percentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            ))
          ) : (
            <p className="py-8 text-center text-muted-foreground">
              Nenhuma entrada no período.
            </p>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

