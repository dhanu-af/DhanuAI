"use client";

import { useRef, useState } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { KbGraphEntry } from "@/lib/graph/types";
import { KB_CATEGORY_COLOR, NODE_SIZE } from "@/lib/graph/types";
import type { SimNode } from "@/lib/graph/forceSim";
import { getGlowTexture } from "@/lib/graph/glowTexture";

const CLICK_DRAG_THRESHOLD = 0.12;

export default function GraphNode({
  entry,
  node,
  highlighted,
  dimmed,
  onSelect,
  onDragStateChange,
}: {
  entry: KbGraphEntry;
  node: SimNode;
  highlighted: boolean;
  dimmed: boolean;
  onSelect: (entry: KbGraphEntry) => void;
  onDragStateChange: (dragging: boolean) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Sprite>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const [hovered, setHovered] = useState(false);

  const dragPlane = useRef(new THREE.Plane());
  const dragStart = useRef(new THREE.Vector3());
  const isDragging = useRef(false);

  const radius = NODE_SIZE;
  const color = KB_CATEGORY_COLOR[entry.category];
  const glow = highlighted || hovered;

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.copy(node.position);
    }
    if (haloRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 1.4 + node.driftPhase.x) * 0.06;
      const targetScale = radius * (glow ? 7 : 5) * pulse;
      haloRef.current.scale.setScalar(targetScale);
    }
  });

  const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    isDragging.current = true;
    node.pinned = true;
    dragStart.current.copy(node.position);
    onDragStateChange(true);

    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
    dragPlane.current.setFromNormalAndCoplanarPoint(cameraDirection, node.position);
  };

  const handlePointerMove = (event: ThreeEvent<PointerEvent>) => {
    if (!isDragging.current) return;
    const hit = new THREE.Vector3();
    if (event.ray.intersectPlane(dragPlane.current, hit)) {
      node.position.copy(hit);
      node.velocity.set(0, 0, 0);
    }
  };

  const endDrag = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    node.pinned = false;
    onDragStateChange(false);

    if (node.position.distanceTo(dragStart.current) < CLICK_DRAG_THRESHOLD) {
      onSelect(entry);
    }
  };

  return (
    <group ref={groupRef}>
      <sprite ref={haloRef}>
        <spriteMaterial
          map={getGlowTexture()}
          color={color}
          transparent
          opacity={dimmed ? 0.05 : glow ? 0.5 : 0.22}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      <mesh
        ref={meshRef}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <sphereGeometry args={[radius, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={glow ? 1 : 0.55}
          roughness={0.35}
          metalness={0.15}
          transparent
          opacity={dimmed ? 0.2 : 1}
        />
      </mesh>

      <Html
        distanceFactor={9}
        position={[0, radius + 0.42, 0]}
        center
        style={{ pointerEvents: "none", opacity: dimmed ? 0.25 : 1, transition: "opacity 0.3s" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "4px 9px",
            borderRadius: 999,
            background: "rgba(9,9,11,0.72)",
            border: "1px solid rgba(255,255,255,0.08)",
            whiteSpace: "nowrap",
            maxWidth: 220,
            overflow: "hidden",
            textOverflow: "ellipsis",
            backdropFilter: "blur(6px)",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: "#f4f4f5",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {entry.title}
          </span>
        </div>
      </Html>
    </group>
  );
}
