"use client";

import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const adsenseSlot = process.env.NEXT_PUBLIC_ADSENSE_SLOT;
const hasAdSenseConfig = Boolean(adsenseClient && adsenseSlot);

function SponsoredPlaceholder() {
  return (
    // fallback shown when adsense ids are not configured locally
    <div className="mt-5 rounded-md border border-dashed border-white/20 p-5 text-center">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
        Sponsored space
      </p>
      <p className="mt-2 text-sm text-zinc-300">
        Public pages can support ads while private vault screens stay clean.
      </p>
    </div>
  );
}

export default function AdSenseUnit() {
  useEffect(() => {
    if (!hasAdSenseConfig) {
      return;
    }

    try {
      // ask adsense to render this landing-page ad slot after mount
      window.adsbygoogle = window.adsbygoogle ?? [];
      window.adsbygoogle.push({});
    } catch {
      // keep the landing page stable if adsense is unavailable locally
    }
  }, []);

  if (!hasAdSenseConfig) {
    return <SponsoredPlaceholder />;
  }

  return (
    <div className="mt-5 rounded-md border border-dashed border-white/20 p-5">
      {/* load adsense only on the public landing page */}
      <Script
        id="adsense-script"
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
        crossOrigin="anonymous"
        strategy="afterInteractive"
      />

      {/* landing-page adsense slot; private vault pages do not import this component */}
      <ins
        className="adsbygoogle block min-h-24"
        data-ad-client={adsenseClient}
        data-ad-slot={adsenseSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
