"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { LANGUAGES, TRANSLATIONS, type Lang } from "./translations";

const STORAGE_KEY = "dhanu-ai-lang";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: keyof (typeof TRANSLATIONS)["en"]) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "si") setLangState(stored);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }, []);

  const t = useCallback((key: keyof (typeof TRANSLATIONS)["en"]) => TRANSLATIONS[lang][key] ?? TRANSLATIONS.en[key], [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

export { LANGUAGES };
