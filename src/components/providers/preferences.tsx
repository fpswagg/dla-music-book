"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

/** Reading settings, kept in localStorage and mirrored as attributes on <html>. */
export type Preferences = {
  theme: "system" | "light" | "dark";
  text: "sm" | "md" | "lg" | "xl";
  refrain: "full" | "short";
};

export const DEFAULT_PREFERENCES: Preferences = { theme: "system", text: "md", refrain: "full" };
const KEY = "mmb:prefs";

/** Runs before paint (inline in <head>) so there is no flash of the wrong theme. */
export const PREFERENCES_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem("${KEY}")||"{}");var d=document.documentElement;var t=p.theme||"system";if(t==="system")t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";d.dataset.theme=t;d.dataset.text=p.text||"md";d.dataset.refrain=p.refrain||"full";}catch(e){}})();`;

function apply(p: Preferences) {
  const d = document.documentElement;
  const dark = p.theme === "dark" || (p.theme === "system" && matchMedia("(prefers-color-scheme: dark)").matches);
  d.dataset.theme = dark ? "dark" : "light";
  d.dataset.text = p.text;
  d.dataset.refrain = p.refrain;
}

type Ctx = { prefs: Preferences; setPrefs: (patch: Partial<Preferences>) => void };
const PreferencesContext = createContext<Ctx>({ prefs: DEFAULT_PREFERENCES, setPrefs: () => {} });

export function PreferencesProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setState] = useState<Preferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<Preferences>;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage once
      setState({ ...DEFAULT_PREFERENCES, ...stored });
    } catch {
      /* private mode */
    }
  }, []);

  useEffect(() => {
    if (prefs.theme !== "system") return;
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply(prefs);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [prefs]);

  const setPrefs = useCallback((patch: Partial<Preferences>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      apply(next);
      return next;
    });
  }, []);

  return <PreferencesContext.Provider value={{ prefs, setPrefs }}>{children}</PreferencesContext.Provider>;
}

export const usePreferences = () => useContext(PreferencesContext);
