"use client";

import { useEffect, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { CloudDownload, Check, RefreshCw } from "lucide-react";
import { offlineSupported, readOfflineBundle, saveOfflineBundle } from "./offline-store";

/** "Save hymns for offline use" with status. */
export function OfflineToggle() {
  const t = useTranslations("offline");
  const format = useFormatter();
  const [state, setState] = useState<{ count: number; date: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const ok = offlineSupported();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- browser capability check after mount
    setSupported(ok);
    if (ok) void readOfflineBundle().then((b) => b && setState({ count: b.songs.length, date: b.generatedAt }));
  }, []);

  if (!supported) return null;

  const save = async () => {
    setBusy(true);
    setError(false);
    try {
      const b = await saveOfflineBundle();
      setState({ count: b.songs.length, date: b.generatedAt });
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t-[0.5px] border-t-stone pt-3">
      <p className="text-[11px] font-medium tracking-[0.08em] uppercase text-text-muted m-0 mb-1.5">{t("title")}</p>
      {state && (
        <p className="text-[12px] text-green-muted m-0 mb-2 flex items-center gap-1.5">
          <Check size={13} className="text-forest" />
          {t("saved", { count: state.count, date: format.dateTime(new Date(state.date), { dateStyle: "medium" }) })}
        </p>
      )}
      {error && <p className="text-[12px] text-danger m-0 mb-2">{t("failed")}</p>}
      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="w-full min-h-[38px] inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] bg-linen border-[0.5px] border-stone text-[12px] text-deep cursor-pointer hover:bg-sand disabled:opacity-60"
      >
        {busy ? <RefreshCw size={14} className="animate-spin" /> : <CloudDownload size={14} />}
        {state ? t("update") : t("save")}
      </button>
      {state && (
        <a href="/offline" className="block mt-2 text-[12px] text-forest">
          {t("openReader")}
        </a>
      )}
    </div>
  );
}
