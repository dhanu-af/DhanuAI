import type { KbGraphEntry } from "./types";
import { RING_RADIUS } from "./types";

export type LinkKind = "hub" | "category";

export interface GraphLink {
  source: string;
  target: string;
  kind: LinkKind;
}

/**
 * Builds every connection automatically from entry metadata — category and
 * an always-present link from every entry to the central hub. Nothing here
 * is hand-wired per entry.
 */
export function buildLinks(entries: KbGraphEntry[], hubId: string): GraphLink[] {
  const links: GraphLink[] = [];
  const seen = new Set<string>();

  const addLink = (a: string, b: string, kind: LinkKind) => {
    if (a === b) return;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (seen.has(key)) return;
    seen.add(key);
    links.push({ source: a, target: b, kind });
  };

  for (const entry of entries) {
    addLink(hubId, entry.id, "hub");
  }

  const byCategory = new Map<string, KbGraphEntry[]>();
  for (const entry of entries) {
    const list = byCategory.get(entry.category) ?? [];
    list.push(entry);
    byCategory.set(entry.category, list);
  }
  for (const group of byCategory.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        addLink(group[i].id, group[j].id, "category");
      }
    }
  }

  return links;
}

function spherePoint(index: number, count: number, radius: number): [number, number, number] {
  if (count <= 1) return [radius, 0, 0];
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const y = 1 - (index / (count - 1)) * 2;
  const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = goldenAngle * index;
  return [Math.cos(theta) * radiusAtY * radius, y * radius, Math.sin(theta) * radiusAtY * radius];
}

/**
 * Places every entry on a single sphere shell around the hub, ordered by
 * category first so same-category nodes land angularly near each other.
 */
export function spherePositions(entries: KbGraphEntry[]): Map<string, [number, number, number]> {
  const positions = new Map<string, [number, number, number]>();
  const sorted = [...entries].sort((a, b) => a.category.localeCompare(b.category));
  sorted.forEach((entry, i) => {
    positions.set(entry.id, spherePoint(i, sorted.length, RING_RADIUS));
  });
  return positions;
}
