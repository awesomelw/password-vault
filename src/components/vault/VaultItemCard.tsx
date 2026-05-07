"use client";

import { useEffect, useState } from "react";
import {
  deleteVaultItem,
  type VaultItem,
  updateVaultItem,
} from "@/lib/api/vaultApi";
import { decryptPassword, encryptPassword } from "@/lib/crypto/vaultCrypto";

type VaultItemCardProps = {
  item: VaultItem;
  onVaultItemDeleted: () => Promise<void>;
  onVaultItemUpdated: () => Promise<void>;
};

export default function VaultItemCard({
  item,
  onVaultItemDeleted,
  onVaultItemUpdated,
}: VaultItemCardProps) {
  const [revealedPassword, setRevealedPassword] = useState("");
  const [revealError, setRevealError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [deleteStatus, setDeleteStatus] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editService, setEditService] = useState(item.service);
  const [editUsername, setEditUsername] = useState(item.username);
  const [editPassword, setEditPassword] = useState("");
  const [editNotes, setEditNotes] = useState(item.notes ?? "");
  const [editStatus, setEditStatus] = useState("");
  const [editError, setEditError] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    if (!copyStatus && !editStatus) {
      return;
    }

    // Clears short-lived success messages after the user sees them.
    const timeoutId = window.setTimeout(() => {
      setCopyStatus("");
      setEditStatus("");
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [copyStatus, editStatus]);

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
      setCopyStatus(
        "Unable to copy password. This record may need to be re-saved.",
      );
    }
  }

  async function handleDelete() {
    setDeleteStatus("");
    setIsDeleting(true);

    try {
      // Delete: remove this record from the user's Firestore vault collection.
      await deleteVaultItem(item.id);

      try {
        // Refreshes the list after the delete succeeds.
        await onVaultItemDeleted();
      } catch {
        setDeleteStatus("Password deleted, but the list did not refresh.");
        setIsDeleting(false);
      }
    } catch {
      setDeleteStatus("Unable to delete password.");
      setIsDeleting(false);
    }
  }

  async function handleSaveEdit() {
    setEditStatus("");
    setEditError("");

    // Requires the core display fields before updating Firestore.
    if (!editService.trim() || !editUsername.trim()) {
      setEditError("Service and username are required.");
      return;
    }

    setIsSavingEdit(true);

    try {
      const updates: {
        service: string;
        username: string;
        notes: string;
        encryptedPassword?: string;
        passwordIv?: string;
      } = {
        service: editService,
        username: editUsername,
        notes: editNotes,
      };

      if (editPassword) {
        // Re-encrypts only when the user enters a new password.
        const encryptedValue = await encryptPassword(editPassword);
        updates.encryptedPassword = encryptedValue.encryptedPassword;
        updates.passwordIv = encryptedValue.passwordIv;
      }

      // PATCH updates this existing vault item instead of creating a new one.
      await updateVaultItem(item.id, updates);
      setEditPassword("");
      setRevealedPassword("");

      try {
        // Refreshes the list after the update succeeds.
        await onVaultItemUpdated();
      } catch {
        setEditStatus("Password updated, but the list did not refresh.");
        return;
      }

      setIsEditing(false);
      setEditStatus("Password updated.");
    } catch {
      setEditError("Unable to update password.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  function handleCancelEdit() {
    // Restores the edit form back to the last loaded item values.
    setEditService(item.service);
    setEditUsername(item.username);
    setEditPassword("");
    setEditNotes(item.notes ?? "");
    setEditError("");
    setIsEditing(false);
  }

  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      {isEditing ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Service</span>
            <input
              type="text"
              value={editService}
              onChange={(event) => setEditService(event.target.value)}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Username</span>
            <input
              type="text"
              value={editUsername}
              onChange={(event) => setEditUsername(event.target.value)}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">
              New password
            </span>
            <input
              type="password"
              value={editPassword}
              onChange={(event) => setEditPassword(event.target.value)}
              placeholder="Leave blank to keep current"
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">Notes</span>
            <input
              type="text"
              value={editNotes}
              onChange={(event) => setEditNotes(event.target.value)}
              className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
            />
          </label>
        </div>
      ) : (
        <>
          <h2 className="text-lg font-semibold">{item.service}</h2>
          <p className="mt-2 text-sm text-zinc-600">{item.username}</p>

          {item.notes ? (
            <p className="mt-3 text-sm text-zinc-500">{item.notes}</p>
          ) : null}
        </>
      )}

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

      {editError ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {editError}
        </p>
      ) : null}

      {editStatus ? (
        <p className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
          {editStatus}
        </p>
      ) : null}

      {!isEditing ? (
        <div className="mt-4 rounded-md bg-zinc-50 p-3">
          <p className="text-sm font-medium text-zinc-700">Password</p>
          <p className="mt-1 text-sm text-zinc-600">
            {revealedPassword || "********"}
          </p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {isEditing ? (
          <>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={isSavingEdit}
              className="rounded-md bg-emerald-500 px-3 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-zinc-400 disabled:text-zinc-100"
            >
              {isSavingEdit ? "Saving..." : "Save changes"}
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            Edit
          </button>
        )}
        {!isEditing ? (
          <>
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
          </>
        ) : null}
      </div>
    </article>
  );
}
