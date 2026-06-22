"use client";

import TitleAct from "@/components/sections/TitleAct";
import PickAct from "@/components/sections/PickAct";
import HandAct from "@/components/sections/HandAct";
import LoungeAct from "@/components/sections/LoungeAct";
import InspectCard from "@/components/cards/InspectCard";
import { useExperience } from "@/lib/experience";

/**
 * One scroll story, four acts. Title → Pick (the single click) → the dealt
 * hand → the lounge. The hand + lounge only mount once a dealer is chosen, so
 * scroll naturally rests at the pick until the visitor decides.
 */
export default function Home() {
  const { dealer } = useExperience();

  return (
    <main className="relative z-10">
      <TitleAct />
      <PickAct />
      {dealer && (
        <>
          <HandAct dealer={dealer} />
          <LoungeAct />
        </>
      )}
      <InspectCard />
    </main>
  );
}
