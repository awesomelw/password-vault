import { getApps, initializeApp } from "firebase/app";
import {
  getToken,
  initializeAppCheck,
  ReCaptchaV3Provider,
} from "firebase/app-check";
import { getAuth } from "firebase/auth";

declare global {
  var firebaseAppCheckInitialized: boolean | undefined;
  interface Window {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Reuses an existing Firebase app
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

if (typeof window !== "undefined" && recaptchaSiteKey) {
  const isAppCheckDebugMode =
    process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN === "true";

  if (isAppCheckDebugMode) {
    // Allows Firebase App Check to run locally while we test the setup.
    window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  if (!globalThis.firebaseAppCheckInitialized) {
    // Invisible reCAPTCHA check used by Firebase App Check for browser requests.
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });

    globalThis.firebaseAppCheckInitialized = true;

    if (isAppCheckDebugMode) {
      // Forces a local debug token request so Firebase prints it in DevTools.
      getToken(appCheck).catch(() => {});
    }
  }
}

// Browser Firebase Auth instance used by login and signup pages.
export const auth = getAuth(app);
export { app };
