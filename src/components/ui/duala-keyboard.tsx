"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DUALA_CHARS, insertAtCursor } from "@/lib/duala";

/**
 * Small Duala character picker (e̱ o̱ ɛ ɔ ŋ ń ḿ …) for any input or textarea.
 * Pass a ref to the field and the setter that owns its value.
 */
export function DualaKeyboard({
  target,
  onChange,
  compact = false,
}: {
  target: React.RefObject<HTMLInputElement | HTMLTextAreaElement | null>;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  const t = useTranslations("duala");
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title={t("toggle")}
        className={`font-display min-w-[36px] h-[32px] px-2 rounded-[var(--radius-sm)] border-[0.5px] cursor-pointer text-[15px] ${
          open ? "bg-forest text-parchment border-forest" : "bg-linen text-deep border-stone hover:bg-sand"
        }`}
      >
        {compact ? "ɛ" : "e̱ ɔ ŋ"}
      </button>
      {open &&
        DUALA_CHARS.map(({ char, hint }) => (
          <button
            key={char}
            type="button"
            title={hint}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const el = target.current;
              if (el) onChange(insertAtCursor(el, char));
            }}
            className="font-display min-w-[32px] h-[32px] rounded-[var(--radius-sm)] bg-parchment border-[0.5px] border-stone text-[16px] text-deep cursor-pointer hover:bg-sand"
          >
            {char}
          </button>
        ))}
    </div>
  );
}
