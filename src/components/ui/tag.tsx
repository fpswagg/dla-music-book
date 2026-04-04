import Link from "next/link";

interface TagProps {
  label: string;
  variant?: "keyword" | "mood";
  href?: string;
}

export function Tag({ label, variant = "keyword", href }: TagProps) {
  const base = "inline-flex items-center px-2.5 py-0.5 rounded-[var(--radius-pill)] text-[11px] font-medium font-[var(--font-ui)]";
  const styles = variant === "mood"
    ? "bg-[var(--color-amber-light)] text-[var(--color-amber)]"
    : "bg-[var(--color-sand)] text-[var(--color-text-body)]";

  const className = `${base} ${styles}`;

  if (href) {
    return <Link href={href} className={className}>{label}</Link>;
  }

  return <span className={className}>{label}</span>;
}
