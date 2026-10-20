"use client";

/** Verovio (score engraving, WebAssembly) loaded on demand from /vendor (copied by scripts/copy-vendor.mjs). */

export const VEROVIO_VERSION = "6.3.0";

export type VerovioToolkit = {
  setOptions(o: Record<string, unknown>): void;
  loadData(data: string): boolean;
  getPageCount(): number;
  renderToSVG(page: number): string;
  renderToTimemap(o?: Record<string, unknown>): TimemapEvent[];
  getMIDIValuesForElement(id: string): { pitch: number; time: number; duration: number };
  getMEI(o?: Record<string, unknown>): string;
  redoLayout(o?: Record<string, unknown>): void;
};

export type TimemapEvent = {
  tstamp: number;
  qstamp: number;
  on?: string[];
  off?: string[];
  measureOn?: string;
  tempo?: number;
};

type VerovioGlobal = { module: { onRuntimeInitialized?: () => void; calledRun?: boolean }; toolkit: new () => VerovioToolkit };

let loading: Promise<VerovioGlobal> | null = null;

function load(): Promise<VerovioGlobal> {
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const w = window as unknown as { verovio?: VerovioGlobal };
    const ready = () => {
      const v = w.verovio!;
      if (v.module.calledRun) resolve(v);
      else v.module.onRuntimeInitialized = () => resolve(v);
    };
    if (w.verovio) return ready();
    const s = document.createElement("script");
    s.src = `/vendor/verovio-${VEROVIO_VERSION}.js`;
    s.async = true;
    s.onload = ready;
    s.onerror = () => {
      loading = null;
      reject(new Error("VEROVIO_LOAD_FAILED"));
    };
    document.head.appendChild(s);
  });
  return loading;
}

export async function createToolkit(): Promise<VerovioToolkit> {
  const v = await load();
  return new v.toolkit();
}
