"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { DEALERS, type Dealer, type DealerId } from "@/data/dealers";

/**
 * The loader, as a real 3D model: a poker chip spins up (the "loading" beat),
 * shatters into a burst of shards, and the shards resolve into the two dealer
 * cards (Kailosh & Keni). Once formed the cards are LIVE — hover lifts them,
 * click deals you that hand. Pure time-driven state machine (no physics) for a
 * steady 60fps, capped DPR, tiny scene.
 *
 * Timeline (seconds):
 *   0.0–1.9  SPIN     chip accelerates around its axis at a 3/4 tilt
 *   1.9–2.8  SHATTER  chip → 32 wedge shards explode outward + tumble + fade
 *   2.6–3.8  FORM     two dealer cards rise from the burst, flip to face you
 *   3.8+     PICK     cards float + react to hover; click to choose
 */

const SHARDS = 32;
const T = {
  shatter: 1.9,
  shatterDur: 0.9,
  form: 2.6,
  formDur: 1.2,
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t: number) => t * t * t;
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/* ---------- chip face texture (cream→brass, spots, suits, wordmark) ---------- */
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

/* ---------- a dealer card composited to a canvas texture ---------- */
function useCardTexture(d: Dealer) {
  const [tex, setTex] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    let alive = true;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!alive) return;
      const W = 512;
      const H = Math.round(W * 1.466);
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const x = c.getContext("2d")!;

      x.fillStyle = "#0e0b08";
      x.fillRect(0, 0, W, H);

      const ir = img.width / img.height;
      const cr = W / H;
      let dw = W,
        dh = H,
        dx = 0,
        dy = 0;
      if (ir > cr) {
        dh = H;
        dw = H * ir;
        dx = (W - dw) / 2;
      } else {
        dw = W;
        dh = W / ir;
        dy = (H - dh) / 2;
      }
      x.drawImage(img, dx, dy, dw, dh);

      const grade = x.createLinearGradient(0, 0, 0, H);
      grade.addColorStop(0, "rgba(8,6,4,0.15)");
      grade.addColorStop(0.55, "rgba(8,6,4,0)");
      grade.addColorStop(1, "rgba(8,6,4,0.9)");
      x.fillStyle = grade;
      x.fillRect(0, 0, W, H);

      x.strokeStyle = "rgba(201,162,75,0.85)";
      x.lineWidth = 10;
      x.strokeRect(16, 16, W - 32, H - 32);
      x.strokeStyle = "rgba(201,162,75,0.35)";
      x.lineWidth = 3;
      x.strokeRect(30, 30, W - 60, H - 60);

      x.fillStyle = "#c9a24b";
      x.textBaseline = "top";
      x.font = `bold ${W * 0.11}px Georgia, serif`;
      x.textAlign = "left";
      x.fillText(d.suit, 40, 36);
      x.save();
      x.translate(W - 40, H - 36);
      x.rotate(Math.PI);
      x.fillText(d.suit, 0, 0);
      x.restore();

      x.textAlign = "left";
      x.fillStyle = "#ff9d2f";
      x.font = `bold ${W * 0.14}px Georgia, serif`;
      x.fillText(d.name.toUpperCase(), 44, H - 168);
      x.fillStyle = "#c9a24b";
      x.font = `${W * 0.05}px Georgia, serif`;
      x.fillText(d.rank.toUpperCase(), 46, H - 86);

      const t = new THREE.CanvasTexture(c);
      t.anisotropy = 8;
      t.colorSpace = THREE.SRGBColorSpace;
      setTex(t);
    };
    img.src = d.portrait;
    return () => {
      alive = false;
    };
  }, [d]);
  return tex;
}

