"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { KbCategory } from "@/generated/prisma";
import { extractText, getDocumentProxy } from "unpdf";
import { ingredientAnswer, ingredientKeywords } from "@/lib/ingredient-format";

const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "to", "of", "in", "on",
  "for", "and", "or", "how", "what", "why", "when", "do", "does", "did", "it", "its",
  "not", "with", "at", "my", "i", "we", "our", "please", "help", "can", "should", "will",
  // ubiquitous across nearly every entry's title — low signal, would dilute matches
  "machine",
]);

/** Light stemming so "caps"/"cap" and "bodies"/"body" etc. still match. */
function stem(word: string): string {
  if (word.length > 4 && word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.length > 4 && /(s|x|ch|sh)es$/.test(word)) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
    .map(stem);
}

/**
 * Rule-based (not LLM-powered) keyword/token-overlap matcher. Weighs the
 * title and keywords fields higher than the free-text answer so an entry
 * whose keywords match the question ranks above one that merely mentions
 * the same word once in a long answer.
 */
function scoreEntry(questionTokens: string[], entry: { title: string; keywords: string; answer: string; cause: string | null }) {
  const titleTokens = new Set(tokenize(entry.title));
  const keywordTokens = new Set(
    entry.keywords
      .split(",")
      .flatMap((k) => tokenize(k))
  );
  const bodyTokens = new Set(tokenize(`${entry.cause ?? ""} ${entry.answer}`));

  let score = 0;
  for (const t of questionTokens) {
    if (titleTokens.has(t)) score += 3;
    if (keywordTokens.has(t)) score += 3;
    if (bodyTokens.has(t)) score += 1;
  }
  return score;
}

export type KbMatch = {
  id: string;
  kind: "kb" | "ingredient";
  category: string;
  title: string;
  titleSi: string | null;
  cause: string | null;
  causeSi: string | null;
  answer: string;
  answerSi: string | null;
  source: string | null;
  score: number;
};

export async function askDhanu(question: string): Promise<{
  matches: KbMatch[];
  confident: boolean;
}> {
  const session = await getSession();
  if (!session) throw new Error("Not authorized");

  const questionTokens = tokenize(question);
  const [entries, ingredients] = await Promise.all([
    prisma.knowledgeEntry.findMany(),
    prisma.ingredient.findMany(),
  ]);

  const scoredKb = entries.map((e) => ({
    id: e.id,
    kind: "kb" as const,
    category: e.category as string,
    title: e.title,
    titleSi: e.titleSi,
    cause: e.cause,
    causeSi: e.causeSi,
    answer: e.answer,
    answerSi: e.answerSi,
    source: e.source,
    score: scoreEntry(questionTokens, e),
  }));

  const scoredIngredients = ingredients.map((i) => ({
    id: i.id,
    kind: "ingredient" as const,
    category: i.type,
    title: i.name,
    titleSi: i.nameSi,
    cause: null as string | null,
    causeSi: null as string | null,
    answer: ingredientAnswer(i),
    answerSi: i.summarySi,
    source: i.source,
    score: scoreEntry(questionTokens, {
      title: i.name,
      keywords: ingredientKeywords(i),
      answer: i.notes ?? "",
      cause: null,
    }),
  }));

  const scored = [...scoredKb, ...scoredIngredients]
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const best = scored[0];
  const confident = questionTokens.length > 0 && !!best && best.score >= 5;

  await prisma.kbQuestionLog.create({
    data: {
      question,
      matchedId: best?.id,
      matchTitle: best?.title,
      matchScore: best?.score ?? 0,
    },
  });

  return { matches: scored, confident };
}

/** Extract the text of an uploaded PDF so it can be reviewed and saved as a knowledge entry. */
export async function extractPdfText(formData: FormData): Promise<string> {
  const session = await getSession();
  if (!session) throw new Error("Not authorized");

  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file uploaded");
  if (file.type !== "application/pdf") throw new Error("Only PDF files are supported");

  const buffer = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocumentProxy(buffer);
  const { text } = await extractText(pdf, { mergePages: true });
  return text.trim();
}

export async function createKbEntry(data: {
  category: KbCategory;
  title: string;
  keywords: string;
  cause?: string;
  answer: string;
  source?: string;
  titleSi?: string;
  causeSi?: string;
  answerSi?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Not authorized");

  const entry = await prisma.knowledgeEntry.create({ data });
  revalidatePath("/");
  return entry;
}

export async function updateKbEntry(
  id: string,
  data: {
    category: KbCategory;
    title: string;
    keywords: string;
    cause?: string;
    answer: string;
    source?: string;
    titleSi?: string;
    causeSi?: string;
    answerSi?: string;
  }
) {
  const session = await getSession();
  if (!session) throw new Error("Not authorized");

  await prisma.knowledgeEntry.update({ where: { id }, data });
  revalidatePath("/");
}

export async function deleteKbEntry(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Not authorized");

  await prisma.knowledgeEntry.delete({ where: { id } });
  revalidatePath("/");
}
