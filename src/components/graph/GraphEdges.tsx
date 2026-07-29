"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SimLink, SimNode } from "@/lib/graph/forceSim";

const KIND_COLOR: Record<string, [number, number, number]> = {
  hub: [0.32, 0.72, 0.42],
  category: [0.58, 0.58, 0.65],
};
const DEFAULT_COLOR: [number, number, number] = [0.58, 0.58, 0.65];

export default function GraphEdges({ nodes, links }: { nodes: SimNode[]; links: SimLink[] }) {
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const positions = useMemo(() => new Float32Array(links.length * 2 * 3), [links.length]);

  const colors = useMemo(() => {
    const array = new Float32Array(links.length * 2 * 3);
    links.forEach((link, i) => {
      const [r, g, b] = KIND_COLOR[link.kind ?? ""] ?? DEFAULT_COLOR;
      const offset = i * 6;
      array[offset] = r;
      array[offset + 1] = g;
      array[offset + 2] = b;
      array[offset + 3] = r;
      array[offset + 4] = g;
      array[offset + 5] = b;
    });
    return array;
  }, [links]);

  useFrame(() => {
    const geometry = geometryRef.current;
    if (!geometry) return;
    for (let i = 0; i < links.length; i++) {
      const { sourceIndex, targetIndex } = links[i];
      const a = nodes[sourceIndex].position;
      const b = nodes[targetIndex].position;
      const offset = i * 6;
      positions[offset] = a.x;
      positions[offset + 1] = a.y;
      positions[offset + 2] = a.z;
      positions[offset + 3] = b.x;
      positions[offset + 4] = b.y;
      positions[offset + 5] = b.z;
    }
    const attribute = geometry.getAttribute("position") as THREE.BufferAttribute;
    attribute.needsUpdate = true;
  });

  if (links.length === 0) return null;

  return (
    <lineSegments>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent opacity={0.3} />
    </lineSegments>
  );
}
