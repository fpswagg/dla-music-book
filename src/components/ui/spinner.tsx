export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block w-4 h-4 border-2 border-[var(--color-stone)] border-t-[var(--color-forest)] rounded-full animate-spin shrink-0 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
