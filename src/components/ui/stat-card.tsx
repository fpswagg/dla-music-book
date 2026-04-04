import type { ReactNode } from "react";

interface StatCardProps {
  value: string | number;
  label: string;
  icon?: ReactNode;
}

export function StatCard({ value, label, icon }: StatCardProps) {
  return (
    <div className="bg-[var(--color-linen)] rounded-[var(--radius-md)] p-3 px-3.5 border-[0.5px] border-[var(--color-stone)]">
      <div className="flex items-center gap-2 mb-1">
        {icon && (
          <span className="text-[var(--color-green-muted)]">{icon}</span>
        )}
        <span className="text-[26px] leading-none text-[var(--color-deep)] font-[var(--font-display)]">
          {value}
        </span>
      </div>
      <div className="text-[11px] text-[var(--color-text-muted)] font-[var(--font-ui)]">
        {label}
      </div>
    </div>
  );
}
