"use client";

import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useState } from "react";
import { auth } from "@/lib/firebase/client";
import { useInactivityLogout } from "@/hooks/useInactivityLogout";

type ProtectedPageProps = {
  children: ReactNode;
};

export default function ProtectedPage({ children }: ProtectedPageProps) {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // wait for firebase to restore the session before rendering private pages
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }

      // private content and idle tracking start only after auth is confirmed
      setIsAuthenticated(true);
      setIsCheckingAuth(false);
    });

    // detach the auth listener when this guard unmounts
    return unsubscribe;
  }, [router]);

  // idle logout is active only for confirmed sessions
  useInactivityLogout(isAuthenticated);

  if (isCheckingAuth) {
    return (
      // session restore screen shown before protected content renders
      <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-6 text-zinc-950">
        <p className="rounded-lg border border-zinc-200 bg-white px-5 py-4 text-sm font-medium shadow-sm">
          Checking your session...
        </p>
      </main>
    );
  }

  return children;
}
