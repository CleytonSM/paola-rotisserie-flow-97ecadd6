interface SummaryRowProps {
  label: string;
  value: string;
  valueClassName?: string;
  hasBorder?: boolean;
}

export function SummaryRow({ label, value, valueClassName, hasBorder }: SummaryRowProps) {
  const defaultValueClass = "font-sans font-semibold tabular-nums text-foreground";
  const borderClass = hasBorder ? "border-b border-border pb-3" : "";

  return (
    <div className={`flex items-center justify-between ${borderClass}`}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={valueClassName || defaultValueClass}>{value}</span>
    </div>
  );
}