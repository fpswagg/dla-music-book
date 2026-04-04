export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex justify-between gap-4">
        <div className="h-9 w-48 max-w-[60%] bg-[var(--color-linen)] rounded-[var(--radius-sm)]" />
        <div className="h-9 w-28 bg-[var(--color-linen)] rounded-[var(--radius-md)]" />
      </div>
      <div className="h-10 w-full max-w-md bg-[var(--color-linen)] rounded-[var(--radius-md)]" />
      <div className="h-64 bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-lg)]" />
    </div>
  );
}
