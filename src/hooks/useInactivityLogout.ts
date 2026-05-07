"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { logOut } from "@/lib/auth/clientAuth";
import { getStoredInactivityTimeout } from "@/lib/settings/inactivity";

const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll"];
const MILLIS_PER_MINUTE = 60_000;

export function useInactivityLogout(enabled: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let timeoutId: number;

    async function handleTimeout() {
      // log out when the protected page has been idle too long
      try {
        await logOut();
      } finally {
        router.replace("/login");
      }
    }

    function resetTimer() {
      // start a fresh countdown using the latest saved timeout setting
      window.clearTimeout(timeoutId);
      const timeoutMinutes = getStoredInactivityTimeout();
      timeoutId = window.setTimeout(
        handleTimeout,
        timeoutMinutes * MILLIS_PER_MINUTE,
      );
    }

    // reset the inactivity timer whenever the user interacts with the page
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer);
    });
    resetTimer();

    return () => {
      window.clearTimeout(timeoutId);
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer);
      });
    };
  }, [enabled, router]);
}
