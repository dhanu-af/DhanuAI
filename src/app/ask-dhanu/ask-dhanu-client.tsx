"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { askDhanu, deleteKbEntry, type KbMatch } from "@/lib/actions/kb-actions";
import { KB_CATEGORY_CLASS, KB_CATEGORY_LABEL } from "@/lib/ui";
import type { KbCategory } from "@/generated/prisma";
import KbEntryModal from "./kb-entry-modal";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { logout } from "@/lib/auth-actions";

export type KbEntry = {
  id: string;
  category: KbCategory;
  title: string;
  keywords: string;
  cause: string | null;
  answer: string;
  source: string | null;
};

export type IngredientEntry = {
  id: string;
  name: string;
  type: string;
  category: string | null;
  verified: boolean;
  keywords: string;
  summary: string;
  source: string | null;
};

type RecentQuestion = {
  id: string;
  question: string;
  matchTitle: string | null;
  matchScore: number | null;
  createdAt: string;
};

const CATEGORY_ORDER: KbCategory[] = [
  "BLENDING_SOP",
  "MACHINE_TROUBLESHOOTING",
  "MAINTENANCE_CLEANING",
  "SAFETY",
  "PARTS",
  "QUALITY_CONTROL",
  "QUALITY_ASSURANCE",
  "HACCP",
  "SQF",
  "GMP",
  "GDP",
  "FOOD_SAFETY",
  "MANUAL_HANDLING",
  "RAW_MATERIALS_INGREDIENTS",
  "FORMULATIONS",
  "PRODUCTION",
  "PACKAGING",
  "EQUIPMENT_MAINTENANCE",
  "CLEANING_SANITATION",
  "ENVIRONMENTAL_MONITORING",
  "WHS",
  "TEAMWORK_COMMUNICATION",
  "TRAINING_INDUCTION",
  "SOPS",
  "POLICIES_PROCEDURES",
];

function pillClass(active: boolean) {
  return `rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
    active
      ? "bg-zinc-100 text-zinc-900"
      : "bg-white/[0.04] text-zinc-400 ring-1 ring-inset ring-white/[0.06] hover:bg-white/[0.07] hover:text-zinc-200"
  }`;
}

