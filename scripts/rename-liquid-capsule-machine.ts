/**
 * One-off rename pass: "Liquid Capsule Filling Machine" -> "Liquid Capsule Machine"
 * across the 138 EQ-LC-001 entries imported by import-liquid-capsule.ts
 * (title, keywords, cause, answer, source).
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

const FROM = "Liquid Capsule Filling Machine";
const TO = "Liquid Capsule Machine";
const FROM_LOWER = FROM.toLowerCase();
const TO_LOWER = TO.toLowerCase();

function replaceAll(text: string | null, from: string, to: string): string | null {
  if (!text) return text;
  return text.split(from).join(to);
}

async function main() {
  const entries = await prisma.knowledgeEntry.findMany({
    where: {
      OR: [
        { title: { contains: FROM } },
        { keywords: { contains: FROM_LOWER } },
        { source: { contains: FROM } },
        { cause: { contains: FROM } },
        { answer: { contains: FROM } },
      ],
    },
  });

  console.log(`Found ${entries.length} entries to rename.`);

  let updated = 0;
  for (const e of entries) {
    await prisma.knowledgeEntry.update({
      where: { id: e.id },
      data: {
        title: replaceAll(e.title, FROM, TO)!,
        keywords: replaceAll(e.keywords, FROM_LOWER, TO_LOWER)!,
        source: replaceAll(e.source, FROM, TO),
        cause: replaceAll(e.cause, FROM, TO),
        answer: replaceAll(e.answer, FROM, TO)!,
      },
    });
    updated++;
  }

  console.log(`Renamed ${updated} entries.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
