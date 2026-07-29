"use client";

import { useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { KbGraphEntry } from "@/lib/graph/types";
import { useKbForceGraph } from "@/hooks/useKbForceGraph";
import type { ForceSimulation } from "@/lib/graph/forceSim";
import GraphNode from "./GraphNode";
import GraphEdges from "./GraphEdges";
import ParticleField from "./ParticleField";
import CameraRig from "./CameraRig";
import HubNode from "./HubNode";

function SimulationDriver({ simulation }: { simulation: ForceSimulation }) {
  useFrame((_, delta) => {
    simulation.step(Math.min(delta, 0.05));
  });
  return null;
}

function matchesQuery(entry: KbGraphEntry, query: string): boolean {
  if (!query) return false;
  const haystack = [entry.title, entry.category, entry.cause, entry.answer, entry.source]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export default function Scene({
  entries,
  searchQuery,
  onSelectEntry,
}: {
  entries: KbGraphEntry[];
  searchQuery: string;
  onSelectEntry: (entry: KbGraphEntry) => void;
}) {
  const { simulation, nodes, links, nodeById } = useKbForceGraph(entries);
  const [dragging, setDragging] = useState(false);

  const query = searchQuery.trim().toLowerCase();
  const hasQuery = query.length > 0;

  const entryNodes = useMemo(
    () => entries.map((entry) => ({ entry, node: nodeById.get(entry.id) })),
    [entries, nodeById]
  );

  return (
    <Canvas camera={{ position: [0, 6, 24], fov: 50 }} gl={{ antialias: true }} dpr={[1, 2]}>
      <color attach="background" args={["#09090b"]} />
      <fog attach="fog" args={["#09090b", 22, 55]} />
      <ambientLight intensity={0.55} />
      <pointLight position={[14, 14, 14]} intensity={80} />
      <pointLight position={[-16, -10, -14]} intensity={40} color="#60a5fa" />

      <ParticleField />
      <SimulationDriver simulation={simulation} />
      <GraphEdges nodes={nodes} links={links} />

      <HubNode />

      {entryNodes.map(({ entry, node }) => {
        if (!node) return null;
        const matched = hasQuery ? matchesQuery(entry, query) : false;
        return (
          <GraphNode
            key={entry.id}
            entry={entry}
            node={node}
            highlighted={matched}
            dimmed={hasQuery && !matched}
            onSelect={onSelectEntry}
            onDragStateChange={setDragging}
          />
        );
      })}

      <CameraRig focusKey={null} focusPosition={null} enabled={!dragging} />
    </Canvas>
  );
}
