import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type BackLinkProps = {
  href: string;
  label: string;
  className?: string;
};

export function BackLink({ href, label, className = "" }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 text-[13px] text-[var(--color-forest)] font-[var(--font-ui)] no-underline hover:underline mb-6 ${className}`}
    >
      <ArrowLeft size={14} />
      {label}
    </Link>
  );
}
