"use client";

import { forwardRef, useMemo } from "react";
import * as THREE from "three";

/** Procedural felt: weave speckle, lamp pool, betting rings, center emblem. */
function makeFelt(): { map: THREE.CanvasTexture; rough: THREE.CanvasTexture } | null {
  if (typeof document === "undefined") return null;
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const x = c.getContext("2d")!;

  // base felt
  x.fillStyle = "#0e3a2b";
  x.fillRect(0, 0, S, S);
  // lamp pool — lighter center
  const pool = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  pool.addColorStop(0, "rgba(40,120,90,0.55)");
  pool.addColorStop(0.45, "rgba(20,70,52,0.2)");
  pool.addColorStop(1, "rgba(4,24,18,0.9)");
  x.fillStyle = pool;
  x.fillRect(0, 0, S, S);
  // weave speckle
  for (let i = 0; i < 90000; i++) {
    const a = Math.random();
    x.fillStyle = a > 0.5 ? "rgba(255,255,255,0.018)" : "rgba(0,0,0,0.03)";
    x.fillRect(Math.random() * S, Math.random() * S, 1.4, 1.4);
  }
  // betting rings
  x.strokeStyle = "rgba(201,162,75,0.12)";
  x.lineWidth = 2;
  [0.32, 0.46].forEach((r) => {
    x.beginPath();
    x.arc(S / 2, S / 2, S * r, 0, Math.PI * 2);
    x.stroke();
  });
  // faint center emblem
  x.save();
  x.translate(S / 2, S / 2);
  x.fillStyle = "rgba(201,162,75,0.10)";
  x.font = `${S * 0.16}px serif`;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText("♠", 0, -S * 0.02);
  x.fillStyle = "rgba(201,162,75,0.08)";
  x.font = `italic ${S * 0.045}px Georgia, serif`;
  x.fillText("Techuila Guys", 0, S * 0.13);
  x.restore();

  // roughness map — felt is matte but uneven
  const rc = document.createElement("canvas");
  rc.width = rc.height = S;
  const rx = rc.getContext("2d")!;
  rx.fillStyle = "#e6e6e6";
  rx.fillRect(0, 0, S, S);
  for (let i = 0; i < 60000; i++) {
    rx.fillStyle =
      Math.random() > 0.5 ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.05)";
    rx.fillRect(Math.random() * S, Math.random() * S, 2, 2);
  }

  const map = new THREE.CanvasTexture(c);
  const rough = new THREE.CanvasTexture(rc);
  map.anisotropy = 4;
  return { map, rough };
}

const Table = forwardRef<THREE.Group>(function Table(_props, ref) {
  const felt = useMemo(makeFelt, []);

  return (
    <group ref={ref}>
      {/* felt playfield */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <circleGeometry args={[6, 128]} />
        <meshStandardMaterial
          color={felt ? "#ffffff" : "#0f3d2e"}
          map={felt?.map}
          roughnessMap={felt?.rough}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* padded leather edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[6, 6.7, 128]} />
        <meshStandardMaterial color="#16110b" roughness={0.55} metalness={0.15} />
      </mesh>
      {/* stitch line on the padded edge */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.025, 0]}>
        <ringGeometry args={[6.06, 6.08, 128]} />
        <meshBasicMaterial color="#c9a24b" transparent opacity={0.35} />
      </mesh>

      {/* brass rail — beveled */}
      <mesh position={[0, 0.07, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[6.35, 0.1, 24, 160]} />
        <meshStandardMaterial
          color="#c9a24b"
          metalness={1}
          roughness={0.22}
          emissive="#3a2a0c"
          emissiveIntensity={0.35}
        />
      </mesh>
      <mesh position={[0, 0.11, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[6.35, 0.03, 16, 160]} />
        <meshStandardMaterial color="#f0d690" metalness={1} roughness={0.15} />
      </mesh>

      {/* table skirt */}
      <mesh position={[0, -1.4, 0]}>
        <cylinderGeometry args={[6.7, 6.2, 2.8, 128, 1, true]} />
        <meshStandardMaterial
          color="#0a0907"
          roughness={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
});

export default Table;
