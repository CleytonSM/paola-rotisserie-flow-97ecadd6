import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function SummarySkeleton() {
    return (
        <Card className="flex h-full flex-col">
            <CardHeader>
                <div className="h-8 w-24 animate-pulse rounded bg-muted/50" />
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <SkeletonRow widthClass="w-24" valueWidthClass="w-16" />
                    <SkeletonRow widthClass="w-32" valueWidthClass="w-8" />
                    <SkeletonRow widthClass="w-36" valueWidthClass="w-8" />
                    <SkeletonRow widthClass="w-28" valueWidthClass="w-8" hasBorder={false} />
                </div>
            </CardContent>
        </Card>
    );
}

interface SkeletonRowProps {
    widthClass: string;
    valueWidthClass: string;
    hasBorder?: boolean;
}

function SkeletonRow({ widthClass, valueWidthClass, hasBorder = true }: SkeletonRowProps) {
    return (
        <div className={`flex items-center justify-between ${hasBorder ? "border-b border-border pb-3" : ""}`}>
            <div className={`h-4 ${widthClass} animate-pulse rounded bg-muted/50`} />
            <div className={`h-4 ${valueWidthClass} animate-pulse rounded bg-muted/50`} />
        </div>
    );
}
