"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { logTime } from "@/lib/workspace/actions/time";
import { ActionForm, SubmitButton } from "@/components/workspace/ui/Form";
import { Button, Field, Input, Select, Textarea } from "@/components/workspace/ui/Primitives";

/**
 * A timer plus a manual box, sharing one submit. The timer only ever writes on
 * submit — no background job, no risk of a phantom entry from a closed tab.
 */
export default function TimeEntry({
  projects,
}: {
  projects: { id: string; name: string }[];
}) {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [minutes, setMinutes] = useState("");
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      tick.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (tick.current) {
      clearInterval(tick.current);
      tick.current = null;
    }
    return () => {
      if (tick.current) clearInterval(tick.current);
    };
  }, [running]);

  const timerMinutes = Math.max(1, Math.round(seconds / 60));
  const clock = [
    Math.floor(seconds / 3600),
    Math.floor((seconds % 3600) / 60),
    seconds % 60,
  ]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--ws-line)] p-3.5 text-center">
        <p className="mono text-2xl font-semibold tracking-tight">{clock}</p>
        <div className="mt-2.5 flex justify-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant={running ? "outline" : "primary"}
            onClick={() => setRunning((v) => !v)}
          >
            {running ? (
              <>
                <Pause size={12} /> Pause
              </>
            ) : (
              <>
                <Play size={12} /> {seconds ? "Resume" : "Start"}
              </>
            )}
          </Button>
          {seconds > 0 ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setRunning(false);
                  setSeconds(0);
                }}
              >
                <RotateCcw size={12} /> Reset
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  setRunning(false);
                  setMinutes(String(timerMinutes));
                }}
              >
                Use {timerMinutes}m
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <ActionForm
        action={logTime}
        className="space-y-3"
        onDone={() => {
          setMinutes("");
          setSeconds(0);
        }}
        resetOnSuccess
      >
        <Field label="Project">
          <Select name="project_id" required defaultValue="">
            <option value="" disabled>
              Pick one…
            </option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Minutes">
            <Input
              type="number"
              name="minutes"
              min={1}
              max={1440}
              required
              className="mono"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="45"
            />
          </Field>
          <Field label="Date">
            <Input
              type="date"
              name="logged_date"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
          </Field>
        </div>

        <Field label="Note">
          <Textarea name="note" rows={2} placeholder="What you worked on." />
        </Field>

        <SubmitButton className="w-full" pendingLabel="Logging…">
          Log time
        </SubmitButton>
      </ActionForm>
    </div>
  );
}
