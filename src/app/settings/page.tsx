"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProtectedPage from "@/components/ProtectedPage";
import {
  DEFAULT_INACTIVITY_TIMEOUT_MINUTES,
  INACTIVITY_TIMEOUT_OPTIONS,
  getStoredInactivityTimeout,
  saveInactivityTimeout,
} from "@/lib/settings/inactivity";

export default function SettingsPage() {
  const [selectedTimeout, setSelectedTimeout] = useState(
    // Initializes from browser storage once this client component runs.
    () =>
      typeof window === "undefined"
        ? DEFAULT_INACTIVITY_TIMEOUT_MINUTES
        : getStoredInactivityTimeout(),
  );
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!status) {
      return;
    }

    // Clears the saved message after the user sees it.
    const timeoutId = window.setTimeout(() => {
      setStatus("");
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [status]);

  function handleSaveSettings() {
    // Saves the timeout choice used by protected pages.
    saveInactivityTimeout(selectedTimeout);
    setStatus("Settings saved.");
  }

  return (
    <ProtectedPage>
      {/* Settings page for vault security preferences. */}
      <main className="min-h-screen bg-zinc-100 px-6 py-8 text-zinc-950">
        <section className="mx-auto w-full max-w-3xl">
          {/* Back link returns users to the vault workspace. */}
          <Link
            href="/vault"
            className="text-sm font-medium text-zinc-600 transition hover:text-zinc-950"
          >
            Back to vault
          </Link>

          <div className="mt-6 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">
              Settings
            </p>
            <h1 className="mt-2 text-3xl font-semibold">Vault preferences</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">
              Choose how long the vault can stay idle before it locks.
            </p>

            {/* Timeout options used by the inactivity logout hook. */}
            <fieldset className="mt-8">
              <legend className="text-sm font-semibold text-zinc-900">
                Auto-lock timer
              </legend>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {INACTIVITY_TIMEOUT_OPTIONS.map((option) => (
                  <label
                    key={option}
                    className="flex cursor-pointer items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-white"
                  >
                    <input
                      type="radio"
                      name="timeout"
                      value={option}
                      checked={selectedTimeout === option}
                      onChange={() => setSelectedTimeout(option)}
                      className="h-4 w-4 accent-emerald-500"
                    />
                    {option} minutes
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="button"
              onClick={handleSaveSettings}
              className="mt-8 rounded-md bg-zinc-950 px-4 py-3 font-semibold text-white transition hover:bg-zinc-800"
            >
              Save settings
            </button>

            {status ? (
              <p className="mt-4 text-sm font-medium text-emerald-700">
                {status}
              </p>
            ) : null}
          </div>
        </section>
      </main>
    </ProtectedPage>
  );
}
