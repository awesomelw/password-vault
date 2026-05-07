"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type SubmitEvent, useEffect, useState } from "react";
import ProtectedPage from "@/components/ProtectedPage";
import { checkBackendAuth } from "@/lib/api/authCheck";
import {
  createVaultItem,
  getVaultItems,
  type VaultItem,
} from "@/lib/api/vaultApi";
import { logOut } from "@/lib/auth/clientAuth";
import { encryptPassword } from "@/lib/crypto/vaultCrypto";

const accessControls = ["Reveal", "Copy username", "Copy password"];
const managementControls = ["Add", "Edit", "Delete"];

export default function VaultPage() {
  const router = useRouter();
  const [backendAuthStatus, setBackendAuthStatus] = useState("Checking backend...");
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState("");
  const [service, setService] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [addFormStatus, setAddFormStatus] = useState("");
  const [addFormError, setAddFormError] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    async function loadVault() {
      try {
        // Confirms the backend can verify the logged-in Firebase user.
        const user = await checkBackendAuth();
        setBackendAuthStatus(`Backend verified ${user.email ?? user.uid}`);

        // Loads encrypted vault records owned by the verified user.
        const data = await getVaultItems();
        setVaultItems(data.items);
      } catch {
        setBackendAuthStatus("Backend verification failed.");
        setItemsError("Unable to load vault records.");
      } finally {
        setIsLoadingItems(false);
      }
    }

    loadVault();
  }, []);

  async function handleLogout() {
    // Signs out through Firebase before leaving the vault page.
    await logOut();
    router.push("/login");
  }

  async function handleAddPassword(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddFormStatus("");
    setAddFormError("");

    // Validates the required vault fields before encrypting anything.
    if (!service.trim() || !username.trim() || !password) {
      setAddFormError("Service, username, and password are required.");
      return;
    }

    setIsSavingPassword(true);

    try {
      // Encrypts the password in the browser before sending it to the backend.
      const encryptedValue = await encryptPassword(password);

      // Sends only encrypted password data to the Firestore-backed API route.
      await createVaultItem({
        service,
        username,
        notes,
        encryptedPassword: encryptedValue.encryptedPassword,
        passwordIv: encryptedValue.passwordIv,
      });

      const data = await getVaultItems();
      setVaultItems(data.items);
      setService("");
      setUsername("");
      setPassword("");
      setNotes("");
      setAddFormStatus("Password saved.");
    } catch {
      setAddFormError("Unable to save password.");
    } finally {
      setIsSavingPassword(false);
    }
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
              <div>
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">
                    Vault
                  </p>
                  <h1 className="mt-2 text-3xl font-semibold">
                    Saved passwords
                  </h1>
                </div>
              </div>

              {/* Add-password form that encrypts before saving. */}
              <form
                className="mt-6 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
                onSubmit={handleAddPassword}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-medium text-zinc-700">
                      Service
                    </span>
                    <input
                      type="text"
                      value={service}
                      onChange={(event) => setService(event.target.value)}
                      placeholder="GitHub"
                      className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-zinc-700">
                      Username
                    </span>
                    <input
                      type="text"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      placeholder="you@example.com"
                      className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-zinc-700">
                      Password
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Password to encrypt"
                      className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium text-zinc-700">
                      Notes
                    </span>
                    <input
                      type="text"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Optional note"
                      className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
                    />
                  </label>
                </div>

                <div className="mt-5">
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="rounded-md bg-emerald-500 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:text-zinc-100"
                  >
                    {isSavingPassword ? "Saving..." : "Save password"}
                  </button>
                </div>

                {addFormError ? (
                  <p className="mt-4 text-sm font-medium text-red-600">
                    {addFormError}
                  </p>
                ) : null}

                {addFormStatus ? (
                  <p className="mt-4 text-sm font-medium text-zinc-600">
                    {addFormStatus}
                  </p>
                ) : null}

              </form>

              {isLoadingItems ? (
                <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 text-sm font-medium text-zinc-600 shadow-sm">
                  Loading vault records...
                </div>
              ) : itemsError ? (
                <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700 shadow-sm">
                  {itemsError}
                </div>
              ) : vaultItems.length ? (
                // Shows safe record fields while encrypted password display is still pending.
                <div className="mt-8 grid gap-3">
                  {vaultItems.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
                    >
                      <h2 className="text-lg font-semibold">
                        {item.service}
                      </h2>
                      <p className="mt-2 text-sm text-zinc-600">
                        {item.username}
                      </p>
                      {item.notes ? (
                        <p className="mt-3 text-sm text-zinc-500">
                          {item.notes}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                // Empty state shown when the user has no saved vault records.
                <div className="mt-8 rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center shadow-sm">
                  <h2 className="text-xl font-semibold">
                    No passwords saved yet
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600">
                    Once encrypted records are added, saved logins will appear
                    here with controls to reveal, copy, edit, or delete each
                    record.
                  </p>
                </div>
              )}
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
