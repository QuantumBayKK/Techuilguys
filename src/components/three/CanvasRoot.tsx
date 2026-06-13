"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import Scene from "./Scene";
import { useCapability } from "@/lib/useCapability";

/**
 * Persistent WebGL canvas. Lives in the layout so it survives route changes
 * (the seamless-transition trick). DOM HUD is layered above it.
 */
export default function CanvasRoot() {
  const cap = useCapability();
  const dpr: [number, number] = cap.lowPower ? [1, 1.3] : [1, 2];

  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        shadows={!cap.lowPower}
        dpr={dpr}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        camera={{ fov: 38, position: [0, 1.3, 5.2], near: 0.1, far: 100 }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
