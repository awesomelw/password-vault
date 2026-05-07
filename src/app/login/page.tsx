"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type SubmitEvent, useState } from "react";
import { FirebaseError } from "firebase/app";
import { logInWithEmail } from "@/lib/auth/clientAuth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    // Checks required fields before calling Firebase.
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Signs in the Firebase user and opens the vault on success.
      await logInWithEmail(email.trim(), password);
      router.push("/vault");
    } catch (caughtError) {
      // Keeps login errors clear without exposing raw Firebase messages.
      if (caughtError instanceof FirebaseError) {
        if (caughtError.code === "auth/invalid-email") {
          setError("Please enter a valid email address.");
        } else if (
          caughtError.code === "auth/invalid-credential" ||
          caughtError.code === "auth/user-not-found" ||
          caughtError.code === "auth/wrong-password"
        ) {
          setError("Login failed. Check your credentials.");
        } else if (caughtError.code === "auth/too-many-requests") {
          setError("Too many login attempts. Please try again later.");
        } else {
          setError("Unable to log in. Please try again.");
        }
      } else {
        setError("Unable to log in. Please try again.");
      }

      setIsSubmitting(false);
    }
  }

  return (
    // Login page shell before Firebase authentication is connected.
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-10 text-white">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/4 p-6 shadow-2xl shadow-black/30">
        {/* Simple route links for moving between public auth pages. */}
        <div className="mb-8 flex items-center justify-between text-sm">
          <Link href="/" className="font-semibold text-white">
            Password Vault
          </Link>
          <Link
            href="/signup"
            className="text-zinc-300 transition hover:text-emerald-300"
          >
            Create account
          </Link>
        </div>

        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-300">
            Welcome back
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            Log in to your vault
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            Access your saved logins and manage your encrypted password records.
          </p>
        </div>

        {/* Static form for the first UI pass. */}
        <form className="mt-8 space-y-5" onSubmit={handleLogin}>
          <label className="block">
            <span className="text-sm font-medium text-zinc-200">Email</span>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              className="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-300"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-200">Password</span>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Enter your password"
              className="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-300"
            />
          </label>

          {error ? (
            <p className="rounded-md border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-emerald-400 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-zinc-500 disabled:text-zinc-200"
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </form>
      </section>
    </main>
  );
}
