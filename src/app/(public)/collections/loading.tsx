export default function CollectionsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 w-56 bg-[var(--color-linen)] rounded-[var(--radius-sm)] mb-6" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-28 bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-lg)]"
          />
        ))}
      </div>
    </div>
  );
}
