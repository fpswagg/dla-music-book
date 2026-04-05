"use client";

interface FilterPillProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function FilterPill({ label, active = false, onClick }: FilterPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 inline-flex items-center justify-center min-h-[40px] sm:min-h-0 px-3 py-2 sm:py-1 rounded-[var(--radius-pill)] text-[12px] font-[var(--font-ui)] border-[0.5px] cursor-pointer transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-forest)] ${
        active
          ? "bg-[var(--color-forest)] text-[var(--color-green-light)] border-[var(--color-forest)]"
          : "bg-[var(--color-linen)] text-[var(--color-text-body)] border-[var(--color-stone)] hover:bg-[var(--color-sand)]"
      }`}
    >
      {label}
    </button>
  );
}