function AnswerCard({
  match,
  highlight,
  t,
}: {
  match: KbMatch;
  highlight?: boolean;
  t: ReturnType<typeof useLanguage>["t"];
}) {
  const isKb = match.kind === "kb";
  const badgeClass = isKb ? KB_CATEGORY_CLASS[match.category as KbCategory] : "border-white/[0.12] bg-white/[0.05] text-zinc-400";
  const badgeLabel = isKb ? KB_CATEGORY_LABEL[match.category as KbCategory] : match.category;

  return (
    <div
      className={`rounded-xl border p-5 ${
        highlight ? "border-white/[0.16] bg-white/[0.06]" : "border-white/[0.08] bg-white/[0.04]"
      }`}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${badgeClass}`}>{badgeLabel}</span>
        {!isKb && (
          <span className="rounded-full border border-white/[0.12] bg-white/[0.05] px-2 py-0.5 text-[11px] font-medium text-zinc-400">
            {t("ingredientBadge")}
          </span>
        )}
        {highlight && (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-900">{t("bestMatch")}</span>
        )}
      </div>
      <h3 className="mb-1.5 text-sm font-semibold text-zinc-100">{match.title}</h3>
      {match.cause && (
        <p className="mb-1.5 text-sm text-zinc-400">
          <span className="font-medium text-zinc-200">{t("likelyCause")} </span>
          {match.cause}
        </p>
      )}
      <p className="whitespace-pre-line text-sm text-zinc-300">{match.answer}</p>
      {match.source && (
        <p className="mt-2 text-xs text-zinc-500">
          {t("source")} {match.source}
        </p>
      )}
    </div>
  );
}

export default function AskDhanuClient({
  entries,
  ingredients,
  recentQuestions,
}: {
  entries: KbEntry[];
  ingredients: IngredientEntry[];
  recentQuestions: RecentQuestion[];
}) {
  const router = useRouter();
  const { t } = useLanguage();
  const [question, setQuestion] = useState("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ matches: KbMatch[]; confident: boolean } | null>(null);

  const [manageTab, setManageTab] = useState<"entries" | "ingredients">("entries");
  const [browseFilter, setBrowseFilter] = useState("");
  const [activeCategory, setActiveCategory] = useState<KbCategory | "ALL">("ALL");
  const [ingredientFilter, setIngredientFilter] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editEntry, setEditEntry] = useState<KbEntry | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [showManage, setShowManage] = useState(false);

  const sampleQuestions = [t("sampleQuestion1"), t("sampleQuestion2"), t("sampleQuestion3"), t("sampleQuestion4")];

  function ask(q: string) {
    if (!q.trim()) return;
    startTransition(async () => {
      const res = await askDhanu(q);
      setResult(res);
    });
  }

  function remove(id: string) {
    if (!confirm(t("confirmDeleteEntry"))) return;
    startTransition(async () => {
      await deleteKbEntry(id);
      router.refresh();
    });
  }

  const filteredEntries = useMemo(() => {
    const q = browseFilter.trim().toLowerCase();
    return entries.filter((e) => {
      if (activeCategory !== "ALL" && e.category !== activeCategory) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.keywords.toLowerCase().includes(q) ||
        e.answer.toLowerCase().includes(q)
      );
    });
  }, [entries, browseFilter, activeCategory]);

  const grouped = useMemo(() => {
    const map = new Map<KbCategory, KbEntry[]>();
    for (const e of filteredEntries) {
      if (!map.has(e.category)) map.set(e.category, []);
      map.get(e.category)!.push(e);
    }
    return map;
  }, [filteredEntries]);

  const filteredIngredients = useMemo(() => {
    const q = ingredientFilter.trim().toLowerCase();
    if (!q) return ingredients;
    return ingredients.filter((i) => {
      return (
        i.name.toLowerCase().includes(q) ||
        i.type.toLowerCase().includes(q) ||
        (i.category ?? "").toLowerCase().includes(q) ||
        i.keywords.toLowerCase().includes(q)
      );
    });
  }, [ingredients, ingredientFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("appTitle")}
        subtitle={t("appSubtitle")}
        actions={
          <>
            <LanguageToggle />
            <Link
              href="/graph"
              className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-zinc-300 ring-1 ring-inset ring-white/[0.08] transition-colors hover:bg-white/[0.08]"
            >
              {t("graphBeta")}
            </Link>
            <button
              onClick={() => startTransition(() => logout())}
              className="text-xs font-medium text-zinc-500 transition-colors duration-150 ease-out hover:text-zinc-200"
            >
              {t("signOut")}
            </button>
          </>
        }
      />

      <div className="rounded-xl border border-white/[0.1] bg-white/[0.06] p-5 backdrop-blur-2xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(question);
          }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t("askPlaceholder")}
            className="input flex-1"
          />
          <Button type="submit" disabled={pending || !question.trim()}>
            {pending ? t("searching") : t("ask")}
          </Button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {sampleQuestions.map((s) => (
            <button
              key={s}
              onClick={() => {
                setQuestion(s);
                ask(s);
              }}
              className="rounded-full border border-white/[0.06] bg-white/[0.04] px-3 py-1 text-xs text-zinc-400 transition-colors duration-150 ease-out hover:text-zinc-200"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {result && (
        <div className="space-y-3">
          {result.matches.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/[0.1] bg-white/[0.02]">
              <EmptyState title={t("noMatchTitle")} description={t("noMatchDescription")} />
            </div>
          )}
          {result.matches.length > 0 && !result.confident && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-2.5 text-sm text-amber-300">
              {t("notConfidentWarning")}
            </div>
          )}
          {result.matches.map((m, i) => (
            <AnswerCard key={m.id} match={m} highlight={result.confident && i === 0} t={t} />
          ))}
        </div>
      )}

      <div className="space-y-3">
        <Button variant="secondary" onClick={() => setShowManage((v) => !v)}>
          {showManage ? t("manageHide") : t("manageShow")}
        </Button>

        {showManage && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-1.5">
                {(["entries", "ingredients"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setManageTab(tab)}
                    className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
                      manageTab === tab
                        ? "bg-zinc-100 text-zinc-900"
                        : "bg-white/[0.04] text-zinc-400 ring-1 ring-inset ring-white/[0.06] hover:bg-white/[0.07]"
                    }`}
                  >
                    {tab === "entries" ? `${t("tabEntries")} (${entries.length})` : `${t("tabIngredients")} (${ingredients.length})`}
                  </button>
                ))}
              </div>
              {manageTab === "entries" && (
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="secondary" onClick={() => setShowLog((v) => !v)}>
                    {showLog ? t("hideLog") : t("viewLog")}
                  </Button>
                  <Button onClick={() => setShowAdd(true)}>{t("addEntry")}</Button>
                </div>
              )}
            </div>

            {manageTab === "entries" && showLog && (
              <Card padding="sm">
                <h3 className="mb-2 text-sm font-semibold text-zinc-100">{t("recentQuestionsTitle")}</h3>
                {recentQuestions.length === 0 ? (
                  <p className="text-sm text-zinc-500">{t("noQuestionsYet")}</p>
                ) : (
                  <div className="space-y-2">
                    {recentQuestions.map((q) => (
                      <div key={q.id} className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm">
                        <p className="text-zinc-200">&ldquo;{q.question}&rdquo;</p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {new Date(q.createdAt).toLocaleString("en-AU")} ·{" "}
                          {q.matchTitle ? `${t("matched")}: ${q.matchTitle} (${q.matchScore})` : t("noMatchFound")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {manageTab === "entries" && (
              <>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setActiveCategory("ALL")} className={pillClass(activeCategory === "ALL")}>
                    {t("all")}
                  </button>
                  {CATEGORY_ORDER.map((c) => (
                    <button key={c} onClick={() => setActiveCategory(c)} className={pillClass(activeCategory === c)}>
                      {KB_CATEGORY_LABEL[c]}
                    </button>
                  ))}
                </div>

                <input
                  value={browseFilter}
                  onChange={(e) => setBrowseFilter(e.target.value)}
                  placeholder={t("filterEntriesPlaceholder")}
                  className="input sm:max-w-xs"
                />

                {CATEGORY_ORDER.filter((c) => grouped.has(c)).map((c) => (
                  <div key={c} className="space-y-2">
                    <h3 className="text-sm font-semibold text-zinc-500">{KB_CATEGORY_LABEL[c]}</h3>
                    <div className="space-y-2">
                      {grouped.get(c)!.map((e) => (
                        <details key={e.id} className="group rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                            <span className="text-sm font-medium text-zinc-100">{e.title}</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(ev) => {
                                  ev.preventDefault();
                                  setEditEntry(e);
                                }}
                                className="text-xs font-medium text-zinc-500 transition-colors duration-150 ease-out hover:text-zinc-200"
                              >
                                {t("edit")}
                              </button>
                              <button
                                onClick={(ev) => {
                                  ev.preventDefault();
                                  remove(e.id);
                                }}
                                className="text-xs font-medium text-red-400 transition-colors duration-150 ease-out hover:opacity-80"
                              >
                                {t("delete")}
                              </button>
                              <span className="text-zinc-500 transition-transform duration-200 group-open:rotate-180">▾</span>
                            </div>
                          </summary>
                          <div className="mt-3 space-y-1.5 border-t border-white/[0.06] pt-3">
                            {e.cause && (
                              <p className="text-sm text-zinc-400">
                                <span className="font-medium text-zinc-200">{t("likelyCause")} </span>
                                {e.cause}
                              </p>
                            )}
                            <p className="whitespace-pre-line text-sm text-zinc-300">{e.answer}</p>
                            {e.source && (
                              <p className="text-xs text-zinc-500">
                                {t("source")} {e.source}
                              </p>
                            )}
                          </div>
                        </details>
                      ))}
                    </div>
                  </div>
                ))}
                {filteredEntries.length === 0 && <p className="text-sm text-zinc-500">{t("noEntriesMatch")}</p>}
              </>
            )}

            {manageTab === "ingredients" && (
              <>
                <input
                  value={ingredientFilter}
                  onChange={(e) => setIngredientFilter(e.target.value)}
                  placeholder={t("filterIngredientsPlaceholder")}
                  className="input sm:max-w-xs"
                />
                <div className="space-y-2">
                  {filteredIngredients.map((i) => (
                    <details key={i.id} className="group rounded-xl border border-white/[0.08] bg-white/[0.04] p-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm font-medium text-zinc-100">{i.name}</span>
                          <span className="shrink-0 rounded-full border border-white/[0.12] bg-white/[0.05] px-2 py-0.5 text-[11px] font-medium text-zinc-400">
                            {i.type}
                          </span>
                          {i.verified && (
                            <span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                              {t("verified")}
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 text-zinc-500 transition-transform duration-200 group-open:rotate-180">▾</span>
                      </summary>
                      <div className="mt-3 space-y-1.5 border-t border-white/[0.06] pt-3">
                        <p className="whitespace-pre-line text-sm text-zinc-300">{i.summary}</p>
                        {i.source && (
                          <p className="text-xs text-zinc-500">
                            {t("source")} {i.source}
                          </p>
                        )}
                      </div>
                    </details>
                  ))}
                  {filteredIngredients.length === 0 && (
                    <p className="text-sm text-zinc-500">{t("noIngredientsMatch")}</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {(showAdd || editEntry) && (
        <KbEntryModal
          entry={editEntry}
          onClose={() => {
            setShowAdd(false);
            setEditEntry(null);
          }}
        />
      )}
    </div>
  );
}
