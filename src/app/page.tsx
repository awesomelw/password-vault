import Link from "next/link";

const features = [
  "Private saved logins",
  "Encrypted password storage",
  "Quick copy controls",
  "Automatic lock timer",
];

export default function Home() {
  return (
    // Public landing page shown before users log in.
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-6 sm:px-8 lg:px-10">
        {/* Top navigation for public pages. */}
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <Link href="/" className="text-lg font-semibold tracking-wide">
            Password Vault
          </Link>

          <nav className="flex items-center gap-3 text-sm">
            <Link
              href="/login"
              className="rounded-md px-3 py-2 text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-emerald-400 px-3 py-2 font-medium text-zinc-950 transition hover:bg-emerald-300"
            >
              Create account
            </Link>
          </nav>
        </header>

        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.08fr_0.92fr]">
          {/* Main headline and sign-up actions. */}
          <section className="max-w-2xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-emerald-300">
              Secure password storage
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Keep your logins organized, protected, and close at hand.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-zinc-300 sm:text-lg">
              Save account details in a private vault, reveal passwords only
              when you need them, and copy credentials without digging through
              notes or reused spreadsheets.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/signup"
                className="rounded-md bg-emerald-400 px-5 py-3 text-center font-semibold text-zinc-950 transition hover:bg-emerald-300"
              >
                Create your vault
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-white/15 px-5 py-3 text-center font-semibold text-white transition hover:bg-white/10"
              >
                Log in
              </Link>
            </div>
          </section>

          {/* Preview of the main vault features. */}
          <aside className="rounded-lg border border-white/10 bg-white/4 p-5 shadow-2xl shadow-black/30">
            <div className="rounded-md border border-emerald-300/20 bg-emerald-300/10 p-4">
              <p className="text-sm font-medium text-emerald-200">
                Vault essentials
              </p>
              <ul className="mt-4 space-y-3 text-sm text-zinc-200">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-300" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Placeholder for a future AdSense unit on public pages. */}
            <div className="mt-5 rounded-md border border-dashed border-white/20 p-5 text-center">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                Sponsored space
              </p>
              <p className="mt-2 text-sm text-zinc-300">
                Public pages can support ads while private vault screens stay
                clean.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
