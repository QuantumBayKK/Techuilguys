"use client";

import { useEffect } from "react";

/**
 * #E — turns the shared custom cursor into a spinning poker chip while on
 * /reborn (and only here). Toggles a body class the global Cursor's ring reacts
 * to via CSS, so the `/` cursor is untouched. No-op on touch (no cursor).
 */
export default function RebornCursorSkin() {
  useEffect(() => {
    document.body.classList.add("reborn-route");
    return () => document.body.classList.remove("reborn-route");
  }, []);
  return null;
}
