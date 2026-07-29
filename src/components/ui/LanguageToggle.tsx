"use client";

import { LANGUAGES, useLanguage } from "@/lib/i18n/LanguageContext";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex gap-1 rounded-full bg-white/[0.04] p-0.5 ring-1 ring-inset ring-white/[0.08]">
      {LANGUAGES.map((l) => (
        <button
          key={l.code}
          type="button"
          onClick={() => setLang(l.code)}
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition-colors ${
            lang === l.code ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
