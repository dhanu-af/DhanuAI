"use client";

import { useState } from "react";
import * as THREE from "three";
import type { KbGraphEntry } from "@/lib/graph/types";
import { HUB_ID, RING_RADIUS } from "@/lib/graph/types";
import { buildLinks, spherePositions, type GraphLink } from "@/lib/graph/graphData";
import { ForceSimulation, type SimLink, type SimNode } from "@/lib/graph/forceSim";

function buildSimulation(entries: KbGraphEntry[]) {
  const positions = spherePositions(entries);
  const allIds = [HUB_ID, ...entries.map((e) => e.id)];
  const idToIndex = new Map(allIds.map((id, i) => [id, i]));

  const simNodes: SimNode[] = [
    {
      id: HUB_ID,
      position: new THREE.Vector3(0, 0, 0),
      velocity: new THREE.Vector3(),
      pinned: true,
      mass: 10,
      ringRadius: 0,
      driftPhase: new THREE.Vector3(),
    },
  ];

  for (const entry of entries) {
    const [x, y, z] = positions.get(entry.id) ?? [0, 0, 0];
    const jitter = () => (Math.random() - 0.5) * 1.2;
    simNodes.push({
      id: entry.id,
      position: new THREE.Vector3(x + jitter(), y + jitter(), z + jitter()),
      velocity: new THREE.Vector3(),
      pinned: false,
      mass: 1,
      ringRadius: RING_RADIUS,
      driftPhase: new THREE.Vector3(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      ),
    });
  }

  const rawLinks: GraphLink[] = buildLinks(entries, HUB_ID);
  const simLinks: SimLink[] = rawLinks
    .map((link) => ({
      sourceIndex: idToIndex.get(link.source) ?? -1,
      targetIndex: idToIndex.get(link.target) ?? -1,
      kind: link.kind,
    }))
    .filter((link) => link.sourceIndex >= 0 && link.targetIndex >= 0);

  const nodeById = new Map(simNodes.map((node) => [node.id, node]));
  const simulation = new ForceSimulation(simNodes, simLinks);
  return { simNodes, simLinks, simulation, nodeById };
}

export function useKbForceGraph(entries: KbGraphEntry[]) {
  const [state] = useState(() => buildSimulation(entries));

  return {
    simulation: state.simulation,
    nodes: state.simNodes,
    links: state.simLinks,
    nodeById: state.nodeById,
  };
}
