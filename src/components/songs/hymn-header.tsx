import Link from "next/link";

type Ref = { code: string; number: string; name?: string };

/** Number, cross-references and title, centred like a page of the book. */
export function HymnHeader({
  index,
  title,
  references,
  meta,
  size = "lg",
  hideTitle = false,
}: {
  index: number;
  title?: string;
  references: Ref[];
  meta?: React.ReactNode;
  size?: "lg" | "sm";
  /** Title equals the first line (usual in the book): keep it for screen readers only. */
  hideTitle?: boolean;
}) {
  return (
    <div className="text-center">
      <div className={`hymn-number ${size === "sm" ? "!text-[28px]" : ""}`}>{index}</div>
      {references.length > 0 && (
        <p className="hymn-refs mt-2 mb-0">
          {references.map((r, i) => (
            <span key={`${r.code}-${r.number}`}>
              {i > 0 && <span aria-hidden> – </span>}
              <Link
                href={`/hymnals#${encodeURIComponent(r.code)}`}
                title={r.name}
                className="no-underline text-inherit hover:underline"
              >
                {r.code} {r.number}
              </Link>
            </span>
          ))}
        </p>
      )}
      {title && (
        <h1
          className={
            hideTitle
              ? "sr-only"
              : `font-display text-deep m-0 mt-3 text-balance ${size === "sm" ? "text-[19px]" : "text-[24px] sm:text-[28px]"}`
          }
        >
          {title}
        </h1>
      )}
      {meta && <div className="mt-2 text-[13px] text-green-muted font-ui">{meta}</div>}
    </div>
  );
}
