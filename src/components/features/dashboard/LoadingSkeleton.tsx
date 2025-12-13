interface LoadingSkeletonProps {
    count: number;
}

export function LoadingSkeleton({ count }: LoadingSkeletonProps) {
    return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl bg-muted/50" />
            ))}
        </div>
    );
}
