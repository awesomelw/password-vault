"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ProtectedPage from "@/components/ProtectedPage";
import AddPasswordForm from "@/components/vault/AddPasswordForm";
import VaultItemCard from "@/components/vault/VaultItemCard";
import { checkBackendAuth } from "@/lib/api/authCheck";
import { getVaultItems, type VaultItem } from "@/lib/api/vaultApi";
import { logOut } from "@/lib/auth/clientAuth";

export default function VaultPage() {
  return (
    <ProtectedPage>
      <VaultWorkspace />
    </ProtectedPage>
  );
}

// run vault data loading only after protectedpage confirms the session
function VaultWorkspace() {
  const router = useRouter();
  const [vaultItems, setVaultItems] = useState<VaultItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState("");

  async function refreshVaultItems() {
    // refresh the visible list after a vault record changes
    const data = await getVaultItems();
    setVaultItems(data.items);
    setItemsError("");
  }

  useEffect(() => {
    async function loadVault() {
      try {
        // confirm the backend accepts this signed-in firebase session
        await checkBackendAuth();

        // load encrypted records owned by the verified user
        await refreshVaultItems();
      } catch {
        setItemsError("We could not load your vault. Try refreshing the page.");
      } finally {
        setIsLoadingItems(false);
      }
    }

    loadVault();
  }, []);

  async function handleLogout() {
    // end the firebase session before returning to login
    await logOut();
    router.push("/login");
  }

  return (
    // private dashboard for encrypted vault records
    <main className="min-h-screen bg-zinc-100 text-zinc-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        {/* private app navigation for logged-in users */}
        <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="text-lg font-semibold">
              Password Vault
            </Link>
            <p className="mt-1 text-sm text-zinc-600">
              Manage saved logins from one private workspace.
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

        <div className="flex-1 py-8">
          <section>
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-emerald-700">
                Vault
              </p>
              <h1 className="mt-2 text-3xl font-semibold">Saved passwords</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-zinc-600">
                Store, update, and copy login details from your encrypted vault.
              </p>
            </div>

            <AddPasswordForm onPasswordCreated={refreshVaultItems} />

            {isLoadingItems ? (
              <div className="mt-8 rounded-lg border border-zinc-200 bg-white p-6 text-sm font-medium text-zinc-600 shadow-sm">
                Loading saved passwords...
              </div>
            ) : itemsError ? (
              <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700 shadow-sm">
                {itemsError}
              </div>
            ) : vaultItems.length ? (
              <div className="mt-8 grid gap-3">
                {vaultItems.map((item) => (
                  <VaultItemCard
                    key={item.id}
                    item={item}
                    onVaultItemDeleted={refreshVaultItems}
                    onVaultItemUpdated={refreshVaultItems}
                  />
                ))}
              </div>
            ) : (
              // empty state for users who have not saved any records yet
              <div className="mt-8 rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center shadow-sm">
                <h2 className="text-xl font-semibold">
                  No passwords saved yet
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600">
                  Add your first login above. Saved records will appear here
                  with controls to reveal, copy, edit, or delete each entry.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
