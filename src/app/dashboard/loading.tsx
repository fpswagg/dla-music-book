export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-6 w-40 bg-[var(--color-linen)] rounded-[var(--radius-sm)]" />
      <div className="h-9 w-64 bg-[var(--color-linen)] rounded-[var(--radius-sm)]" />
      <div className="h-40 bg-[var(--color-linen)] rounded-[var(--radius-md)]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-36 bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-lg)]"
          />
        ))}
      </div>
    </div>
  );
}
