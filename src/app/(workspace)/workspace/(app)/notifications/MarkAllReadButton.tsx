"use client";

import { useTransition } from "react";
import { markNotificationsRead } from "@/lib/workspace/actions/requests";
import { Button } from "@/components/workspace/ui/Primitives";

export default function MarkAllReadButton() {
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      disabled={pending}
      onClick={() => start(() => void markNotificationsRead())}
    >
      {pending ? "Marking…" : "Mark all read"}
    </Button>
  );
}
