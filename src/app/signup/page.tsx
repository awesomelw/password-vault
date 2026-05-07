"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type SubmitEvent, useState } from "react";
import { FirebaseError } from "firebase/app";
import { signUpWithEmail } from "@/lib/auth/clientAuth";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignup(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    // validate account fields before calling firebase auth
    if (!email.trim() || !password || !confirmPassword) {
      setError("All fields are required.");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }

    try {
      // create the firebase account after local checks pass
      await signUpWithEmail(email.trim(), password);

      // firebase signs the user in after signup, so send them to the vault
      router.push("/vault");
    } catch (caughtError) {
      // convert common firebase errors into messages the user can act on
      if (caughtError instanceof FirebaseError) {
        if (caughtError.code === "auth/email-already-in-use") {
          setError("That email is already registered.");
        } else if (caughtError.code === "auth/invalid-email") {
          setError("Please enter a valid email address.");
        } else if (caughtError.code === "auth/weak-password") {
          setError("Password must be at least 8 characters.");
        } else {
          setError("Unable to create account. Please try again.");
        }
      } else {
        setError("Unable to create account. Please try again.");
      }

      setIsSubmitting(false);
    }
  }

  return (
    // signup page for new firebase users
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-10 text-white">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/4 p-6 shadow-2xl shadow-black/30">
        {/* public auth navigation */}
        <div className="mb-8 flex items-center justify-between text-sm">
          <Link href="/" className="font-semibold text-white">
            Password Vault
          </Link>
          <Link
            href="/login"
            className="text-zinc-300 transition hover:text-emerald-300"
          >
            Log in
          </Link>
        </div>

        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-300">
            Get started
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white">
            Create your vault
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            Set up an account to start saving encrypted login records in one
            place.
          </p>
        </div>

        {/* signup form connected to firebase auth */}
        <form className="mt-8 space-y-5" onSubmit={handleSignup}>
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
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-300"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-200">
              Confirm password
            </span>
            <input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="Re-enter your password"
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
            {isSubmitting ? "Checking..." : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}
