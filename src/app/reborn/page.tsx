"use client";

import RebornHero from "@/components/reborn/RebornHero";
import Manifesto from "@/components/reborn/Manifesto";
import DeckReel from "@/components/reborn/DeckReel";
import WorksIndex from "@/components/reborn/WorksIndex";
import Dealers from "@/components/reborn/Dealers";
import TheTell from "@/components/reborn/TheTell";
import DragHand from "@/components/reborn/DragHand";
import ContactLounge from "@/components/reborn/ContactLounge";
import AmbientBackdrop from "@/components/reborn/AmbientBackdrop";
import CursorGlow from "@/components/reborn/CursorGlow";
import FallingCards from "@/components/reborn/FallingCards";
import RebornAudio from "@/components/reborn/RebornAudio";
import SuitTrail from "@/components/reborn/SuitTrail";
import KonamiJackpot from "@/components/reborn/KonamiJackpot";
import WeirdBackground from "@/components/reborn/WeirdBackground";
import VelocitySkew from "@/components/reborn/VelocitySkew";
import RebornIntro from "@/components/reborn/RebornIntro";
import ChapterRail from "@/components/reborn/ChapterRail";
import Marquee from "@/components/ui/Marquee";
import InspectCard from "@/components/cards/InspectCard";
import RebornCursorSkin from "@/components/reborn/RebornCursorSkin";
import SuitShortcuts from "@/components/reborn/SuitShortcuts";
import RackTop from "@/components/reborn/RackTop";
import ChipScrollProgress from "@/components/reborn/ChipScrollProgress";

/**
 * /reborn — the complete rework. A single cinematic-editorial scroll (Luke
 * Baffait inspo, heavy 21st.dev): shader hero → kinetic manifesto → the deck as
 * a hover-preview index → the two dealers → the lounge close. The poker concept
 * is kept to a whisper (suits, ranks, "the deck"); no card-pick gimmick. The
 * original experience still lives at `/`.
 */
export default function RebornPage() {
  return (
    <main className="relative z-10">
      {/* curtain on entry, chapter index + chip progress + keyboard nav */}
      <RebornIntro />
      <ChapterRail />
      <ChipScrollProgress />
      <SuitShortcuts />
      <RackTop />

      {/* scroll-reactive room: shifting light + cursor pool + falling cards */}
      <AmbientBackdrop />
      <WeirdBackground />
      <CursorGlow />
      <FallingCards />

      {/* the human-hand layer: a coffee-ring that dried on the felt, chip cursor */}
      <RebornCursorSkin />
      <span className="coffee-ring" style={{ left: "8vw", bottom: "18vh" }} aria-hidden />

      {/* sound, cursor trail, and the easter egg */}
      <RebornAudio />
      <SuitTrail />
      <KonamiJackpot />

      <RebornHero />
      <VelocitySkew>
        <Manifesto />
      </VelocitySkew>
      <DeckReel />
      <VelocitySkew>
        <WorksIndex />
      </VelocitySkew>
      <Marquee text="Web & App Dev · Product Design · AI Systems · Automation · Payments · Cybersecurity · Blockchain · Internal Tools" />
      <DragHand />
      <Dealers />
      <TheTell />
      <ContactLounge />
      <InspectCard />
    </main>
  );
}
