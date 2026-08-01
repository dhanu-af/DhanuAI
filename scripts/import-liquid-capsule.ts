/**
 * One-off import of the "brain_cards_liquid_capsule.json" knowledge-card
 * export (Liquid Capsule Filling Machine EQ-LC-001 + Fish Oil 18/12 TG,
 * covering equipment/process/quality/validation/troubleshooting/maintenance
 * lifecycle docs 001-026) into KnowledgeEntry rows.
 */
import "dotenv/config";
import { readFileSync } from "fs";
import { prisma } from "../src/lib/prisma";
import type { KbCategory } from "../src/generated/prisma";

const SOURCE_PATH = "C:/Users/dnand/Downloads/brain_cards_liquid_capsule.json";

interface Card {
  source_document: string;
  domain: string;
  kind: string;
  category: string;
  format: string;
  machine: string;
  ingredient: string;
  claim: string;
  structured_json: { problem?: string; cause?: string; action?: string } | string;
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
  "loto", "sop", "sops", "whs", "fmea", "mtbf", "mttr",
]);

function titleCase(kind: string): string {
  return kind
    .split("_")
    .map((w) => (ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function machineBaseName(machine: string): string {
  const match = machine.match(/\(([^)]+)\)/);
  return match ? match[1] : machine;
}

function buildEntry(card: Card) {
  const base = machineBaseName(card.machine);
  const structured = typeof card.structured_json === "object" ? card.structured_json : null;

  let title: string;
  let cause: string | null = null;
  let answer: string;

  if (structured?.problem) {
    title = structured.problem;
    cause = structured.cause ?? null;
    answer = structured.action ?? card.claim;
  } else {
    title = card.ingredient.trim() ? `${card.ingredient} — ${titleCase(card.kind)}` : `${base} — ${titleCase(card.kind)}`;
    answer = card.claim;
  }

  const keywordParts = [card.domain, card.kind.replace(/_/g, " "), base, card.ingredient.trim()].filter(Boolean);

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
