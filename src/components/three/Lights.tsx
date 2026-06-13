"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Warm key + neon-amber rim + hanging-lamp pool over the felt. */
export default function Lights() {
  const rim = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    // subtle living flicker on the neon rim
    if (rim.current) {
      const t = state.clock.elapsedTime;
      rim.current.intensity = 6 + Math.sin(t * 7.3) * 0.4 + Math.sin(t * 2.1) * 0.6;
    }
  });

  return (
    <>
      <ambientLight intensity={0.12} color="#caa86a" />
      {/* warm key */}
      <spotLight
        position={[3, 7, 4]}
        angle={0.7}
        penumbra={0.9}
        intensity={120}
        color="#ffcf8a"
        distance={26}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {/* hanging lamp pool straight down on the felt */}
      <spotLight
        position={[0, 9, 0]}
        angle={0.5}
        penumbra={0.8}
        intensity={90}
        color="#ffe2b0"
        distance={24}
      />
      {/* neon-amber rim from the front-low */}
      <pointLight
        ref={rim}
        position={[-2.5, 1.2, 5]}
        intensity={6}
        color="#ff9d2f"
        distance={18}
      />
      {/* cool counter to separate from black */}
      <pointLight position={[5, 2, -4]} intensity={3} color="#2e6cff" distance={16} />
    </>
  );
}