/* ---------- the scene ---------- */
function Scene({
  onReady,
  onPick,
  picked,
}: {
  onReady?: () => void;
  onPick?: (id: DealerId) => void;
  picked: DealerId | null;
}) {
  const tilt = useRef<THREE.Group>(null);
  const chip = useRef<THREE.Group>(null);
  const shardGroup = useRef<THREE.Group>(null);
  const shardRefs = useRef<(THREE.Mesh | null)[]>([]);
  const cards = useRef<THREE.Group>(null);
  const cardRefs = useRef<(THREE.Group | null)[]>([]);
  const flash = useRef<THREE.PointLight>(null);
  const readyRef = useRef(false);
  const readyFired = useRef(false);
  const [hovered, setHovered] = useState<number | null>(null);

  const { viewport } = useThree();

  const chipTex = useMemo(() => makeChipTexture(), []);
  const texA = useCardTexture(DEALERS[0]);
  const texB = useCardTexture(DEALERS[1]);
  const cardTex = [texA, texB];

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

  const chipMats = useMemo(() => {
    return [
      new THREE.MeshStandardMaterial({ color: "#b89a5e", metalness: 0.6, roughness: 0.35 }),
      new THREE.MeshStandardMaterial({ map: chipTex, metalness: 0.35, roughness: 0.45 }),
      new THREE.MeshStandardMaterial({ color: "#9a814d", metalness: 0.5, roughness: 0.4 }),
    ];
  }, [chipTex]);

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

    const s = THREE.MathUtils.clamp(viewport.width / 8, 0.5, 1.15);
    if (tilt.current) tilt.current.scale.setScalar(s);
    if (cards.current) cards.current.scale.setScalar(s);

    // ----- SPIN -----
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

    // ----- SHATTER -----
    const e = clamp01((t - T.shatter) / T.shatterDur);
    const showShards = t >= T.shatter && e < 1;
    if (shardGroup.current) shardGroup.current.visible = showShards;
    if (showShards) {
      const spread = easeOutCubic(e) * 4.2;
      shardMat.opacity = 1 - easeInCubic(e);
      for (let i = 0; i < shards.length; i++) {
        const m = shardRefs.current[i];
        const sh = shards[i];
        if (!m) continue;
        m.position.set(sh.dirX * spread, sh.yOff * easeOutCubic(e) * 1.4, sh.dirZ * spread);
        const rot = e * sh.spin;
        m.rotation.set(sh.ax * rot, sh.ay * rot, sh.az * rot);
        m.scale.setScalar(1 - e * 0.55);
      }
    }

    if (flash.current) {
      flash.current.intensity = clamp01(1 - Math.abs(t - T.shatter) / 0.22) * 22;
    }

    // ----- FORM + PICK -----
    const f = clamp01((t - T.form) / T.formDur);
    if (cards.current) cards.current.visible = f > 0;
    if (f > 0) {
      const targetX = 1.05;
      for (let i = 0; i < 2; i++) {
        const g = cardRefs.current[i];
        if (!g) continue;
        const dir = i === 0 ? -1 : 1;
        const fi = clamp01(f - i * 0.06);
        const rise = easeOutCubic(fi);
        const back = easeOutBack(clamp01(fi));

        if (fi < 1) {
          // forming
          g.position.set(dir * targetX * rise, (1 - rise) * -0.25, 0);
          g.rotation.set(0, (1 - back) * dir * Math.PI * 0.6, 0);
          g.scale.setScalar(0.2 + back * 0.8);
        } else {
          // formed → idle + interactive
          const it = t - (T.form + T.formDur);
          const chosen = picked != null && DEALERS[i].id === picked;
          const dimmed = picked != null && !chosen;
          const hov = hovered === i && picked == null;

          let ty = Math.sin(it * 1.1 + i * 1.6) * 0.05;
          let tz = 0;
          let tScale = 1;
          let trotY = Math.sin(it * 0.6 + i) * 0.12;
          if (hov) {
            tScale = 1.09;
            tz = 0.18;
            trotY = 0;
            ty += 0.06;
          }
          if (chosen) {
            tScale = 1.28;
            tz = 0.7;
            trotY = 0;
          }
          if (dimmed) {
            tScale = 0.82;
            tz = -0.4;
            ty -= 0.15;
          }

          g.position.x = THREE.MathUtils.lerp(g.position.x, dir * targetX, 0.12);
          g.position.y = THREE.MathUtils.lerp(g.position.y, ty, 0.12);
          g.position.z = THREE.MathUtils.lerp(g.position.z, tz, 0.12);
          const cur = g.scale.x;
          g.scale.setScalar(THREE.MathUtils.lerp(cur, tScale, 0.12));
          g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, trotY, 0.1);
          g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, Math.cos(it * 0.5 + i) * 0.05, 0.1);
        }
      }

      const cg = cards.current;
      if (cg && picked == null) {
        cg.rotation.y = THREE.MathUtils.lerp(cg.rotation.y, state.pointer.x * 0.16, 0.06);
        cg.rotation.x = THREE.MathUtils.lerp(cg.rotation.x, -state.pointer.y * 0.09, 0.06);
      }

      if (!readyFired.current && f >= 1) {
        readyFired.current = true;
        readyRef.current = true;
        onReady?.();
      }
    }
  });

  const overCard = (i: number) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!readyRef.current || picked != null) return;
    setHovered(i);
    document.body.style.cursor = "pointer";
  };
  const outCard = () => {
    setHovered(null);
    document.body.style.cursor = "";
  };
  const clickCard = (i: number) => (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!readyRef.current || picked != null) return;
    document.body.style.cursor = "";
    onPick?.(DEALERS[i].id);
  };

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

      <group ref={cards} visible={false} position={[0, 0, 0.6]}>
        {DEALERS.map((d, i) => (
          <group
            key={d.id}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            onPointerOver={overCard(i)}
            onPointerOut={outCard}
            onClick={clickCard(i)}
          >
            <mesh>
              <planeGeometry args={[1.35, 1.98]} />
              {cardTex[i] ? (
                <meshBasicMaterial map={cardTex[i]!} toneMapped={false} side={THREE.DoubleSide} />
              ) : (
                <meshBasicMaterial color="#14110c" side={THREE.DoubleSide} />
              )}
            </mesh>
            <mesh position={[0, 0, -0.012]}>
              <planeGeometry args={[1.42, 2.05]} />
              <meshStandardMaterial
                color={hovered === i ? "#ff9d2f" : "#1a1610"}
                metalness={0.5}
                roughness={0.4}
              />
            </mesh>
          </group>
        ))}
      </group>
    </>
  );
}

export default function IntroChip3D({
  onReady,
  onPick,
  picked,
}: {
  onReady?: () => void;
  onPick?: (id: DealerId) => void;
  picked: DealerId | null;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 6], fov: 42 }}
      style={{ width: "100%", height: "100%" }}
    >
      <Scene onReady={onReady} onPick={onPick} picked={picked} />
    </Canvas>
  );
}
