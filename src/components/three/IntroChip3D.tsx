"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { DEALERS, type Dealer } from "@/data/dealers";

/**
 * The cold-open, as a real 3D model: a poker chip spins up, shatters into a
 * burst of shards, and the shards resolve into the two dealer cards (Kailosh &
 * Keni). Pure time-driven state machine (no physics) so it holds a steady
 * 60fps, with a capped DPR and a tiny scene. Mounted only on capable,
 * motion-OK devices — TitleAct keeps the CSS chip as the fallback.
 *
 * Timeline (seconds):
 *   0.0–1.8  SPIN     chip accelerates around its axis at a 3/4 tilt
 *   1.8–2.7  SHATTER  chip → 32 wedge shards explode outward + tumble + fade
 *   2.5–3.7  FORM     two dealer cards rise from the burst, flip to face you
 *   3.7+     IDLE     cards float with a gentle pointer parallax
 */

const SHARDS = 32;
const T = {
  shatter: 1.8,
  shatterDur: 0.9,
  form: 2.5,
  formDur: 1.2,
};

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInCubic = (t: number) => t * t * t;
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
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

  // brass rings
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

  // edge spots
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

  // center suits + wordmark
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
      const H = Math.round(W * 1.466); // 3 : 4.4
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const x = c.getContext("2d")!;

      // base
      x.fillStyle = "#0e0b08";
      x.fillRect(0, 0, W, H);

      // portrait, cover-fit
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

      // cinematic grade
      const grade = x.createLinearGradient(0, 0, 0, H);
      grade.addColorStop(0, "rgba(8,6,4,0.15)");
      grade.addColorStop(0.55, "rgba(8,6,4,0)");
      grade.addColorStop(1, "rgba(8,6,4,0.85)");
      x.fillStyle = grade;
      x.fillRect(0, 0, W, H);

      // brass frame
      x.strokeStyle = "rgba(201,162,75,0.85)";
      x.lineWidth = 10;
      x.strokeRect(16, 16, W - 32, H - 32);
      x.strokeStyle = "rgba(201,162,75,0.35)";
      x.lineWidth = 3;
      x.strokeRect(30, 30, W - 60, H - 60);

      // suit corners
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

      // name + rank
      x.textAlign = "left";
      x.fillStyle = "#ff9d2f";
      x.font = `bold ${W * 0.14}px Georgia, serif`;
      x.fillText(d.name.toUpperCase(), 44, H - 150);
      x.fillStyle = "#c9a24b";
      x.font = `${W * 0.05}px Georgia, serif`;
      x.fillText(d.rank.toUpperCase(), 46, H - 70);

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
function Scene({ onDone }: { onDone?: () => void }) {
  const tilt = useRef<THREE.Group>(null); // viewing tilt for chip + shards
  const chip = useRef<THREE.Group>(null); // spins
  const shardGroup = useRef<THREE.Group>(null);
  const shardRefs = useRef<(THREE.Mesh | null)[]>([]);
  const cards = useRef<THREE.Group>(null);
  const cardRefs = useRef<(THREE.Group | null)[]>([]);
  const flash = useRef<THREE.PointLight>(null);
  const doneFired = useRef(false);

  const { viewport } = useThree();

  const chipTex = useMemo(() => makeChipTexture(), []);
  const texA = useCardTexture(DEALERS[0]);
  const texB = useCardTexture(DEALERS[1]);
  const cardTex = [texA, texB];

  // per-shard wedge geometry + motion params
  const shards = useMemo(() => {
    const arr = [];
    const theta = (Math.PI * 2) / SHARDS;
    for (let i = 0; i < SHARDS; i++) {
      const start = i * theta;
      const mid = start + theta / 2;
      const geo = new THREE.CylinderGeometry(
        1.4,
        1.4,
        0.22,
        1,
        1,
        false,
        start,
        theta
      );
      // deterministic pseudo-random per shard (no Math.random → stable)
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
    const side = new THREE.MeshStandardMaterial({
      color: "#b89a5e",
      metalness: 0.6,
      roughness: 0.35,
    });
    const top = new THREE.MeshStandardMaterial({
      map: chipTex,
      metalness: 0.35,
      roughness: 0.45,
    });
    const bottom = new THREE.MeshStandardMaterial({
      color: "#9a814d",
      metalness: 0.5,
      roughness: 0.4,
    });
    return [side, top, bottom];
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

    // responsive scale so the whole thing fits any viewport
    const s = THREE.MathUtils.clamp(viewport.width / 8, 0.52, 1.15);
    if (tilt.current) tilt.current.scale.setScalar(s);
    if (cards.current) cards.current.scale.setScalar(s);

    // ----- SPIN (chip visible until shatter) -----
    const spinning = t < T.shatter;
    if (chip.current) {
      chip.current.visible = spinning;
      // accelerating spin
      const sp = t * 2.2 + t * t * 1.9;
      chip.current.rotation.y = sp;
      // anticipation pop right before the break
      const ant = clamp01((t - (T.shatter - 0.3)) / 0.3);
      const pop = 1 + easeInCubic(ant) * 0.18;
      chip.current.scale.setScalar(pop);
    }
    if (tilt.current) {
      tilt.current.rotation.x = -0.5;
      // tiny breathing wobble during spin
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
        m.position.set(
          sh.dirX * spread,
          sh.yOff * easeOutCubic(e) * 1.4,
          sh.dirZ * spread
        );
        const rot = e * sh.spin;
        m.rotation.set(sh.ax * rot, sh.ay * rot, sh.az * rot);
        const sc = 1 - e * 0.55;
        m.scale.setScalar(sc);
      }
    }

    // flash at the break
    if (flash.current) {
      const fl = clamp01(1 - Math.abs(t - T.shatter) / 0.22);
      flash.current.intensity = fl * 22;
    }

    // ----- FORM the two cards -----
    const f = clamp01((t - T.form) / T.formDur);
    if (cards.current) cards.current.visible = f > 0;
    if (f > 0) {
      const targetX = 0.95;
      for (let i = 0; i < 2; i++) {
        const g = cardRefs.current[i];
        if (!g) continue;
        const dir = i === 0 ? -1 : 1;
        const fi = clamp01(f * 1.0 - i * 0.06); // tiny stagger
        const rise = easeOutCubic(fi);
        const back = easeOutBack(clamp01(fi));
        g.position.set(dir * targetX * rise, (1 - rise) * -0.25, 0);
        g.rotation.y = (1 - back) * dir * Math.PI * 0.6;
        g.scale.setScalar(0.2 + back * 0.8);

        // idle float once formed
        if (fi >= 1) {
          const it = t - (T.form + T.formDur);
          g.position.y = Math.sin(it * 1.1 + i * 1.6) * 0.05;
          g.rotation.y = Math.sin(it * 0.6 + i) * 0.12;
          g.rotation.x = Math.cos(it * 0.5 + i) * 0.05;
        }
      }
      // gentle pointer parallax on the pair
      const cg = cards.current;
      if (cg) {
        cg.rotation.y = THREE.MathUtils.lerp(cg.rotation.y, state.pointer.x * 0.18, 0.06);
        cg.rotation.x = THREE.MathUtils.lerp(cg.rotation.x, -state.pointer.y * 0.1, 0.06);
      }

      if (!doneFired.current && f >= 1) {
        doneFired.current = true;
        onDone?.();
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 4]} intensity={2.2} color="#ffe6b8" />
      <directionalLight position={[-4, -2, 2]} intensity={0.7} color="#37e6cf" />
      <pointLight ref={flash} position={[0, 0, 2]} intensity={0} color="#ffd27f" distance={10} />

      {/* chip + shards share the viewing tilt */}
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

      {/* the two dealer cards */}
      <group ref={cards} visible={false} position={[0, 0, 0.6]}>
        {DEALERS.map((d, i) => (
          <group
            key={d.id}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
          >
            <mesh>
              <planeGeometry args={[1.35, 1.98]} />
              {cardTex[i] ? (
                <meshBasicMaterial map={cardTex[i]!} toneMapped={false} side={THREE.DoubleSide} />
              ) : (
                <meshBasicMaterial color="#14110c" side={THREE.DoubleSide} />
              )}
            </mesh>
            {/* thin brass back so the flip has a body */}
            <mesh position={[0, 0, -0.012]}>
              <planeGeometry args={[1.4, 2.03]} />
              <meshStandardMaterial color="#1a1610" metalness={0.5} roughness={0.4} />
            </mesh>
          </group>
        ))}
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
