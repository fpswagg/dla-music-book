interface TagProps {
  label: string;
  variant?: "keyword" | "mood";
}

export function Tag({ label, variant = "keyword" }: TagProps) {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-pill)] text-[11px] font-medium font-[var(--font-ui)]";
  const styles = variant === "mood"
    ? "bg-[var(--color-amber-light)] text-[var(--color-amber)]"
    : "bg-[var(--color-sand)] text-[var(--color-text-body)]";

  return <span className={`${base} ${styles}`}>{label}</span>;
}
