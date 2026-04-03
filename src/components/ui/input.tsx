"use client";

import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={id}
            className="text-[11px] font-medium tracking-[0.08em] uppercase text-[var(--color-text-muted)] font-[var(--font-ui)]"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-md)] px-3.5 py-2.5 text-[13px] text-[var(--color-deep)] font-[var(--font-ui)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-forest)] focus:bg-[var(--color-parchment)] ${error ? "border-red-400" : ""} ${className}`}
          {...props}
        />
        {error && (
          <span className="text-[11px] text-red-500 font-[var(--font-ui)]">{error}</span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
