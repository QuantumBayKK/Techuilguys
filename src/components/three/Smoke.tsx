"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { experience } from "@/lib/experience";
import { useCapability } from "@/lib/useCapability";

/** Soft round smoke puff drawn to a canvas — no asset needed. */
function makePuff(): THREE.CanvasTexture {
  const s = 128;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,225,180,0.42)");
  g.addColorStop(0.4, "rgba(180,150,110,0.16)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  // break up the disc with a little turbulence
  for (let i = 0; i < 240; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * (s / 2);
    ctx.fillStyle = `rgba(255,220,170,${Math.random() * 0.05})`;
    ctx.beginPath();
    ctx.arc(s / 2 + Math.cos(a) * r, s / 2 + Math.sin(a) * r, Math.random() * 10, 0, 7);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

type Puff = {
  pos: THREE.Vector3;
  scale: number;
  speed: number;
  spin: number;
  phase: number;
};

export default function Smoke() {
  const tex = useMemo(() => (typeof document !== "undefined" ? makePuff() : null), []);
  const group = useRef<THREE.Group>(null);
  const density = useRef(0.3);
  const cap = useCapability();
  const count = cap.lowPower ? 7 : 14;

  const puffs = useMemo<Puff[]>(() => {
    const out: Puff[] = [];
    for (let i = 0; i < count; i++) {
      out.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 10,
          0.4 + Math.random() * 3.2,
          (Math.random() - 0.5) * 8 - 1
        ),
        scale: 3 + Math.random() * 4,
        speed: 0.08 + Math.random() * 0.12,
        spin: (Math.random() - 0.5) * 0.1,
        phase: Math.random() * 10,
      });
    }
    return out;
  }, [count]);

  useFrame((state, delta) => {
    const stage = experience.get().stage;
    const target = stage === "gate" || stage === "intro" ? 0.35 : 1;
    density.current += (target - density.current) * 0.02;
    const t = state.clock.elapsedTime;
    const g = group.current;
    if (!g) return;
    g.children.forEach((child, i) => {
      const p = puffs[i];
      if (!p) return; // skip the god-ray cone child
      child.position.y += p.speed * delta;
      child.position.x += Math.sin(t * 0.2 + p.phase) * 0.002;
      if (child.position.y > 4.2) child.position.y = 0.3;
      (child as THREE.Sprite).material.rotation += p.spin * delta;
      const breathe = 0.55 + Math.sin(t * 0.5 + p.phase) * 0.25;
      (child as THREE.Sprite).material.opacity =
        breathe * 0.16 * density.current;
    });
  });

  if (!tex) return null;

  return (
    <group ref={group}>
      {puffs.map((p, i) => (
        <sprite key={i} position={p.pos} scale={[p.scale, p.scale, 1]}>
          <spriteMaterial
            map={tex}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            opacity={0.1}
          />
        </sprite>
      ))}

      {/* god-ray shaft from the hanging lamp */}
      <mesh position={[0, 4.6, 0]}>
        <coneGeometry args={[3.4, 9, 32, 1, true]} />
        <meshBasicMaterial
          color="#ffd9a0"
          transparent
          opacity={0.04}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
