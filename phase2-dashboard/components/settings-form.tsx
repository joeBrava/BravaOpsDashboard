"use client";

import { useEffect, useRef, useState } from "react";
import type { Preferences } from "@/lib/prefs/store";

/**
 * Settings form (client component) bound to `/api/preferences`.
 *
 * Lifecycle:
 *  - On mount, GET the signed-in user's saved preferences and populate the form.
 *  - On every change to an enabled control, optimistically update local state and
 *    PUT the full preference set back. A short-lived "Saved" toast confirms each
 *    successful write; failures surface an inline error and don't clear state.
 *
 * The notification toggles (digest, alerts) are intentionally rendered but
 * DISABLED and labeled "Arrives with Phase 1" — Phase 1 (n8n payments + Slack)
 * is out of scope, so these controls are inert. We still send their (default,
 * false) values in the PUT so the stored record stays complete and valid.
 *
 * This is the only `'use client'` boundary for `/settings`; the page shell that
 * renders it (and the sidebar) stays a Server Component.
 */

/** Sensible defaults so the form has a coherent shape before the GET resolves. */
const INITIAL: Preferences = {
  defaultView: "mine",
  theme: "system",
  density: "comfortable",
  notifyDigest: false,
  notifyAlerts: false,
};

type SaveState = "idle" | "saving" | "saved" | "error";

const DEFAULT_VIEW_OPTIONS: { value: Preferences["defaultView"]; label: string }[] = [
  { value: "mine", label: "My pipeline" },
  { value: "all", label: "All team" },
];
const THEME_OPTIONS: { value: Preferences["theme"]; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];
const DENSITY_OPTIONS: { value: Preferences["density"]; label: string }[] = [
  { value: "comfortable", label: "Comfortable" },
  { value: "compact", label: "Compact" },
];

export function SettingsForm() {
  const [prefs, setPrefs] = useState<Preferences>(INITIAL);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load saved preferences on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/preferences", { cache: "no-store" });
        if (!res.ok) throw new Error(`GET /api/preferences → ${res.status}`);
        const data = (await res.json()) as Preferences;
        if (!cancelled) setPrefs(data);
      } catch {
        if (!cancelled) setLoadError("Could not load your settings. Showing defaults.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Clear the pending toast timer on unmount.
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // Apply a change and persist the full preference set.
  async function update<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    const next: Preferences = { ...prefs, [key]: value };
    setPrefs(next);
    setSaveState("saving");
    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      if (!res.ok) throw new Error(`PUT /api/preferences → ${res.status}`);
      setSaveState("saved");
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setSaveState("idle"), 2200);
    } catch {
      setSaveState("error");
    }
  }

  return (
    <div className="relative">
      {loadError && (
        <p className="mb-4 rounded-[13px] border border-[#f4c7b0] bg-[#fdeee4] px-4 py-3 text-[0.82rem] font-medium text-[#9a4a17]">
          {loadError}
        </p>
      )}

      <div
        aria-busy={loading}
        className={`flex flex-col gap-[18px] transition-opacity ${
          loading ? "opacity-60" : "opacity-100"
        }`}
      >
        <FieldGroup
          title="Default view"
          help="Which slice of the pipeline opens first."
        >
          <SegmentedControl
            name="defaultView"
            value={prefs.defaultView}
            options={DEFAULT_VIEW_OPTIONS}
            disabled={loading}
            onSelect={(v) => update("defaultView", v)}
          />
        </FieldGroup>

        <FieldGroup title="Theme" help="Colour scheme for the dashboard.">
          <SegmentedControl
            name="theme"
            value={prefs.theme}
            options={THEME_OPTIONS}
            disabled={loading}
            onSelect={(v) => update("theme", v)}
          />
        </FieldGroup>

        <FieldGroup title="Density" help="Spacing of card lists.">
          <SegmentedControl
            name="density"
            value={prefs.density}
            options={DENSITY_OPTIONS}
            disabled={loading}
            onSelect={(v) => update("density", v)}
          />
        </FieldGroup>

        <FieldGroup
          title="Notifications"
          help="Daily digest and real-time alerts."
        >
          <div className="flex flex-col gap-[10px]">
            <ToggleRow
              label="Daily digest"
              checked={prefs.notifyDigest}
              badge="Arrives with Phase 1"
            />
            <ToggleRow
              label="Real-time alerts"
              checked={prefs.notifyAlerts}
              badge="Arrives with Phase 1"
            />
          </div>
        </FieldGroup>
      </div>

      {/* Save confirmation — a visible, transient toast on every successful write. */}
      <div aria-live="polite" className="pointer-events-none fixed bottom-6 right-6 z-10">
        {saveState === "saved" && (
          <div className="flex items-center gap-[8px] rounded-[13px] border border-[#e2ea9e] bg-[#f1f5ce] px-4 py-3 text-[0.84rem] font-semibold text-[#5c6a00] shadow-sm">
            <span aria-hidden="true">✓</span> Saved
          </div>
        )}
        {saveState === "error" && (
          <div className="flex items-center gap-[8px] rounded-[13px] border border-[#f5b5bd] bg-[#ffe1e5] px-4 py-3 text-[0.84rem] font-semibold text-[#c20f2b] shadow-sm">
            <span aria-hidden="true">!</span> Couldn’t save — try again
          </div>
        )}
      </div>
    </div>
  );
}

function FieldGroup({
  title,
  help,
  children,
}: {
  title: string;
  help: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[15px] border border-[#eee8df] bg-white px-[18px] py-[16px]">
      <div className="mb-3">
        <h3 className="font-display text-base font-bold text-ink">{title}</h3>
        <p className="mt-[2px] text-[0.8rem] text-gray-mid">{help}</p>
      </div>
      {children}
    </section>
  );
}

function SegmentedControl<T extends string>({
  name,
  value,
  options,
  disabled,
  onSelect,
}: {
  name: string;
  value: T;
  options: { value: T; label: string }[];
  disabled?: boolean;
  onSelect: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={name} className="flex flex-wrap gap-[7px]">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() => onSelect(opt.value)}
            className={`rounded-full px-[14px] py-[6px] font-display text-[0.76rem] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              active
                ? "border border-purple bg-purple text-white"
                : "border border-[#ebe6dd] bg-white text-gray-dark hover:border-purple/40"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * A single notification preference row. Always rendered DISABLED with the
 * "Arrives with Phase 1" badge — the control is present for layout/expectation
 * but inert until Phase 1 ships.
 */
function ToggleRow({
  label,
  checked,
  badge,
}: {
  label: string;
  checked: boolean;
  badge: string;
}) {
  return (
    <label className="flex cursor-not-allowed items-center justify-between gap-3 rounded-[11px] border border-[#f0ece4] bg-[#faf8f3] px-[14px] py-[11px]">
      <span className="flex items-center gap-[10px]">
        <input
          type="checkbox"
          checked={checked}
          disabled
          readOnly
          aria-label={label}
          className="h-[16px] w-[16px] accent-purple"
        />
        <span className="text-[0.86rem] font-medium text-gray-dark">{label}</span>
      </span>
      <span className="rounded-full bg-[#efe7fb] px-[9px] py-[3px] text-[0.66rem] font-semibold uppercase tracking-[0.04em] text-purple">
        {badge}
      </span>
    </label>
  );
}
