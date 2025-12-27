import React from "react";
import { useStoreHours } from "@/hooks/useStoreHours";
import { isStoreOpenNow } from "@/lib/storeHours";
import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";

export const StoreStatusBanner = () => {
    const { hours, isLoading } = useStoreHours();
    const [status, setStatus] = React.useState<ReturnType<typeof isStoreOpenNow> | null>(null);

    React.useEffect(() => {
        if (hours) {
            setStatus(isStoreOpenNow(hours));

            // Update every minute
            const interval = setInterval(() => {
                setStatus(isStoreOpenNow(hours));
            }, 60000);
            return () => clearInterval(interval);
        }
    }, [hours]);

    if (isLoading || !status) return null;

    return (
        <div className={cn(
            "w-full py-2 px-4 transition-colors duration-500",
            status.status === 'open' ? "bg-[#F0FDF4] border-b border-[#5DAB57]/20" :
                status.status === 'closed' ? "bg-[#FEF2F2] border-b border-[#DC2626]/20" :
                    "bg-[#F9FAFB] border-b border-[#6B7280]/20"
        )}>
            <div className="container flex items-center justify-center gap-2 text-center">
                <Clock className={cn(
                    "h-4 w-4",
                    status.status === 'open' ? "text-[#5DAB57]" :
                        status.status === 'closed' ? "text-[#DC2626]" :
                            "text-[#6B7280]"
                )} />
                <span className={cn(
                    "text-sm font-semibold tracking-wide",
                    status.status === 'open' ? "text-[#5DAB57]" :
                        status.status === 'closed' ? "text-[#DC2626]" :
                            "text-[#6B7280]"
                )}>
                    {status.message}
                </span>
            </div>
        </div>
    );
};
