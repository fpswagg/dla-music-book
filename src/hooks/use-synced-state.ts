"use client";

import { useState } from "react";

/** Local state that resets when `source` changes (e.g. a search box following the URL). */
export function useSyncedState<T>(source: T) {
  const [state, setState] = useState(source);
  const [prev, setPrev] = useState(source);
  if (!Object.is(prev, source)) {
    setPrev(source);
    setState(source);
  }
  return [state, setState] as const;
}
