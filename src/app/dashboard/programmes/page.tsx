import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { ListMusic } from "lucide-react";
import { getCurrentUser } from "@/lib/auth-helpers";
import { listSetlists } from "@/lib/setlists";
import { BackLink } from "@/components/ui/back-link";
import { NewProgrammeForm } from "@/components/setlists/new-programme-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("programmes");
  return { title: t("title") };
}

export default async function ProgrammesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login?redirect=/dashboard/programmes");
  const [t, format, setlists] = await Promise.all([getTranslations("programmes"), getFormatter(), listSetlists(user.id)]);

  return (
    <div className="max-w-3xl">
      <BackLink href="/dashboard" label={t("backToDashboard")} />
      <h1 className="text-[26px] sm:text-[28px] text-deep font-display mb-2">{t("title")}</h1>
      <p className="text-[14px] text-green-muted mb-6 max-w-xl">{t("intro")}</p>

      <NewProgrammeForm />

      {setlists.length === 0 ? (
        <div className="mt-8 bg-linen rounded-[var(--radius-md)] p-8 text-center">
          <ListMusic size={24} className="mx-auto mb-2 text-text-muted" />
          <p className="text-[13px] text-text-muted m-0">{t("empty")}</p>
        </div>
      ) : (
        <ul className="mt-8 list-none p-0 m-0 flex flex-col gap-2">
          {setlists.map((s) => (
            <li key={s.id}>
              <Link
                href={`/dashboard/programmes/${s.id}`}
                className="flex items-center gap-4 bg-parchment border-[0.5px] border-stone rounded-[var(--radius-lg)] px-4 py-3 no-underline hover:border-forest transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[17px] text-deep truncate">{s.title}</div>
                  <div className="text-[12px] text-green-muted">
                    {s.date ? format.dateTime(new Date(`${s.date}T12:00:00Z`), { dateStyle: "full" }) : t("noDate")} ·{" "}
                    {t("itemCount", { count: s.itemCount })}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
