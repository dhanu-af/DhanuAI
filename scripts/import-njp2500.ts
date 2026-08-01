/**
 * One-off import of the "brain_cards_njp2500.json" knowledge-card export
 * (NJP 2500 / LFA Fully Automatic Capsule Filler manual — safety,
 * installation, components, settings/adjustment, maintenance, cleaning,
 * troubleshooting, technical specs, glossary) into KnowledgeEntry rows.
 *
 * Kept as its own script/source-document set (distinct from
 * import-liquid-capsule.ts's EQ-LC-001 cards) so this machine's entries
 * are clearly identifiable via title prefix, keywords, and source.
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { prisma } from "../src/lib/prisma";
import type { KbCategory } from "../src/generated/prisma";

const SOURCE_PATH = "C:/Users/dnand/Downloads/brain_cards_njp2500.json";

interface Card {
  source_document: string;
  domain: string;
  kind: string;
  category: string;
  format: string;
  machine: string;
  ingredient: string;
  claim: string;
  structured_json:
    | { problem?: string; cause?: string; action?: string; symptom?: string; causes?: string[]; solutions?: string[] }
    | string;
  status: string;
}

const QUALITY_CONTROL_KINDS = /^(cqa|cpp|qc_tests|ipqc|microbiology|heavy_metal|in_process)/;

function mapCategory(card: Card): KbCategory {
  switch (card.domain) {
    case "Equipment":
      return "EQUIPMENT_MAINTENANCE";
    case "Troubleshooting":
      return "MACHINE_TROUBLESHOOTING";
    case "Formulation":
      return card.ingredient.trim() ? "RAW_MATERIALS_INGREDIENTS" : "FORMULATIONS";
    case "Quality":
      return QUALITY_CONTROL_KINDS.test(card.kind) ? "QUALITY_CONTROL" : "QUALITY_ASSURANCE";
    case "Cleaning":
      return "CLEANING_SANITATION";
    case "Maintenance":
      return "EQUIPMENT_MAINTENANCE";
    case "Calibration":
      return "EQUIPMENT_MAINTENANCE";
    case "Validation":
      return "QUALITY_ASSURANCE";
    case "Documentation":
      return "POLICIES_PROCEDURES";
    case "Process":
      return "PRODUCTION";
    case "Training":
      return "TRAINING_INDUCTION";
    default:
      return "SOPS";
  }
}

const ACRONYMS = new Set([
  "pq", "oq", "iq", "cqa", "cpp", "qc", "qa", "oos", "oot", "bmr", "ppe", "gmp", "gdp",
  "haccp", "sqf", "capa", "ipqc", "apqr", "pqr", "coa", "kpi", "kpis", "plc", "hmi",
  "loto", "sop", "sops", "whs", "fmea", "mtbf", "mttr", "njp",
]);

function titleCase(kind: string): string {
  return kind
    .split("_")
    .map((w) => (ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/** Model identifier before the parenthetical, e.g. "NJP 2500" from "NJP 2500 (LFA Machines...)". */
function modelName(machine: string): string {
  return machine.split("(")[0].trim();
}

function buildEntry(card: Card) {
  const model = modelName(card.machine);
  const structured = typeof card.structured_json === "object" ? card.structured_json : null;

  let title: string;
  let cause: string | null = null;
  let answer: string;

  if (structured?.problem) {
    title = structured.problem;
    cause = structured.cause ?? null;
    answer = structured.action ?? card.claim;
  } else if (structured?.symptom) {
    title = structured.symptom;
    cause = structured.causes && structured.causes.length > 0 ? structured.causes.join("; ") : null;
    answer = card.claim;
  } else {
    title = card.ingredient.trim() ? `${card.ingredient} — ${titleCase(card.kind)}` : `${model} — ${titleCase(card.kind)}`;
    answer = card.claim;
  }

  const keywordParts = [card.domain, card.kind.replace(/_/g, " "), model, card.ingredient.trim()].filter(Boolean);

  return {
    category: mapCategory(card),
    title,
    keywords: keywordParts.join(", ").toLowerCase(),
    cause,
    answer,
    source: card.source_document,
  };
}

async function main() {
  const cards: Card[] = JSON.parse(readFileSync(SOURCE_PATH, "utf-8"));
  console.log(`Importing ${cards.length} cards...`);

  let created = 0;
  for (const card of cards) {
    const entry = buildEntry(card);
    await prisma.knowledgeEntry.create({ data: entry });
    created++;
  }

  console.log(`Created ${created} knowledge entries.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
