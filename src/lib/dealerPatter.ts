/**
 * The dealer's voice. One small copy bank so every bit of microcopy on the site
 * — the loader, empty states, tooltips, the idle whisper, the time-of-day
 * greeting — sounds like the same person running the table. Keeping it here (not
 * scattered in components) is what makes the personality feel authored rather
 * than decorative.
 *
 * Idea map: #72 shuffle loader · #73 empty states · #74 tooltips-as-tells
 * · #78 idle whisper · #94 first-vs-returning · #100 time-of-day greeting.
 */

/** #72 — loader patter. Cycled while the deck "shuffles" in. */
export const SHUFFLE_LINES = [
  "Cutting the deck…",
  "Counting the pot…",
  "Shuffling up…",
  "Stacking the chips…",
  "Reading the room…",
  "Last call…",
] as const;

/** #73 — empty-state copy in the dealer's voice. */
export const EMPTY_STATES = {
  noProjects: "Table’s open. No players yet — deal’s coming.",
  noResults: "Folded every hand. Nothing matched.",
  offline: "Lights are out at the lounge. Back when the power’s on.",
} as const;

/** #74 — tooltips written as poker tells, keyed by a short slug. */
export const TELLS: Record<string, string> = {
  email: "Slide your chips in — let’s talk.",
  github: "Peek the hole cards.",
  linkedin: "Working the table.",
  mute: "Kill the room tone.",
  unmute: "Bring the room back.",
  inspect: "Turn the card over.",
  back: "Muck it — back to the felt.",
  deal: "Tap to be dealt in.",
  home: "Back to the table.",
};

/** #78 — quiet lines that surface after the cursor sits idle. */
export const IDLE_WHISPERS = [
  "Your move.",
  "Still in?",
  "The cards are waiting.",
  "Dealer’s got time.",
] as const;

/** #75 — playful form validation (a wrong email is "a bluff"). */
export const BLUFF_LINES = [
  "Bluffing? That address doesn’t add up.",
  "Can’t call that — check the email.",
  "That’s a tell. Real address?",
] as const;

export type TimeBand = "lateNight" | "morning" | "afternoon" | "evening";

/** Bucket a local hour [0..23] into a mood band. */
export function timeBand(hour: number): TimeBand {
  if (hour < 5) return "lateNight";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

/**
 * #94 + #100 — greeting that adapts to the VISITOR's local time and whether
 * they've been dealt in before. `returning` comes from localStorage upstream so
 * this stays a pure function (easy to render on the server-safe path).
 */
export function greeting(hour: number, returning: boolean): string {
  const band = timeBand(hour);
  if (returning) {
    switch (band) {
      case "lateNight":
        return "Back at this hour? Pull up a chair.";
      case "morning":
        return "Back for another hand — coffee’s on the rail.";
      case "afternoon":
        return "Welcome back to the table.";
      case "evening":
        return "Back for the evening session. Good.";
    }
  }
  switch (band) {
    case "lateNight":
      return "Burning the midnight oil? Welcome to the table.";
    case "morning":
      return "Early bird. Welcome to the table.";
    case "afternoon":
      return "Welcome to the table.";
    case "evening":
      return "Evening. The good seats just opened up.";
  }
}
