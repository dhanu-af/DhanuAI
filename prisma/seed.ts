/**
 * Loads scripts/exported-data.json (produced by `npm run export:blendcaps`)
 * into this project's own database. Safe to re-run — upserts by id, so it
 * won't duplicate rows.
 */
import "dotenv/config";
import { existsSync, readFileSync } from "fs";
import path from "path";
import { prisma } from "../src/lib/prisma";
import type { KbCategory } from "../src/generated/prisma";

type ExportedEntry = {
  id: string;
  category: KbCategory;
  title: string;
  keywords: string;
  cause: string | null;
  answer: string;
  source: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
};

type ExportedIngredient = {
  id: string;
  name: string;
  alternateName: string | null;
  type: string;
  category: string | null;
  aanValue: string | null;
  notes: string | null;
  verified: boolean;
  verificationSource: string | null;
  classification: string | null;
  mainBenefit: string | null;
  usedFor: string | null;
  synonyms: string | null;
  chemicalName: string | null;
  casNumber: string | null;
  typicalDosage: string | null;
  storageConditions: string | null;
  safetyNotes: string | null;
  regulatoryStatus: string | null;
  tgaStatus: string | null;
  apvmaStatus: string | null;
  fdaStatus: string | null;
  emaStatus: string | null;
  aicisStatus: string | null;
  source: string | null;
  createdAt: string;
  updatedAt: string;
};

async function main() {
  const dataPath = path.join(__dirname, "..", "scripts", "exported-data.json");
  if (!existsSync(dataPath)) {
    console.log(
      `No ${dataPath} found — run "npm run export:blendcaps" first (with BLENDCAPS_DATABASE_URL set) to produce it.`
    );
    return;
  }

  const { entries, ingredients } = JSON.parse(readFileSync(dataPath, "utf-8")) as {
    entries: ExportedEntry[];
    ingredients: ExportedIngredient[];
  };

  for (const e of entries) {
    await prisma.knowledgeEntry.upsert({
      where: { id: e.id },
      create: {
        id: e.id,
        category: e.category,
        title: e.title,
        keywords: e.keywords,
        cause: e.cause,
        answer: e.answer,
        source: e.source,
        order: e.order,
        createdAt: new Date(e.createdAt),
        updatedAt: new Date(e.updatedAt),
      },
      update: {
        category: e.category,
        title: e.title,
        keywords: e.keywords,
        cause: e.cause,
        answer: e.answer,
        source: e.source,
        order: e.order,
      },
    });
  }

  for (const i of ingredients) {
    await prisma.ingredient.upsert({
      where: { id: i.id },
      create: { ...i, createdAt: new Date(i.createdAt), updatedAt: new Date(i.updatedAt) },
      update: { ...i, createdAt: undefined, updatedAt: undefined },
    });
  }

  console.log(`Seeded ${entries.length} knowledge entries and ${ingredients.length} ingredients.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
