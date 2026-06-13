"use client";

import {
  EffectComposer,
  Bloom,
  DepthOfField,
  Vignette,
  Noise,
  ChromaticAberration,
  SSAO,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import * as THREE from "three";
import { useCapability } from "@/lib/useCapability";

/**
 * The "Nolan" grade: shallow depth of field, soft bloom on the brass + neon,
 * a breathing vignette, fine film grain and a whisper of chromatic aberration.
 * Throttled hard on low-power devices.
 */
export default function Effects() {
  const cap = useCapability();
  if (!cap.ready || cap.lowPower) return null;

  return (
    <EffectComposer multisampling={4} enableNormalPass>
      <SSAO
        blendFunction={BlendFunction.MULTIPLY}
        samples={16}
        radius={0.12}
        intensity={22}
        luminanceInfluence={0.6}
        color={new THREE.Color(0, 0, 0)}
      />
      <DepthOfField
        focusDistance={0.012}
        focalLength={0.04}
        bokehScale={5}
        height={480}
      />
      <Bloom
        intensity={0.7}
        luminanceThreshold={0.62}
        luminanceSmoothing={0.25}
        mipmapBlur
      />
      <ChromaticAberration
        offset={new THREE.Vector2(0.0006, 0.0008)}
        blendFunction={BlendFunction.NORMAL}
        radialModulation={false}
        modulationOffset={0}
      />
      <Vignette eskil={false} offset={0.28} darkness={0.82} />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.22} />
    </EffectComposer>
  );
}
