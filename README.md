# password-vault

fullstack password vault built with next.js, firebase auth, firestore, firebase admin, app check recaptcha, web crypto, typescript, and tailwind css

## features

- email/password signup and login with firebase authentication
- protected vault and settings pages
- backend firebase id token verification through next.js api routes
- encrypted password records stored in cloud firestore
- browser-side password encryption and decryption with web crypto aes-gcm
- add, reveal, hide, copy, edit, and delete vault records
- per-user firestore storage at `users/{uid}/vaultItems/{itemId}`
- inactivity auto-lock setting stored in the browser
- firebase app check with invisible recaptcha for browser request protection
- public landing page with a sponsored-space placeholder kept outside private vault screens

## stack

- next.js app router
- react
- typescript
- tailwind css
- firebase auth
- cloud firestore
- firebase admin sdk
- firebase app check with recaptcha v3
- browser web crypto api
- eslint

## project structure

```text
src/app
next.js routes, pages, layouts, and api route handlers

src/components
shared react components and vault-specific ui

src/lib
firebase setup, auth helpers, api clients, crypto helpers, and settings helpers

src/hooks
client-side hooks such as inactivity logout
```

important files:

```text
src/app/page.tsx
public landing page

src/app/login/page.tsx
login page

src/app/signup/page.tsx
signup page

src/app/vault/page.tsx
protected vault dashboard

src/app/settings/page.tsx
protected auto-lock settings page

src/app/api/vault/route.ts
GET and POST backend route for vault records

src/app/api/vault/[id]/route.ts
PATCH and DELETE backend route for one vault record

src/lib/firebase/client.ts
browser firebase setup, auth instance, and app check recaptcha setup

src/lib/firebase/admin.ts
server firebase admin setup for auth verification and firestore writes

src/lib/crypto/vaultCrypto.ts
browser-side password encryption and decryption
```

## local setup

install dependencies:

```bash
npm install
```

create `.env.local` from `.env.example` and fill in your firebase values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN=true
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="your_private_key_with_escaped_newlines"
```

run the dev server:

```bash
npm run dev
```

open:

```text
http://localhost:3000
```

## firebase setup

1. create a firebase project
2. create a web app inside the project
3. enable email/password authentication
4. create a firestore database
5. create a firebase admin service account
6. copy the web app config into `.env.local`
7. copy the service account project id, client email, and private key into `.env.local`
8. register the web app with firebase app check using recaptcha
9. add the recaptcha site key to `.env.local`
10. use an app check debug token for local development

do not commit `.env.local`

## recaptcha and app check

the app uses firebase app check with invisible recaptcha v3

local development uses:

```env
NEXT_PUBLIC_FIREBASE_APPCHECK_DEBUG_TOKEN=true
```

after starting the app, firebase can print a debug token in the browser console. add that token in firebase console:

```text
firebase console
app check
your web app
manage debug tokens
```

leave enforcement off until local signup, login, vault loading, and firestore writes work

## security model

- firebase auth owns account signup, login, logout, and session restore
- frontend requests include a firebase id token in the `Authorization` header
- next.js api routes verify that token with firebase admin before reading or writing data
- firestore records are scoped by firebase uid under `users/{uid}/vaultItems`
- plaintext passwords are encrypted in the browser before they are sent to the backend
- firestore stores `encryptedPassword` and `passwordIv`, not the plaintext password
- revealed passwords exist only temporarily in browser component state
- private pages are wrapped with `ProtectedPage`
- inactivity logout redirects idle users back to login

current encryption note: the first version stores the vault encryption key in this browser's local storage, so records are decryptable from the same browser profile. see `DESIGN.md` for the detailed flow

## local checks

```bash
npm run lint
npm run build
```

## deployment notes

deployment is not required for local development, but a hosted version would need:

- all `.env.local` values added as production environment variables
- firebase authorized domain updated with the production domain
- recaptcha/app check domain updated with the production domain
- app check debug mode disabled in production
- firestore and authentication checked after deployment

## docs

see `DESIGN.md` for component patterns, file responsibilities, and request flow diagrams
