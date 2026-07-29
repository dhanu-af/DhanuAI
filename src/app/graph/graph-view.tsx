"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { KbGraphEntry } from "@/lib/graph/types";
import EntryModal from "@/components/graph/EntryModal";

const Scene = dynamic(() => import("@/components/graph/Scene"), { ssr: false });

export default function GraphView({ entries, total }: { entries: KbGraphEntry[]; total: number }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState<KbGraphEntry | null>(null);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#09090b]">
      <Scene entries={entries} searchQuery={searchQuery} onSelectEntry={setSelected} />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-4">
        <div className="pointer-events-auto flex flex-col gap-2 rounded-xl border border-white/[0.1] bg-[#09090b]/70 p-3 backdrop-blur-2xl">
          <div className="flex items-center gap-2">
            <h1 className="text-[13px] font-semibold tracking-wide text-zinc-100">Dhanu AI — Graph</h1>
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-zinc-400 ring-1 ring-inset ring-white/[0.08]">
              Beta · first {entries.length} of {total}
            </span>
          </div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Highlight entries..."
            className="w-64 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[13px] text-zinc-100 placeholder:text-zinc-500 outline-none transition-colors focus:border-white/[0.16]"
          />
        </div>
        <Link
          href="/"
          className="pointer-events-auto rounded-full bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-zinc-300 ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.08]"
        >
          ← List view
        </Link>
      </div>

      <EntryModal entry={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
