import { PaymentMethodCard } from "@/components/pdv/PaymentMethodCard";
import { Banknote, CreditCard, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MethodPix } from "./methods/MethodPix";
import { MethodCash } from "./methods/MethodCash";
import { MethodCard } from "./methods/MethodCard";
import { CardMachine } from "@/services/database/machines";

interface PaymentMethodsProps {
    selectedMethod: string | null;
    setSelectedMethod: (method: string) => void;
    pixKeys: any[];
    selectedPixKey: string;
    setSelectedPixKey: (key: string) => void;
    onGenerateQRCode: () => void;
    amountGiven: string;
    setAmountGiven: (amount: string) => void;
    change: number;
    machines: CardMachine[];
    selectedMachine: string;
    setSelectedMachine: (id: string) => void;
    selectedFlag: string;
    setSelectedFlag: (id: string) => void;
    totalWithFees: number;
    originalTotal: number;
    isProcessing: boolean;
    onConfirm: () => void;
}

export function PaymentMethods({
    selectedMethod,
    setSelectedMethod,
    pixKeys,
    selectedPixKey,
    setSelectedPixKey,
    onGenerateQRCode,
    amountGiven,
    setAmountGiven,
    change,
    machines,
    selectedMachine,
    setSelectedMachine,
    selectedFlag,
    setSelectedFlag,
    totalWithFees,
    originalTotal,
    isProcessing,
    onConfirm
}: PaymentMethodsProps) {
    return (
        <div className="space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-sidebar-border space-y-4">
                <h2 className="font-playfair font-semibold text-lg mb-2 text-foreground">Forma de Pagamento</h2>
                <PaymentMethodCard
                    id="pix"
                    title="Pix"
                    icon={KeyRound}
                    selected={selectedMethod === "pix"}
                    onClick={() => setSelectedMethod("pix")}
                >
                    {selectedMethod === "pix" && (
                        <MethodPix
                            pixKeys={pixKeys}
                            selectedPixKey={selectedPixKey}
                            setSelectedPixKey={setSelectedPixKey}
                            onGenerateQRCode={onGenerateQRCode}
                        />
                    )}
                </PaymentMethodCard>

                <PaymentMethodCard
                    id="money"
                    title="Dinheiro"
                    icon={Banknote}
                    selected={selectedMethod === "money"}
                    onClick={() => setSelectedMethod("money")}
                >
                    {selectedMethod === "money" && (
                        <MethodCash
                            amountGiven={amountGiven}
                            setAmountGiven={setAmountGiven}
                            change={change}
                        />
                    )}
                </PaymentMethodCard>

                <PaymentMethodCard
                    id="credit_card"
                    title="Cartão de Crédito"
                    icon={CreditCard}
                    selected={selectedMethod === "credit_card"}
                    onClick={() => setSelectedMethod("credit_card")}
                >
                    {selectedMethod === "credit_card" && (
                        <MethodCard
                            machines={machines}
                            selectedMachine={selectedMachine}
                            setSelectedMachine={setSelectedMachine}
                            selectedFlag={selectedFlag}
                            setSelectedFlag={setSelectedFlag}
                            type="credit"
                            totalWithFees={totalWithFees}
                            originalTotal={originalTotal}
                        />
                    )}
                </PaymentMethodCard>

                <PaymentMethodCard
                    id="debit_card"
                    title="Cartão de Débito"
                    icon={CreditCard}
                    selected={selectedMethod === "debit_card"}
                    onClick={() => setSelectedMethod("debit_card")}
                >
                    {selectedMethod === "debit_card" && (
                        <MethodCard
                            machines={machines}
                            selectedMachine={selectedMachine}
                            setSelectedMachine={setSelectedMachine}
                            selectedFlag={selectedFlag}
                            setSelectedFlag={setSelectedFlag}
                            type="debit"
                            totalWithFees={totalWithFees}
                            originalTotal={originalTotal}
                        />
                    )}
                </PaymentMethodCard>
            </div>

            <Button
                size="lg"
                className="w-full h-16 text-xl mt-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md rounded-xl transition-all active:scale-95"
                disabled={!selectedMethod || isProcessing}
                onClick={onConfirm}
            >
                {isProcessing ? "Processando..." : "Confirmar e Cobrar"}
            </Button>
        </div>
    );
}
