"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * The loader flourish: a 3D poker chip spins up (the "dealing in…" beat) and
 * shatters into a burst of 32 wedge shards that tumble outward and fade. When
 * the shatter is underway it calls `onDone`, and the parent (IntroPick) hands
 * off to the real HTML dealer cards which rise out of the burst. Pure
 * time-driven state machine (no physics) + capped DPR for a steady 60fps.
 */

const SHARDS = 32;
const T = { shatter: 1.7, shatterDur: 1.0 };

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t: number) => t * t * t;

function makeChipTexture() {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const x = c.getContext("2d")!;
  const r = S / 2;

  const g = x.createRadialGradient(r * 0.8, r * 0.7, r * 0.1, r, r, r);
  g.addColorStop(0, "#fff8e8");
  g.addColorStop(0.45, "#e9e1cf");
  g.addColorStop(0.72, "#cdbf9f");
  g.addColorStop(1, "#b09a72");
  x.fillStyle = g;
  x.beginPath();
  x.arc(r, r, r, 0, Math.PI * 2);
  x.fill();

  x.strokeStyle = "rgba(201,162,75,0.85)";
  x.lineWidth = 16;
  x.beginPath();
  x.arc(r, r, r * 0.86, 0, Math.PI * 2);
  x.stroke();
  x.strokeStyle = "rgba(233,225,207,0.8)";
  x.lineWidth = 8;
  x.beginPath();
  x.arc(r, r, r * 0.74, 0, Math.PI * 2);
  x.stroke();

  x.fillStyle = "#c9a24b";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const px = r + Math.cos(a) * r * 0.86;
    const py = r + Math.sin(a) * r * 0.86;
    x.save();
    x.translate(px, py);
    x.rotate(a);
    x.fillRect(-26, -10, 52, 20);
    x.restore();
  }

  x.fillStyle = "#1a1410";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.font = `bold ${r * 0.5}px Georgia, serif`;
  x.fillText("♠ ♣", r, r * 0.92);
  x.fillStyle = "#8a6f2f";
  x.font = `${r * 0.13}px Georgia, serif`;
  x.fillText("TECHUILA GUYS", r, r * 1.34);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function Scene({ onDone }: { onDone?: () => void }) {
  const tilt = useRef<THREE.Group>(null);
  const chip = useRef<THREE.Group>(null);
  const shardGroup = useRef<THREE.Group>(null);
  const shardRefs = useRef<(THREE.Mesh | null)[]>([]);
  const flash = useRef<THREE.PointLight>(null);
  const doneFired = useRef(false);

  const { viewport } = useThree();
  const chipTex = useMemo(() => makeChipTexture(), []);

  const shards = useMemo(() => {
    const arr = [];
    const theta = (Math.PI * 2) / SHARDS;
    for (let i = 0; i < SHARDS; i++) {
      const start = i * theta;
      const mid = start + theta / 2;
      const geo = new THREE.CylinderGeometry(1.4, 1.4, 0.22, 1, 1, false, start, theta);
      const h = Math.sin(i * 12.9898) * 43758.5453;
      const rnd = h - Math.floor(h);
      const h2 = Math.sin(i * 78.233) * 12733.42;
      const rnd2 = h2 - Math.floor(h2);
      arr.push({
        geo,
        dirX: Math.cos(mid),
        dirZ: Math.sin(mid),
        yOff: (rnd - 0.5) * 2,
        spin: 4 + rnd2 * 8,
        ax: rnd - 0.5,
        ay: rnd2 - 0.5,
        az: rnd * rnd2 - 0.25,
      });
    }
    return arr;
  }, []);

  const chipMats = useMemo(
    () => [
      new THREE.MeshStandardMaterial({ color: "#b89a5e", metalness: 0.6, roughness: 0.35 }),
      new THREE.MeshStandardMaterial({ map: chipTex, metalness: 0.35, roughness: 0.45 }),
      new THREE.MeshStandardMaterial({ color: "#9a814d", metalness: 0.5, roughness: 0.4 }),
    ],
    [chipTex]
  );

  const shardMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#cdbf9f",
        metalness: 0.55,
        roughness: 0.4,
        transparent: true,
        opacity: 1,
      }),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    const s = THREE.MathUtils.clamp(viewport.width / 8, 0.55, 1.2);
    if (tilt.current) tilt.current.scale.setScalar(s);

    const spinning = t < T.shatter;
    if (chip.current) {
      chip.current.visible = spinning;
      chip.current.rotation.y = t * 2.2 + t * t * 2.0;
      const ant = clamp01((t - (T.shatter - 0.3)) / 0.3);
      chip.current.scale.setScalar(1 + easeInCubic(ant) * 0.18);
    }
    if (tilt.current) {
      tilt.current.rotation.x = -0.5;
      tilt.current.rotation.z = spinning ? Math.sin(t * 1.6) * 0.04 : 0;
    }

    const e = clamp01((t - T.shatter) / T.shatterDur);
    const showShards = t >= T.shatter && e < 1;
    if (shardGroup.current) shardGroup.current.visible = showShards;
    if (showShards) {
      const spread = easeOutCubic(e) * 4.6;
      shardMat.opacity = 1 - easeInCubic(e);
      for (let i = 0; i < shards.length; i++) {
        const m = shardRefs.current[i];
        const sh = shards[i];
        if (!m) continue;
        m.position.set(sh.dirX * spread, sh.yOff * easeOutCubic(e) * 1.5, sh.dirZ * spread);
        const rot = e * sh.spin;
        m.rotation.set(sh.ax * rot, sh.ay * rot, sh.az * rot);
        m.scale.setScalar(1 - e * 0.55);
      }
    }

    if (flash.current) {
      flash.current.intensity = clamp01(1 - Math.abs(t - T.shatter) / 0.22) * 24;
    }

    // hand off to the HTML cards partway through the burst
    if (!doneFired.current && t >= T.shatter + T.shatterDur * 0.45) {
      doneFired.current = true;
      onDone?.();
    }
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} color="#ffe6b8" />
      <directionalLight position={[-4, -2, 2]} intensity={0.7} color="#37e6cf" />
      <pointLight ref={flash} position={[0, 0, 2]} intensity={0} color="#ffd27f" distance={10} />

      <group ref={tilt}>
        <group ref={chip}>
          <mesh material={chipMats}>
            <cylinderGeometry args={[1.4, 1.4, 0.22, 64]} />
          </mesh>
        </group>

        <group ref={shardGroup} visible={false}>
          {shards.map((sh, i) => (
            <mesh
              key={i}
              ref={(el) => {
                shardRefs.current[i] = el;
              }}
              geometry={sh.geo}
              material={shardMat}
            />
          ))}
        </group>
      </group>
    </>
  );
}

export default function IntroChip3D({ onDone }: { onDone?: () => void }) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6], fov: 42 }}
      style={{ width: "100%", height: "100%" }}
    >
      <Scene onDone={onDone} />
    </Canvas>
  );
}
