import type { KbCategory } from "@/generated/prisma";

export interface KbGraphEntry {
  id: string;
  title: string;
  titleSi: string | null;
  category: KbCategory;
  cause: string | null;
  causeSi: string | null;
  answer: string;
  answerSi: string | null;
  source: string | null;
}

/** Hex equivalents of the tinted category badges used in the list view (src/lib/ui.ts). */
export const KB_CATEGORY_COLOR: Record<KbCategory, string> = {
  BLENDING_SOP: "#60a5fa",
  MACHINE_TROUBLESHOOTING: "#fbbf24",
  MAINTENANCE_CLEANING: "#34d399",
  SAFETY: "#f87171",
  PARTS: "#a1a1aa",
  QUALITY_CONTROL: "#60a5fa",
  QUALITY_ASSURANCE: "#a78bfa",
  HACCP: "#fbbf24",
  SQF: "#34d399",
  GMP: "#f87171",
  GDP: "#a1a1aa",
  FOOD_SAFETY: "#60a5fa",
  MANUAL_HANDLING: "#a78bfa",
  RAW_MATERIALS_INGREDIENTS: "#fbbf24",
  FORMULATIONS: "#34d399",
  PRODUCTION: "#f87171",
  PACKAGING: "#a1a1aa",
  EQUIPMENT_MAINTENANCE: "#60a5fa",
  CLEANING_SANITATION: "#a78bfa",
  ENVIRONMENTAL_MONITORING: "#fbbf24",
  WHS: "#f87171",
  TEAMWORK_COMMUNICATION: "#34d399",
  TRAINING_INDUCTION: "#60a5fa",
  SOPS: "#a78bfa",
  POLICIES_PROCEDURES: "#a1a1aa",
};

export const HUB_ID = "dhanu-ai-hub";
export const RING_RADIUS = 13;
export const NODE_SIZE = 0.55;
