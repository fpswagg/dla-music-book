"use client";

import { usePathname } from "next/navigation";

/** The home page already has the number field: keep the header quiet there. */
export function HideOnHome({ children }: { children: React.ReactNode }) {
  return usePathname() === "/" ? null : <>{children}</>;
}
