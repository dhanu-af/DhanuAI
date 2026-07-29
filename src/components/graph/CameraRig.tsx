"use client";

import { useEffect, useRef, type ComponentRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

const ARRIVE_EPSILON = 0.2;
const FOCUS_OFFSET = new THREE.Vector3(0, 1.3, 6);

export default function CameraRig({
  focusKey,
  focusPosition,
  enabled,
}: {
  focusKey: string | null;
  focusPosition: THREE.Vector3 | null;
  enabled: boolean;
}) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera } = useThree();
  const arrived = useRef(true);
  const lastFocusKey = useRef<string | null>(null);
  const desiredTarget = useRef(new THREE.Vector3());
  const desiredCameraPos = useRef(new THREE.Vector3());

  useEffect(() => {
    if (focusKey !== lastFocusKey.current) {
      lastFocusKey.current = focusKey;
      arrived.current = focusKey === null;
    }
  }, [focusKey]);

  useFrame(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (focusPosition && !arrived.current) {
      desiredTarget.current.copy(focusPosition);
      desiredCameraPos.current.copy(focusPosition).add(FOCUS_OFFSET);

      controls.target.lerp(desiredTarget.current, 0.05);
      camera.position.lerp(desiredCameraPos.current, 0.05);

      const settled =
        controls.target.distanceTo(desiredTarget.current) < ARRIVE_EPSILON &&
        camera.position.distanceTo(desiredCameraPos.current) < ARRIVE_EPSILON;
      if (settled) arrived.current = true;
    }

    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={enabled}
      enableDamping
      dampingFactor={0.08}
      minDistance={3}
      maxDistance={45}
      autoRotate={false}
    />
  );
}
