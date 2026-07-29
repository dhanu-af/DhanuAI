import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import GraphView from "./graph-view";

const GRAPH_PREVIEW_LIMIT = 100;

export default async function GraphPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [entries, total] = await Promise.all([
    prisma.knowledgeEntry.findMany({
      orderBy: [{ category: "asc" }, { order: "asc" }],
      take: GRAPH_PREVIEW_LIMIT,
    }),
    prisma.knowledgeEntry.count(),
  ]);

  return (
    <GraphView
      entries={entries.map((e) => ({
        id: e.id,
        title: e.title,
        category: e.category,
        cause: e.cause,
        answer: e.answer,
        source: e.source,
      }))}
      total={total}
    />
  );
}
