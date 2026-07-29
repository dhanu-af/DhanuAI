"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { KbGraphEntry } from "@/lib/graph/types";
import { KB_CATEGORY_COLOR } from "@/lib/graph/types";
import { getCategoryLabel } from "@/lib/ui";
import { useLanguage } from "@/lib/i18n/LanguageContext";

function pick(en: string, si: string | null, lang: "en" | "si"): string {
  return lang === "si" && si ? si : en;
}

export default function EntryModal({ entry, onClose }: { entry: KbGraphEntry | null; onClose: () => void }) {
  const { t, lang } = useLanguage();
  return (
    <AnimatePresence>
      {entry && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-6 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          <motion.div
            key="modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.92, rotateX: -8, y: 16 }}
            animate={{ opacity: 1, scale: 1, rotateX: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, rotateX: 6, y: 10 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            style={{ perspective: 1200, transformStyle: "preserve-3d" }}
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/[0.1] bg-white/[0.06] p-6 shadow-2xl backdrop-blur-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: KB_CATEGORY_COLOR[entry.category] }}
                />
                <div>
                  <h2 className="text-lg font-semibold text-zinc-100">{pick(entry.title, entry.titleSi, lang)}</h2>
                  <p className="mt-1 text-xs text-zinc-400">{getCategoryLabel(entry.category, lang)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.06]"
              >
                ×
              </button>
            </div>

            {entry.cause && (
              <div className="mt-4">
                <span className="text-[11px] uppercase tracking-wider text-zinc-500">{t("likelyCause")}</span>
                <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-300">{pick(entry.cause, entry.causeSi, lang)}</p>
              </div>
            )}

            <div className="mt-4">
              <span className="text-[11px] uppercase tracking-wider text-zinc-500">{t("answerSolution")}</span>
              <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-zinc-300">{pick(entry.answer, entry.answerSi, lang)}</p>
            </div>

            {entry.source && (
              <div className="mt-4">
                <span className="text-[11px] uppercase tracking-wider text-zinc-500">{t("source")}</span>
                <p className="mt-1.5 text-[13px] text-zinc-400">{entry.source}</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
