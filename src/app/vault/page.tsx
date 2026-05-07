"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProtectedPage from "@/components/ProtectedPage";
import { checkBackendAuth } from "@/lib/api/authCheck";
import { logOut } from "@/lib/auth/clientAuth";

const accessControls = ["Reveal", "Copy username", "Copy password"];
const managementControls = ["Add", "Edit", "Delete"];

export default function VaultPage() {
  const router = useRouter();
  const [backendAuthStatus, setBackendAuthStatus] = useState("Checking backend...");

  useEffect(() => {
    // Confirms the backend can verify the logged-in Firebase user.
    checkBackendAuth()
      .then((user) => {
        setBackendAuthStatus(`Backend verified ${user.email ?? user.uid}`);
      })
      .catch(() => {
        setBackendAuthStatus("Backend verification failed.");
      });
  }, []);

  async function handleLogout() {
    // Signs out through Firebase before leaving the vault page.
    await logOut();
    router.push("/login");
  }

  return (
    <ProtectedPage>
      {/* Vault dashboard shell before Firestore data is connected. */}
      <main className="min-h-screen bg-zinc-100 text-zinc-950">
        <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 sm:px-8 lg:px-10">
          {/* Private app navigation for logged-in users. */}
          <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link href="/" className="text-lg font-semibold">
                Password Vault
              </Link>
              <p className="mt-1 text-sm text-zinc-600">
                Manage saved logins from one private workspace.
              </p>
              <p className="mt-2 text-xs font-medium text-emerald-700">
                {backendAuthStatus}
              </p>
            </div>

            <nav className="flex items-center gap-3 text-sm">
              <Link
                href="/settings"
                className="rounded-md border border-zinc-300 px-3 py-2 font-medium text-zinc-700 transition hover:bg-white"
              >
                Settings
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md bg-zinc-950 px-3 py-2 font-medium text-white transition hover:bg-zinc-800"
              >
                Log out
              </button>
            </nav>
          </header>

          <div className="grid flex-1 gap-6 py-8 lg:grid-cols-[1fr_18rem]">
            <section>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">
                    Vault
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold">
                    Saved passwords
                  </h1>
                </div>

                <button
                  type="button"
                  className="rounded-md bg-emerald-500 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400"
                >
                  Add password
                </button>
              </div>

              {/* Empty state until real vault records are loaded. */}
              <div className="mt-8 rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center shadow-sm">
                <h2 className="text-xl font-semibold">
                  No passwords saved yet
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600">
                  Once Firestore is connected, saved logins will appear here
                  with controls to reveal, copy, edit, or delete each record.
                </p>
              </div>
            </section>

            {/* Summary panel for the dashboard controls we will wire later. */}
            <aside className="h-fit rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-zinc-900">
                Planned controls
              </p>

              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Access
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {accessControls.map((action) => (
                    <span
                      key={action}
                      className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800"
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  Manage
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {managementControls.map((action) => (
                    <span
                      key={action}
                      className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700"
                    >
                      {action}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-zinc-600">
                This page will become the main workspace after vault records are
                connected.
              </p>
            </aside>
          </div>
        </section>
      </main>
    </ProtectedPage>
  );
}
