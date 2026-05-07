"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";

type ProtectedPageProps = {
  children: ReactNode;
};

export default function ProtectedPage({ children }: ProtectedPageProps) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Watches Firebase auth state before showing private pages.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      setIsCheckingAuth(false);
    });

    // Removes the Firebase listener when the page unloads.
    return unsubscribe;
  }, [router]);

  if (isCheckingAuth) {
    return (
      // Loading screen shown while Firebase checks the current session.
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 text-zinc-950">
        <p className="rounded-lg border border-zinc-200 bg-white px-5 py-4 text-sm font-medium shadow-sm">
          Checking your session...
        </p>
      </main>
    );
  }

  return children;
}
