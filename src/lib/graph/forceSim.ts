import * as THREE from "three";

export interface SimNode {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  pinned: boolean;
  mass: number;
  /** Target distance from the origin (hub) — the node's ring. 0 for the hub itself. */
  ringRadius: number;
  driftPhase: THREE.Vector3;
}

export interface SimLink {
  sourceIndex: number;
  targetIndex: number;
  /** Carried through for rendering only — physics treats every link the same. */
  kind?: string;
}

const REPULSION_STRENGTH = 16;
const SPRING_STRENGTH = 0.55;
const SPRING_LENGTH = 3.4;
const RADIAL_STRENGTH = 0.5;
const DAMPING = 0.86;
const DRIFT_STRENGTH = 0.02;
const MAX_SPEED = 4;

const scratchDelta = new THREE.Vector3();
const scratchRadial = new THREE.Vector3();

export class ForceSimulation {
  nodes: SimNode[];
  links: SimLink[];
  private time = 0;

  constructor(nodes: SimNode[], links: SimLink[]) {
    this.nodes = nodes;
    this.links = links;
  }

  step(dt: number) {
    this.time += dt;
    const n = this.nodes.length;

    for (let i = 0; i < n; i++) {
      const a = this.nodes[i];
      for (let j = i + 1; j < n; j++) {
        const b = this.nodes[j];
        scratchDelta.subVectors(a.position, b.position);
        let distSq = scratchDelta.lengthSq();
        if (distSq < 0.01) distSq = 0.01;
        const force = REPULSION_STRENGTH / distSq;
        scratchDelta.normalize().multiplyScalar(force * dt);
        if (!a.pinned) a.velocity.addScaledVector(scratchDelta, 1 / a.mass);
        if (!b.pinned) b.velocity.addScaledVector(scratchDelta, -1 / b.mass);
      }
    }

    for (const link of this.links) {
      const a = this.nodes[link.sourceIndex];
      const b = this.nodes[link.targetIndex];
      scratchDelta.subVectors(b.position, a.position);
      const dist = scratchDelta.length() || 0.001;
      const stretch = dist - SPRING_LENGTH;
      scratchDelta.normalize().multiplyScalar(stretch * SPRING_STRENGTH * dt);
      if (!a.pinned) a.velocity.addScaledVector(scratchDelta, 1 / a.mass);
      if (!b.pinned) b.velocity.addScaledVector(scratchDelta, -1 / b.mass);
    }

    for (const node of this.nodes) {
      if (node.pinned) {
        node.velocity.set(0, 0, 0);
        continue;
      }

      // Pull each node toward its own ring's target distance from the hub,
      // rather than straight to the origin — this is what keeps the tiers
      // visually organized into concentric shells as the graph settles.
      const dist = node.position.length() || 0.0001;
      const radialError = node.ringRadius - dist;
      scratchRadial.copy(node.position).divideScalar(dist);
      node.velocity.addScaledVector(scratchRadial, radialError * RADIAL_STRENGTH * dt);

      node.velocity.x += Math.sin(this.time * 0.15 + node.driftPhase.x) * DRIFT_STRENGTH * dt;
      node.velocity.y += Math.cos(this.time * 0.12 + node.driftPhase.y) * DRIFT_STRENGTH * dt;
      node.velocity.z += Math.sin(this.time * 0.1 + node.driftPhase.z) * DRIFT_STRENGTH * dt;

      node.velocity.multiplyScalar(DAMPING);
      if (node.velocity.length() > MAX_SPEED) {
        node.velocity.setLength(MAX_SPEED);
      }
      node.position.addScaledVector(node.velocity, dt);
    }
  }
}
