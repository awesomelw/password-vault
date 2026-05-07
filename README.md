# Password Vault

A fullstack password vault built with Next.js, Firebase Authentication, Cloud Firestore, Firebase Admin, App Check reCAPTCHA, the Web Crypto API, TypeScript, and Tailwind CSS.

## Features

- Email/password signup and login with Firebase Authentication
- Protected vault and settings pages
- Backend Firebase ID token verification through Next.js API routes
- Encrypted password records stored in Cloud Firestore
- Browser-side password encryption and decryption with Web Crypto AES-GCM
- Add, reveal, hide, copy, edit, and delete vault records
- Per-user Firestore storage at `users/{uid}/vaultItems/{itemId}`
- Inactivity auto-lock setting stored in the browser
- Firebase App Check with invisible reCAPTCHA for browser request protection
- Public landing page with sponsored-space placement kept outside private vault screens

## Local Setup

Install dependencies:

```bash
npm install
```

Create `.env.local` from `.env.example` and fill in your Firebase values. AdSense values can stay blank for local development:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN=true
NEXT_PUBLIC_ADSENSE_CLIENT=
NEXT_PUBLIC_ADSENSE_SLOT=
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="your_private_key_with_escaped_newlines"
```

Run the development server:

```bash
npm run dev
```

Open the local app:

```text
http://localhost:3000
```

## Firebase Setup

1. Create a Firebase project.
2. Create a web app inside the project.
3. Enable email/password authentication.
4. Create a Firestore database.
5. Create a Firebase Admin service account.
6. Copy the web app config into `.env.local`.
7. Copy the service account project ID, client email, and private key into `.env.local`.
8. Register the web app with Firebase App Check using reCAPTCHA.
9. Add the reCAPTCHA site key to `.env.local`.
10. Use an App Check debug token for local development.

Do not commit `.env.local`.

## reCAPTCHA and App Check

The app uses Firebase App Check with invisible reCAPTCHA v3.

Local development uses:

```env
NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN=true
```

After starting the app, Firebase can print a debug token in the browser console. Add that token in Firebase Console:

```text
Firebase Console
App Check
Your web app
Manage debug tokens
```

Leave enforcement off until local signup, login, vault loading, and Firestore writes work.

## AdSense

The landing page includes an AdSense-ready component in the sponsored-space area. Ads are not imported into `/vault` or `/settings`.

Local development can leave these values blank:

```env
NEXT_PUBLIC_ADSENSE_CLIENT=
NEXT_PUBLIC_ADSENSE_SLOT=
```

When those values are empty, the app shows the sponsored-space placeholder instead of loading an ad.

For real ads, AdSense requires an approved account, a reviewed public site, a publisher/client ID, and an ad slot ID. A local-only app can keep the integration code, but real ads usually require a public URL for Google review.

## Security Model

- Firebase Authentication owns account signup, login, logout, and session restore.
- Frontend requests to this app's API routes include a Firebase ID token in the `Authorization` header.
- Next.js API routes verify that ID token with Firebase Admin before reading or writing data.
- Firestore records are scoped by Firebase UID under `users/{uid}/vaultItems`.
- Plaintext passwords are encrypted in the browser before they are sent to the backend.
- Firestore stores `encryptedPassword` and `passwordIv`, not the plaintext password.
- Revealed passwords exist only temporarily in browser component state.
- Private pages are wrapped with `ProtectedPage`.
- Inactivity logout redirects idle users back to login.

Current encryption note: this first version stores the vault encryption key in the browser's local storage, so records are decryptable from the same browser profile. That vault key is separate from the Firebase Admin credentials used by the backend. See `DESIGN.md` for the detailed flow.

## Project Structure

```text
src/app
Next.js routes, pages, layouts, and API route handlers

src/components
Shared React components and vault-specific UI

src/lib
Firebase setup, auth helpers, API clients, crypto helpers, and settings helpers

src/hooks
Client-side hooks such as inactivity logout
```

For detailed file responsibilities and request flow diagrams, see `DESIGN.md`.

## Local Checks

```bash
npm run lint
npm run build
```

## Deployment Notes

Deployment is not required for local development, but a hosted version would need:

- All `.env.local` values added as production environment variables
- Firebase authorized domain updated with the production domain
- reCAPTCHA/App Check domain updated with the production domain
- App Check debug mode disabled in production
- Firestore and authentication checked after deployment

## Design Documentation

See `DESIGN.md` for component patterns, file responsibilities, design choices, and request flow diagrams.
