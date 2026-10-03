"use client";

import { useRef } from "react";
import { Search } from "lucide-react";
import { DualaKeyboard } from "./duala-keyboard";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Show the Duala character picker under the field. */
  dualaKeys?: boolean;
  autoFocus?: boolean;
}

export function SearchBar({ value, onChange, placeholder = "", dualaKeys = false, autoFocus }: SearchBarProps) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5 bg-linen border-[0.5px] border-stone rounded-[var(--radius-md)] px-3.5 min-h-[46px] font-ui transition-colors focus-within:border-forest focus-within:bg-parchment">
        <Search size={16} className="text-text-muted shrink-0" aria-hidden />
        <input
          ref={ref}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          autoFocus={autoFocus}
          enterKeyHint="search"
          className="bg-transparent border-none outline-none text-[16px] sm:text-[14px] text-deep flex-1 min-w-0 placeholder:text-text-muted"
        />
      </div>
      {dualaKeys && <DualaKeyboard target={ref} onChange={onChange} compact />}
    </div>
  );
}
