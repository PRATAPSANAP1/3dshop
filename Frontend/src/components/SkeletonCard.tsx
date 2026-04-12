const SkeletonCard = ({ className = "" }: { className?: string }) => (
  <div className={`skeleton-loader p-6 ${className}`}>
    <div className="space-y-3">
      <div className="h-4 w-2/3 rounded bg-muted-foreground/10" />
      <div className="h-8 w-1/2 rounded bg-muted-foreground/10" />
      <div className="h-3 w-full rounded bg-muted-foreground/10" />
    </div>
  </div>
);

export const SkeletonTable = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="skeleton-loader h-14 rounded-lg" />
    ))}
  </div>
);

export default SkeletonCard;
