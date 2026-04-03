"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  count?: number;
}

export function NavItem({ href, icon: Icon, label, count }: NavItemProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-[18px] py-[9px] text-[13px] font-[var(--font-ui)] cursor-pointer transition-colors no-underline ${
        active
          ? "bg-[var(--color-parchment)] text-[var(--color-deep)] font-medium border-l-2 border-l-[var(--color-forest)]"
          : "text-[var(--color-text-body)] hover:bg-[var(--color-sand)] border-l-2 border-l-transparent"
      }`}
    >
      <Icon size={16} />
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-[11px] text-[var(--color-text-muted)] bg-[var(--color-sand)] px-[7px] py-[1px] rounded-[10px]">
          {count}
        </span>
      )}
    </Link>
  );
}
