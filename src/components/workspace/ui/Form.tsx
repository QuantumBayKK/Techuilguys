"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { clsx } from "clsx";
import { IDLE, type ActionState } from "@/lib/workspace/action-utils";
import { Button, buttonClass } from "./Primitives";

type Action = (state: ActionState, form: FormData) => Promise<ActionState>;

/**
 * Every mutation in the workspace goes through this: one server action, one
 * pending state, one place errors surface. Keeps ~30 forms from each inventing
 * their own loading and error handling.
 */
export function ActionForm({
  action,
  children,
  className,
  onDone,
  resetOnSuccess,
}: {
  action: Action;
  children: ReactNode | ((state: ActionState) => ReactNode);
  className?: string;
  onDone?: (state: ActionState) => void;
  resetOnSuccess?: boolean;
}) {
  const [state, dispatch] = useActionState<ActionState, FormData>(
    async (prev, form) => {
      const next = await action(prev, form);
      if (next?.ok) onDone?.(next);
      return next;
    },
    IDLE,
  );

  return (
    <form
      action={dispatch}
      className={className}
      key={resetOnSuccess && state?.ok ? state.message : undefined}
    >
      {typeof children === "function" ? children(state) : children}
      <FormFeedback state={state} />
    </form>
  );
}

export function FormFeedback({ state }: { state: ActionState }) {
  if (!state?.error && !state?.message) return null;

  return (
    <p
      role={state.error ? "alert" : "status"}
      className={clsx(
        "mt-2.5 text-xs",
        state.error ? "text-[var(--ws-red)]" : "text-[var(--ws-green)]",
      )}
    >
      {state.error ?? state.message}
    </p>
  );
}

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
  size = "md",
  className,
  ...rest
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: Parameters<typeof buttonClass>[0];
  size?: Parameters<typeof buttonClass>[1];
  className?: string;
} & Omit<React.ComponentPropsWithoutRef<"button">, "children">) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant={variant}
      size={size}
      disabled={pending}
      className={className}
      {...rest}
    >
      {pending ? (pendingLabel ?? "Working…") : children}
    </Button>
  );
}

/**
 * A form that is a single button — status flips, deletes, approvals. Submits on
 * click with hidden fields for context.
 */
export function QuickForm({
  action,
  fields,
  children,
  variant = "outline",
  size = "sm",
  pendingLabel,
  className,
  confirm,
}: {
  action: Action;
  fields: Record<string, string | number | boolean | null | undefined>;
  children: ReactNode;
  variant?: Parameters<typeof buttonClass>[0];
  size?: Parameters<typeof buttonClass>[1];
  pendingLabel?: string;
  className?: string;
  confirm?: string;
}) {
  const [state, dispatch] = useActionState<ActionState, FormData>(action, IDLE);

  return (
    <form
      action={dispatch}
      className={clsx("inline-block", className)}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) =>
        value === null || value === undefined ? null : (
          <input key={name} type="hidden" name={name} value={String(value)} />
        ),
      )}
      <SubmitButton variant={variant} size={size} pendingLabel={pendingLabel}>
        {children}
      </SubmitButton>
      {state?.error ? (
        <span role="alert" className="ml-2 text-xs text-[var(--ws-red)]">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
