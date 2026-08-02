/** Plain form post — no JS needed, and immune to prefetch-triggered sign-outs. */
export default function SignOutButton({
  className = "font-semibold text-[var(--ws-muted)] hover:text-[var(--ws-accent)]",
  label = "Sign out",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <form action="/workspace/auth/signout" method="post" className="inline">
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
