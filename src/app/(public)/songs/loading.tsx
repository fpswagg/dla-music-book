export default function SongsLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 w-48 bg-[var(--color-linen)] rounded-[var(--radius-sm)] mb-6" />
      <div className="h-12 bg-[var(--color-linen)] rounded-[var(--radius-md)] mb-4" />
      <div className="h-6 w-32 bg-[var(--color-linen)] rounded-[var(--radius-sm)] mb-4" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="h-36 bg-[var(--color-linen)] border-[0.5px] border-[var(--color-stone)] rounded-[var(--radius-lg)]"
          />
        ))}
      </div>
    </div>
  );
}
