import { requireSession } from "@/lib/workspace/session";
import { Card, CardHeader, PageHeader } from "@/components/workspace/ui/Primitives";
import SignOutButton from "@/components/workspace/SignOutButton";
import ProfileForm from "./ProfileForm";

export const metadata = { title: "Settings — Workspace" };

export default async function SettingsPage() {
  const session = await requireSession();

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Settings" />

      <Card>
        <CardHeader title="Your profile" hint={session.profile.email} />
        <div className="p-5">
          <ProfileForm profile={session.profile} />
        </div>
      </Card>

      <Card className="mt-5">
        <CardHeader title="Access" />
        <div className="space-y-1.5 p-5 text-[13px]">
          <p>
            <span className="text-[var(--ws-muted)]">Role:</span>{" "}
            <span className="capitalize">{session.profile.role}</span>
          </p>
          <p className="text-xs leading-relaxed text-[var(--ws-muted)]">
            Roles and organization links are set by an admin — they can&apos;t be
            changed from here, and a database trigger reverts any attempt to.
          </p>
        </div>
      </Card>

      <div className="mt-6">
        <SignOutButton className="rounded-lg border border-[var(--ws-line-strong)] px-3.5 py-2 text-[13px] font-semibold hover:bg-[var(--ws-hover)]" />
      </div>
    </div>
  );
}
