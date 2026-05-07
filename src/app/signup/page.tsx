import Link from "next/link";

export default function SignupPage() {
  return (
    // Signup page shell before Firebase account creation is connected.
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 py-10 text-white">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30">
        {/* Simple route links for moving between public auth pages. */}
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

        {/* Static form for the first UI pass. */}
        <form className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-medium text-zinc-200">Email</span>
            <input
              type="email"
              name="email"
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
              autoComplete="new-password"
              placeholder="Re-enter your password"
              className="mt-2 w-full rounded-md border border-white/10 bg-zinc-900 px-3 py-3 text-white outline-none transition placeholder:text-zinc-500 focus:border-emerald-300"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-md bg-emerald-400 px-4 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-300"
          >
            Create account
          </button>
        </form>
      </section>
    </main>
  );
}
