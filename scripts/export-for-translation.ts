/**
 * Dumps KB entries + ingredients that don't have Sinhala translations yet,
 * so they can be translated in batches and re-applied via
 * scripts/apply-translations.ts.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { ingredientAnswer } from "../src/lib/ingredient-format";
import { writeFileSync } from "fs";
import path from "path";

async function main() {
  const entries = await prisma.knowledgeEntry.findMany({
    where: { titleSi: null },
    orderBy: [{ category: "asc" }, { order: "asc" }],
    select: { id: true, title: true, cause: true, answer: true },
  });

  const ingredients = await prisma.ingredient.findMany({
    where: { nameSi: null },
    orderBy: { name: "asc" },
  });

  const ingredientRows = ingredients.map((i) => ({
    id: i.id,
    name: i.name,
    summary: ingredientAnswer(i),
  }));

  writeFileSync(
    path.join(__dirname, "translation-queue.json"),
    JSON.stringify({ entries, ingredients: ingredientRows }, null, 2)
  );

  console.log(`${entries.length} KB entries and ${ingredientRows.length} ingredients need translation.`);
  console.log(`Written to scripts/translation-queue.json`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
