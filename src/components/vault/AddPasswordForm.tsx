"use client";

import { type SubmitEvent, useEffect, useState } from "react";
import { createVaultItem } from "@/lib/api/vaultApi";
import { encryptPassword } from "@/lib/crypto/vaultCrypto";

type AddPasswordFormProps = {
  onPasswordCreated: () => Promise<void>;
};

export default function AddPasswordForm({
  onPasswordCreated,
}: AddPasswordFormProps) {
  const [service, setService] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [addFormStatus, setAddFormStatus] = useState("");
  const [addFormError, setAddFormError] = useState("");
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (!addFormStatus) {
      return;
    }

    // Clears the saved message after the user sees it.
    const timeoutId = window.setTimeout(() => {
      setAddFormStatus("");
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [addFormStatus]);

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

      setService("");
      setUsername("");
      setPassword("");
      setNotes("");
      setAddFormStatus("Password saved.");

      try {
        // Refreshes the list after the save succeeds.
        await onPasswordCreated();
      } catch {
        setAddFormError("Password saved, but the list did not refresh.");
      }
    } catch {
      setAddFormError("Unable to save password.");
    } finally {
      setIsSavingPassword(false);
    }
  }

  return (
    // Add-password form that encrypts before saving.
    <form
      className="mt-6 rounded-lg border border-zinc-200 bg-white p-5 shadow-sm"
      onSubmit={handleAddPassword}
    >
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-zinc-950">Add login</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Save a service, username, password, and optional note.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Service</span>
          <input
            type="text"
            value={service}
            onChange={(event) => setService(event.target.value)}
            placeholder="GitHub"
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Username</span>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="you@example.com"
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password to encrypt"
            className="mt-2 w-full rounded-md border border-zinc-300 px-3 py-3 text-sm outline-none transition focus:border-emerald-500"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-zinc-700">Notes</span>
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
  );
}
