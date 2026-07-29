import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ingredientAnswer, ingredientKeywords } from "@/lib/ingredient-format";
import AskDhanuClient from "./ask-dhanu/ask-dhanu-client";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [entries, ingredients, recentQuestions] = await Promise.all([
    prisma.knowledgeEntry.findMany({
      orderBy: [{ category: "asc" }, { order: "asc" }],
    }),
    prisma.ingredient.findMany({ orderBy: { name: "asc" } }),
    prisma.kbQuestionLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
      <AskDhanuClient
        entries={entries.map((e) => ({
          id: e.id,
          category: e.category,
          title: e.title,
          titleSi: e.titleSi,
          keywords: e.keywords,
          cause: e.cause,
          causeSi: e.causeSi,
          answer: e.answer,
          answerSi: e.answerSi,
          source: e.source,
        }))}
        ingredients={ingredients.map((i) => ({
          id: i.id,
          name: i.name,
          nameSi: i.nameSi,
          type: i.type,
          category: i.category,
          verified: i.verified,
          keywords: ingredientKeywords(i),
          summary: ingredientAnswer(i),
          summarySi: i.summarySi,
          source: i.source,
        }))}
        recentQuestions={recentQuestions.map((q) => ({
          id: q.id,
          question: q.question,
          matchTitle: q.matchTitle,
          matchScore: q.matchScore,
          createdAt: q.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
