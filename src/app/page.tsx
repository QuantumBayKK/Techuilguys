"use client";

import IntroPick from "@/components/IntroPick";
import HandAct from "@/components/sections/HandAct";
import DeckGallery from "@/components/sections/DeckGallery";
import LoungeAct from "@/components/sections/LoungeAct";
import InspectCard from "@/components/cards/InspectCard";
import { useExperience } from "@/lib/experience";

/**
 * One scroll story. The full-screen loader (chip → shatter → two dealer cards)
 * IS the pick; choosing a dealer mounts the hand + the lounge underneath and
 * dismisses the loader to reveal them.
 */
export default function Home() {
  const { dealer } = useExperience();

  return (
    <main className="relative z-10">
      <IntroPick />
      {dealer && (
        <>
          <HandAct dealer={dealer} />
          <DeckGallery />
          <LoungeAct />
        </>
      )}
      <InspectCard />
    </main>
  );
}
