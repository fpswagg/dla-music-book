interface StatCardProps {
  value: string | number;
  label: string;
}

export function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="bg-[var(--color-linen)] rounded-[var(--radius-md)] p-3 px-3.5">
      <div className="text-[26px] leading-none text-[var(--color-deep)] font-[var(--font-display)]">
        {value}
      </div>
      <div className="mt-1 text-[11px] text-[var(--color-text-muted)] font-[var(--font-ui)]">
        {label}
      </div>
    </div>
  );
}
