interface AnnotationBlockProps {
  lineText: string;
  note: string;
}

export function AnnotationBlock({ lineText, note }: AnnotationBlockProps) {
  return (
    <div className="bg-[var(--color-amber-light)] border-l-2 border-l-[var(--color-amber)] rounded-r-[var(--radius-md)] px-3.5 py-2.5">
      <div className="text-[14px] text-[var(--color-deep)] italic font-[var(--font-display)] mb-1">
        &ldquo;{lineText}&rdquo;
      </div>
      <div className="text-[12px] text-[var(--color-text-muted)] font-[var(--font-ui)]">
        {note}
      </div>
    </div>
  );
}
