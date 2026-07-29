"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { KbGraphEntry } from "@/lib/graph/types";
import EntryModal from "@/components/graph/EntryModal";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const Scene = dynamic(() => import("@/components/graph/Scene"), { ssr: false });

export default function GraphView({ entries, total }: { entries: KbGraphEntry[]; total: number }) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<KbGraphEntry | null>(null);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#09090b]">
      <Scene entries={entries} searchQuery={searchQuery} onSelectEntry={setSelected} />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-start justify-between gap-2 p-3 sm:p-4">
        <div className="pointer-events-auto flex max-w-[calc(100vw-5.5rem)] flex-col gap-2 rounded-xl border border-white/[0.1] bg-[#09090b]/70 p-3 backdrop-blur-2xl sm:max-w-none">
          <div className="flex flex-wrap items-center gap-1.5">
            <h1 className="text-[13px] font-semibold tracking-wide text-zinc-100">{t("graphTitle")}</h1>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-zinc-400 ring-1 ring-inset ring-white/[0.08]">
              Beta · {entries.length}/{total}
            </span>
          </div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("graphSearchPlaceholder")}
            className="w-full min-w-0 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[13px] text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-white/[0.16] sm:w-64"
          />
        </div>
        <div className="pointer-events-auto flex shrink-0 items-center gap-2">
          <LanguageToggle />
          <Link
            href="/"
            className="rounded-full bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-zinc-300 ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.08]"
          >
            {t("listView")}
          </Link>
        </div>
      </div>

      <EntryModal entry={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
