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

// reuse the browser firebase app across next.js hot reloads
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

if (typeof window !== "undefined" && recaptchaSiteKey) {
  const isAppCheckDebugMode =
    process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN === "true";

  if (isAppCheckDebugMode) {
    // enable the registered local debug token during development
    window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  if (!globalThis.firebaseAppCheckInitialized) {
    // app check attaches invisible recaptcha-backed proof to firebase requests
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });

    globalThis.firebaseAppCheckInitialized = true;

    if (isAppCheckDebugMode) {
      // request a token immediately so the local debug token appears in devtools
      getToken(appCheck).catch(() => {});
    }
  }
}

// shared browser auth instance for signup, login, logout, and id tokens
export const auth = getAuth(app);
export { app };
