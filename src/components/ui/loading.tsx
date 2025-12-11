
import { Loader2 } from "lucide-react";

export function Loading() {
    return (
        <div className="flex items-center justify-center p-8 w-full h-full min-h-[50vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}
