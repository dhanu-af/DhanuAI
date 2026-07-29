/**
 * Applies a batch of Sinhala translations produced from
 * scripts/translation-queue.json. Reads scripts/translation-batch.json:
 *   { "entries": [{ "id", "titleSi", "causeSi"?, "answerSi" }],
 *     "ingredients": [{ "id", "nameSi", "summarySi" }] }
 * Safe to run repeatedly with different batches.
 */
import "dotenv/config";
import { readFileSync } from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";

async function main() {
  const batchPath = path.join(__dirname, "translation-batch.json");
  const { entries = [], ingredients = [] } = JSON.parse(readFileSync(batchPath, "utf-8")) as {
    entries?: { id: string; titleSi: string; causeSi?: string; answerSi: string }[];
    ingredients?: { id: string; nameSi: string; summarySi: string }[];
  };

  for (const e of entries) {
    await prisma.knowledgeEntry.update({
      where: { id: e.id },
      data: { titleSi: e.titleSi, causeSi: e.causeSi ?? null, answerSi: e.answerSi },
    });
  }

  for (const i of ingredients) {
    await prisma.ingredient.update({
      where: { id: i.id },
      data: { nameSi: i.nameSi, summarySi: i.summarySi },
    });
  }

  console.log(`Applied translations for ${entries.length} KB entries and ${ingredients.length} ingredients.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
