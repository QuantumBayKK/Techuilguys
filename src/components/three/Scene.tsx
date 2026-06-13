"use client";

import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Environment, Lightformer, ContactShadows } from "@react-three/drei";
import Chip from "./Chip";
import Table from "./Table";
import Lights from "./Lights";
import Smoke from "./Smoke";
import Effects from "./Effects";
import { gsap, initGsap } from "@/lib/gsap";
import { useCapability } from "@/lib/useCapability";
import { experience, useExperience } from "@/lib/experience";
import { audio } from "@/lib/audio";

/** Mutable animation state — tweened by GSAP, applied every frame. */
const anim = {
  chip: { x: 0, y: 0.55, z: 0, rx: 0, ry: 0, rz: 0 },
  freeSpin: 1.2, // rad/s continuous Y spin (the idle/gate spin)
  table: 0, // 0..1 reveal
  cam: { x: 0, y: 1.3, z: 5.2, tx: 0, ty: 0.4, tz: 0 },
  camRoll: 0, // dutch tilt
};

export default function Scene() {
  const { camera } = useThree();
  const chipRef = useRef<THREE.Group>(null);
  const tableRef = useRef<THREE.Group>(null);
  const { stage } = useExperience();
  const cap = useCapability();
  const played = useRef(false);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  const snapToResting = () => {
    tlRef.current?.kill();
    anim.freeSpin = 0;
    anim.table = 1;
    Object.assign(anim.chip, { x: 0.4, y: 0.12, z: 0, rx: 0, ry: 0, rz: 0 });
    Object.assign(anim.cam, { x: 0, y: 3.4, z: 6.4, tx: 0, ty: 0.1, tz: -0.6 });
    anim.camRoll = 0;
    audio.startBed();
  };

  // Apply anim every frame.
  useFrame((state, delta) => {
    if (anim.freeSpin) anim.chip.ry += anim.freeSpin * delta;
    const c = chipRef.current;
    if (c) {
      c.position.set(anim.chip.x, anim.chip.y, anim.chip.z);
      c.rotation.set(anim.chip.rx, anim.chip.ry, anim.chip.rz);
    }
    const t = tableRef.current;
    if (t) {
      const s = anim.table;
      t.visible = s > 0.001;
      t.scale.setScalar(0.7 + s * 0.3);
      t.position.y = -1.6 + s * 1.6;
      (t as any).traverse((o: any) => {
        if (o.material && "opacity" in o.material) {
          o.material.transparent = true;
          o.material.opacity = Math.min(o.material.userData._base ?? 1, s);
        }
      });
    }
    camera.position.set(anim.cam.x, anim.cam.y, anim.cam.z);
    camera.lookAt(anim.cam.tx, anim.cam.ty, anim.cam.tz);
    camera.rotation.z = anim.camRoll;
    // subtle handheld drift so no shot is ever dead-static
    const et = state.clock.elapsedTime;
    camera.position.x += Math.sin(et * 0.5) * 0.016;
    camera.position.y += Math.cos(et * 0.37) * 0.012;
    camera.rotation.z += Math.sin(et * 0.23) * 0.002;
  });

  // Any non-cinematic stage: ensure we're resting at the table master shot.
  // Covers reduced-motion direct entry, skip-mid-intro, and natural completion.
  useEffect(() => {
    if (stage === "dealers" || stage === "dealt" || stage === "inspect" || stage === "body") {
      played.current = true;
      snapToResting();
    }
  }, [stage]);

  // The directed intro cinematic — fires once when we enter `intro`.
  useEffect(() => {
    initGsap();
    if (stage !== "intro" || played.current) return;
    played.current = true;

    const tl = gsap.timeline({
      defaults: { ease: "felt" },
      onComplete: () => experience.set({ stage: "dealers" }),
    });
    tlRef.current = tl;

    // 6.1 — spin up fast (rim motion-blur reads through the notches)
    tl.to(anim, { freeSpin: 17, duration: 0.85, ease: "chip" }, 0);
    tl.to(anim, { camRoll: 0.1, duration: 0.85 }, 0); // dutch tilt
    tl.to(anim.cam, { x: -1.3, y: 0.95, z: 4.2, tx: 0, ty: 0.4, duration: 0.9 }, 0);
    tl.add(() => audio.play("spin"), 0);

    // tip onto its edge, hand the Y-spin off to the roll
    tl.to(anim, { freeSpin: 0, duration: 0.2 }, 0.85);
    tl.to(anim.chip, { rx: Math.PI / 2, y: 1.0, duration: 0.35, ease: "chip" }, 0.85);

    // 6.1 — edge-roll across the frame, decelerating (rolls about Z) + wobble
    tl.to(anim.chip, { rz: -Math.PI * 6, x: 3.4, duration: 1.8, ease: "power1.out" }, 1.2);
    tl.to(anim.chip, { ry: 0.45, duration: 0.9, yoyo: true, repeat: 1, ease: "sine.inOut" }, 1.2);
    tl.to(anim.cam, { x: 1.5, z: 5.0, duration: 1.8, ease: "power1.out" }, 1.2);
    tl.add(() => audio.play("roll", { rate: 1.5 }), 1.25);
    tl.add(() => audio.play("roll", { rate: 1.1 }), 2.1);

    // 6.2 — the coin settle: loses balance, spins flat with precession, then
    // rattles to rest. Hand-tuned damped model — reads as physics, not a snap.
    let baseRz = 0;
    const settle = { t: 0 };
    tl.to(anim.chip, { x: 0.3, duration: 1.0, ease: "power2.out" }, 3.0);
    tl.to(anim, { freeSpin: 11, duration: 0.01 }, 3.0); // re-arm flat precession
    tl.to(anim, { freeSpin: 0, duration: 1.5, ease: "power2.out" }, 3.0);
    tl.to(
      settle,
      {
        t: 1,
        duration: 1.6,
        ease: "none",
        onStart: () => {
          baseRz = anim.chip.rz;
        },
        onUpdate: () => {
          const T = settle.t;
          // tip from edge (rx=π/2) down to flat over the first third
          const fall = Math.min(1, T / 0.32);
          const fallE = 1 - Math.pow(1 - fall, 3);
          const baseY = 0.09 + (1.0 - 0.09) * Math.cos((fallE * Math.PI) / 2);
          // damped rattle once it's mostly down
          const rt = Math.max(0, (T - 0.28) / 0.72);
          const damp = Math.exp(-4.5 * rt);
          const w = rt * Math.PI * 8;
          anim.chip.rx = (Math.PI / 2) * (1 - fallE) + damp * 0.4 * Math.cos(w);
          anim.chip.rz = baseRz + damp * 0.17 * Math.cos(w + 1.3);
          anim.chip.y = baseY + damp * 0.04 * Math.abs(Math.cos(w));
        },
      },
      3.0
    );
    // rattle clacks at decreasing intervals, then the felt thud
    [0.0, 0.52, 0.78, 0.98, 1.12, 1.22].forEach((dt) =>
      tl.add(() => audio.play("clack"), 3.0 + dt)
    );
    tl.add(() => audio.play("thud"), 3.55);

    // 6.2 — crane up + pull back; the felt + rail assemble around the chip
    tl.to(anim, { camRoll: 0, table: 1, duration: 1.2, ease: "felt" }, 3.5);
    tl.to(
      anim.cam,
      { x: 0, y: 5.0, z: 7.6, tx: 0, ty: 0, tz: 0, duration: 1.5, ease: "power3.inOut" },
      3.7
    );
    tl.add(() => audio.startBed(), 3.9);

    // 6.3 — settle to the player's POV across the table
    tl.to(
      anim.cam,
      { x: 0, y: 3.4, z: 6.4, tx: 0, ty: 0.1, tz: -0.6, duration: 1.1, ease: "felt" },
      5.0
    );

    return () => {
      tl.kill();
    };
  }, [stage]);

  return (
    <>
      <color attach="background" args={["#0a0907"]} />
      <fog attach="fog" args={["#0a0907", 9, 22]} />
      <Lights />

      {/* Physically-based "rendered" lighting: an area-light environment whose
          studio panels reflect in the brass (image-based lighting, no HDR
          download) plus contact AO that grounds the chip — the ray-traced look
          at interactive frame rates. */}
      <Environment resolution={cap.lowPower ? 128 : 256}>
        <Lightformer
          intensity={2.4}
          position={[0, 6, -1]}
          scale={[12, 6, 1]}
          color="#ffd9a0"
        />
        <Lightformer
          intensity={1.3}
          position={[-6, 1.5, 3]}
          scale={[6, 8, 1]}
          color="#ff9d2f"
        />
        <Lightformer
          intensity={0.7}
          position={[6, 2, -4]}
          scale={[6, 8, 1]}
          color="#2e6cff"
        />
        <Lightformer
          form="ring"
          intensity={1.1}
          position={[0, 8, 0]}
          scale={5}
          color="#ffe2b0"
        />
      </Environment>

      <Chip ref={chipRef} />
      <Table ref={tableRef} />
      <ContactShadows
        position={[0, 0.01, 0]}
        scale={9}
        resolution={cap.lowPower ? 256 : 512}
        blur={2.4}
        opacity={0.55}
        far={3}
        color="#000000"
      />
      <Smoke />
      <Effects />
    </>
  );
}
