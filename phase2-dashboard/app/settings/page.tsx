import type { Metadata } from "next";
import { Sidebar } from "@/components/sidebar";
import { SettingsForm } from "@/components/settings-form";

// Server Component shell, consistent with the Pipeline/Invoices/Deal pages: it
// renders the sidebar + main layout and hands interactivity to the client
// `SettingsForm`, which loads/saves through `/api/preferences`. Preferences are
// per-user and request-time, so this page is not statically prerendered.
export const metadata: Metadata = {
  title: "Settings — Biz Bricks Ops",
  description: "Personal dashboard preferences.",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1180px]">
      <Sidebar />

      <main className="flex-1 bg-cream px-[26px] py-[22px]">
        <div className="mb-5">
          <h2 className="font-display text-2xl font-extrabold tracking-[-0.02em] text-ink">
            Settings
          </h2>
          <div className="mt-[3px] text-[0.84rem] text-gray-mid">
            Personal preferences · saved automatically
          </div>
        </div>

        <div className="max-w-[560px]">
          <SettingsForm />
        </div>
      </main>
    </div>
  );
}
