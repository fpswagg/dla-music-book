"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnnotationBlock } from "@/components/ui/annotation-block";

interface Annotation {
  lineNumber: number;
  lineText: string;
  note: string;
}

interface LyricsDisplayProps {
  lines: string[];
  annotations: Annotation[];
}

export function LyricsDisplay({ lines, annotations }: LyricsDisplayProps) {
  const t = useTranslations("song");
  const [showAnnotations, setShowAnnotations] = useState(false);

  const annotationMap = new Map<number, Annotation>();
  for (const a of annotations) {
    annotationMap.set(a.lineNumber, a);
  }

  return (
    <div>
      {annotations.length > 0 && (
        <button
          onClick={() => setShowAnnotations((v) => !v)}
          className={`mb-4 px-3 py-1.5 rounded-[var(--radius-pill)] text-[12px] font-medium font-[var(--font-ui)] border-[0.5px] cursor-pointer transition-colors ${
            showAnnotations
              ? "bg-[var(--color-amber-light)] text-[var(--color-amber)] border-[var(--color-amber)]"
              : "bg-transparent text-[var(--color-amber)] border-[var(--color-stone)]"
          }`}
        >
          {showAnnotations ? t("hideAnnotations") : t("showAnnotations")}
        </button>
      )}

      <div className="flex flex-col">
        {lines.map((line, i) => {
          const lineNum = i + 1;
          const annotation = annotationMap.get(lineNum);
          const isEmpty = line.trim() === "";

          if (isEmpty) {
            return <div key={i} className="h-4" />;
          }

          return (
            <div key={i}>
              <div className="flex gap-3 py-1 items-start">
                <span className="text-[12px] text-[var(--color-stone)] font-[var(--font-ui)] w-[28px] shrink-0 text-right select-none leading-[1.6] pt-[1px]">
                  {lineNum}
                </span>
                <div
                  className={`min-w-0 flex-1 rounded-r-[var(--radius-sm)] py-0.5 pr-1 ${
                    annotation
                      ? "bg-[var(--color-amber-light)] border-l-2 border-l-[var(--color-amber)] pl-2"
                      : ""
                  }`}
                >
                  <span className="text-[16px] text-[var(--color-deep)] font-[var(--font-display)] leading-[1.6] block">
                    {line}
                  </span>
                </div>
              </div>
              {annotation && showAnnotations && (
                <div className="ml-[40px] mt-1 mb-2 overflow-hidden animate-[slideDown_200ms_ease-out]">
                  <AnnotationBlock
                    lineText={annotation.lineText}
                    note={annotation.note}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
