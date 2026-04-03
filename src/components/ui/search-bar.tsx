"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search songs..." }: SearchBarProps) {
  return (
    <div className="flex items-center gap-2.5 bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] px-3.5 py-2.5 font-[var(--font-ui)] transition-colors focus-within:border-[var(--color-forest)] focus-within:bg-[var(--color-parchment)]">
      <Search size={16} className="text-[var(--color-text-muted)] shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-transparent border-none outline-none text-[13px] text-[var(--color-deep)] flex-1 placeholder:text-[var(--color-text-muted)]"
      />
    </div>
  );
}
