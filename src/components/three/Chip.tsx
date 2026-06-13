"use client";

import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";

// Cursive face engraving — troika loads a real .ttf at runtime; falls back
// gracefully if offline.
const SCRIPT_FONT =
  "https://raw.githubusercontent.com/google/fonts/main/ofl/pinyonscript/PinyonScript-Regular.ttf";

const CREAM = "#e9e1cf";
const CREAM_DK = "#d8cdb4";
const BRASS = "#c9a24b";
const INK = "#1a1410";

/**
 * A proper poker chip: chamfered cream body, alternating brass edge spots,
 * recessed brass inlay rings and a cursive "Techuila Guys" engraving. Higher
 * poly but cheap geometry — no external model, fast to load.
 */
const Chip = forwardRef<THREE.Group>(function Chip(_props, ref) {
  const spots = useMemo(() => {
    const out: number[] = [];
    const count = 12;
    for (let i = 0; i < count; i++) out.push((i / count) * Math.PI * 2);
    return out;
  }, []);

  const brass = (
    <meshStandardMaterial
      color={BRASS}
      metalness={1}
      roughness={0.22}
      emissive="#3a2a0c"
      emissiveIntensity={0.25}
    />
  );

  return (
    <group ref={ref} scale={1}>
      {/* body */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[1, 1, 0.15, 128]} />
        <meshStandardMaterial color={CREAM} metalness={0.15} roughness={0.5} />
      </mesh>

      {/* fine chamfer highlights top + bottom rim */}
      <mesh position={[0, 0.072, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.99, 0.014, 12, 128]} />
        {brass}
      </mesh>
      <mesh position={[0, -0.072, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.99, 0.014, 12, 128]} />
        {brass}
      </mesh>

      {/* alternating brass edge spots */}
      {spots.map((a, i) => (
        <mesh
          key={i}
          position={[Math.cos(a) * 0.995, 0, Math.sin(a) * 0.995]}
          rotation={[0, -a, 0]}
        >
          <boxGeometry args={[0.04, 0.152, 0.16]} />
          {brass}
        </mesh>
      ))}

      {/* recessed face inlay ring (both faces) */}
      {[0.0755, -0.0755].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.66, 0.74, 96]} />
          {brass}
        </mesh>
      ))}
      {/* inner hairline ring */}
      {[0.0756, -0.0756].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.512, 96]} />
          <meshStandardMaterial color={CREAM_DK} metalness={0.2} roughness={0.6} />
        </mesh>
      ))}

      {/* cursive engraving — top + bottom */}
      <Text
        font={SCRIPT_FONT}
        position={[0, 0.078, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.34}
        color={INK}
        anchorX="center"
        anchorY="middle"
        maxWidth={1.1}
        textAlign="center"
      >
        Techuila Guys
      </Text>
      <Text
        font={SCRIPT_FONT}
        position={[0, -0.078, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        fontSize={0.34}
        color={INK}
        anchorX="center"
        anchorY="middle"
        maxWidth={1.1}
        textAlign="center"
      >
        Techuila Guys
      </Text>
    </group>
  );
});

export default Chip;
