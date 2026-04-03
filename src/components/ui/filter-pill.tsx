"use client";

interface FilterPillProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function FilterPill({ label, active = false, onClick }: FilterPillProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-[var(--radius-pill)] text-[12px] font-[var(--font-ui)] border-[0.5px] cursor-pointer transition-colors ${
        active
          ? "bg-[var(--color-forest)] text-[var(--color-green-light)] border-[var(--color-forest)]"
          : "bg-[var(--color-linen)] text-[var(--color-text-body)] border-[var(--color-stone)] hover:bg-[var(--color-sand)]"
      }`}
    >
      {label}
    </button>
  );
}
