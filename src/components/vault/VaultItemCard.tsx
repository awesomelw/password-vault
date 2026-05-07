"use client";

import { useState } from "react";
import { deleteVaultItem, type VaultItem } from "@/lib/api/vaultApi";
import { decryptPassword } from "@/lib/crypto/vaultCrypto";

type VaultItemCardProps = {
  item: VaultItem;
  onVaultItemDeleted: () => Promise<void>;
};

export default function VaultItemCard({
  item,
  onVaultItemDeleted,
}: VaultItemCardProps) {
  const [revealedPassword, setRevealedPassword] = useState("");
  const [revealError, setRevealError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [deleteStatus, setDeleteStatus] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleTogglePassword() {
    setRevealError("");

    if (revealedPassword) {
      // Hide: remove the revealed password from this card's state.
      setRevealedPassword("");
      return;
    }

    try {
      // Show: decrypt this password in the browser for temporary display.
      const decrypted = await decryptPassword(
        item.encryptedPassword,
        item.passwordIv,
      );

      setRevealedPassword(decrypted);
    } catch {
      setRevealError("Unable to reveal password.");
    }
  }

  async function handleCopyUsername() {
    try {
      // Copy username: send the saved username directly to the clipboard.
      await navigator.clipboard.writeText(item.username);
      setCopyStatus("Username copied.");
    } catch {
      setCopyStatus("Unable to copy username.");
    }
  }

  async function handleCopyPassword() {
    try {
      // Copy password: reuse a visible password or decrypt it before copying.
      const passwordToCopy =
        revealedPassword ||
        (await decryptPassword(item.encryptedPassword, item.passwordIv));

      await navigator.clipboard.writeText(passwordToCopy);
      setCopyStatus("Password copied.");
    } catch {
      setCopyStatus("Unable to copy password.");
    }
  }

  async function handleDelete() {
    setDeleteStatus("");
    setIsDeleting(true);

    try {
      // Delete: remove this record from the user's Firestore vault collection.
      await deleteVaultItem(item.id);
      await onVaultItemDeleted();
    } catch {
      setDeleteStatus("Unable to delete password.");
      setIsDeleting(false);
    }
  }

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{item.service}</h2>
      <p className="mt-2 text-sm text-zinc-600">{item.username}</p>

      {item.notes ? (
        <p className="mt-3 text-sm text-zinc-500">{item.notes}</p>
      ) : null}

      {revealError ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {revealError}
        </p>
      ) : null}

      {copyStatus ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          {copyStatus}
        </p>
      ) : null}

      {deleteStatus ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {deleteStatus}
        </p>
      ) : null}

      <div className="mt-4 rounded-md bg-zinc-50 p-3">
        <p className="text-sm font-medium text-zinc-700">Password</p>
        <p className="mt-1 text-sm text-zinc-600">
          {revealedPassword || "••••••••"}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleTogglePassword}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
        >
          {revealedPassword ? "Hide password" : "Reveal password"}
        </button>
        <button
          type="button"
          onClick={handleCopyUsername}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
        >
          Copy username
        </button>
        <button
          type="button"
          onClick={handleCopyPassword}
          className="rounded-md bg-zinc-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
        >
          Copy password
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
          className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </article>
  );
}
