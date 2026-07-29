/**
 * One-off, READ-ONLY export of the real Dhanu AI knowledge base + ingredient
 * data out of the live BlendCaps (eagle-labs-schedule) Neon database, so it
 * can be seeded into this project's own separate database.
 *
 * Never writes to BLENDCAPS_DATABASE_URL — only SELECTs.
 *
 * Usage:
 *   BLENDCAPS_DATABASE_URL="<the eagle-labs-schedule DATABASE_URL>" npm run export:blendcaps
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { writeFileSync } from "fs";
import path from "path";

async function main() {
  const url = process.env.BLENDCAPS_DATABASE_URL;
  if (!url) {
    throw new Error(
      "Set BLENDCAPS_DATABASE_URL to the eagle-labs-schedule DATABASE_URL (from its .env) before running this script."
    );
  }

  // Separate client pointed at the source DB — deliberately not the `prisma`
  // singleton in src/lib/prisma.ts, which is wired to *this* project's own DB.
  const source = new PrismaClient({ datasources: { db: { url } } });

  const [entries, ingredients] = (await Promise.all([
    source.$queryRawUnsafe(
      `SELECT id, category, title, keywords, cause, answer, source, "order", "createdAt", "updatedAt" FROM "KnowledgeEntry"`
    ),
    source.$queryRawUnsafe(
      `SELECT id, name, "alternateName", type, category, "aanValue", notes, verified, "verificationSource",
              classification, "mainBenefit", "usedFor", synonyms, "chemicalName", "casNumber", "typicalDosage",
              "storageConditions", "safetyNotes", "regulatoryStatus", "tgaStatus", "apvmaStatus", "fdaStatus",
              "emaStatus", "aicisStatus", source, "createdAt", "updatedAt"
       FROM "Ingredient"`
    ),
  ])) as [Record<string, unknown>[], Record<string, unknown>[]];

  await source.$disconnect();

  const outPath = path.join(__dirname, "exported-data.json");
  writeFileSync(outPath, JSON.stringify({ entries, ingredients }, null, 2));

  console.log(`Exported ${entries.length} knowledge entries and ${ingredients.length} ingredients.`);
  console.log(`Written to ${outPath} — run "npm run seed" next to load them into this project's own database.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
