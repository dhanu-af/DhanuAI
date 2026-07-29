import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import AskDhanuClient from "./ask-dhanu/ask-dhanu-client";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const entries = await prisma.knowledgeEntry.findMany({
    orderBy: [{ category: "asc" }, { order: "asc" }],
  });

  const recentQuestions = await prisma.kbQuestionLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <AskDhanuClient
        entries={entries.map((e) => ({
          id: e.id,
          category: e.category,
          title: e.title,
          keywords: e.keywords,
          cause: e.cause,
          answer: e.answer,
          source: e.source,
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
