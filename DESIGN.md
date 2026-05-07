# Password Vault Design Notes

This document explains how the app is organized, how the frontend connects to the backend, and why the main files are split the way they are.

## High-Level Architecture

```text
Browser UI -> Firebase Auth -> Next.js API routes -> Firebase Admin -> Cloud Firestore
```

The browser owns the user interface, Firebase Auth session, App Check setup, and password encryption.

The backend API routes verify the signed-in user before reading or writing Firestore data.

Firestore stores encrypted vault records under the verified Firebase UID:

```text
users/{uid}/vaultItems/{itemId}
```

## Main File Responsibilities

```text
src/app/page.tsx
Public landing page with the sponsored-space placeholder

src/app/login/page.tsx
Login form that signs in with Firebase Auth

src/app/signup/page.tsx
Signup form that creates a Firebase Auth account

src/app/vault/page.tsx
Protected vault dashboard and record loading flow

src/app/settings/page.tsx
Protected inactivity timeout settings page

src/components/ProtectedPage.tsx
Reusable auth guard for private pages

src/components/vault/AddPasswordForm.tsx
Form for creating encrypted vault records

src/components/vault/VaultItemCard.tsx
Per-record controls for reveal, hide, copy, edit, and delete

src/hooks/useInactivityLogout.ts
Idle timer used on protected pages

src/lib/firebase/client.ts
Browser Firebase app, Auth instance, and App Check reCAPTCHA setup

src/lib/firebase/admin.ts
Server Firebase Admin Auth and Firestore setup

src/lib/auth/clientAuth.ts
Small browser Auth wrappers for signup, login, and logout

src/lib/auth/serverAuth.ts
Backend helper that verifies Bearer tokens with Firebase Admin

src/lib/api/vaultApi.ts
Frontend API helpers for vault CRUD requests

src/lib/api/authCheck.ts
Frontend helper for checking backend token verification

src/lib/crypto/vaultCrypto.ts
Browser-side AES-GCM encryption and decryption helpers

src/lib/settings/inactivity.ts
Local storage helpers for the auto-lock timeout
```

## Design Choices

### `VaultPage` and `VaultWorkspace` are separated

`VaultPage` only wraps the dashboard with `ProtectedPage`.

`VaultWorkspace` contains the actual vault loading state and dashboard UI.

This keeps vault loading from running before Firebase finishes restoring the current user.

```text
VaultPage (src/app/vault/page.tsx)
-> ProtectedPage (src/components/ProtectedPage.tsx)
-> VaultWorkspace (src/app/vault/page.tsx)
-> vault dashboard UI
```

### Private pages share one auth guard

`/vault` and `/settings` both use `ProtectedPage`, so the app does not repeat session-checking code in every private page.

```text
/vault or /settings
-> ProtectedPage (src/components/ProtectedPage.tsx)
-> onAuthStateChanged(auth)
-> Firebase Auth
-> user exists: render page
-> no user: router.replace("/login")
```

### Components call API helper files instead of raw routes

Vault components do not manually build every `fetch` request. They call helper functions in `src/lib/api/vaultApi.ts`.

Those helpers handle:

- reading `auth.currentUser`
- getting a Firebase ID token
- adding the `Authorization` header
- calling the correct API route
- throwing errors when the response fails

```text
React component
-> API helper (src/lib/api/vaultApi.ts)
-> Firebase ID token from auth.currentUser
-> fetch("/api/vault...", Authorization header)
-> Next.js API route
```

### Passwords are encrypted in the browser

Plaintext passwords should not reach the backend. The browser encrypts the password first, then sends only encrypted fields to the API.

```text
plaintext password
-> encryptPassword(password) (src/lib/crypto/vaultCrypto.ts)
-> encryptedPassword + passwordIv
-> API route
-> Firestore
```

Current key note: this version stores the AES key in browser local storage, so the same browser profile can decrypt records after refresh.

## Add Password Flow

```text
VaultWorkspace (src/app/vault/page.tsx)
-> AddPasswordForm (src/components/vault/AddPasswordForm.tsx)
-> handleAddPassword() (src/components/vault/AddPasswordForm.tsx)
-> encryptPassword(password) (src/lib/crypto/vaultCrypto.ts)
-> createVaultItem(...) (src/lib/api/vaultApi.ts)
-> POST: /api/vault (src/app/api/vault/route.ts)
-> verifyRequestUser(request) (src/lib/auth/serverAuth.ts)
-> adminAuth.verifyIdToken(token) (src/lib/firebase/admin.ts)
-> adminDb writes encrypted record (src/app/api/vault/route.ts)
-> Cloud Firestore (users/{uid}/vaultItems/{itemId})
-> refreshVaultItems() (src/app/vault/page.tsx)
```

What happens in that flow:

1. The user fills in service, username, password, and optional notes.
2. `handleAddPassword()` validates required fields.
3. `encryptPassword()` encrypts the plaintext password in the browser.
4. `createVaultItem()` gets the Firebase ID token and sends the POST request.
5. `POST: /api/vault` verifies the token with Firebase Admin.
6. Firestore receives only encrypted password data.
7. The dashboard refreshes the visible record list.

## Load Vault Records Flow

```text
VaultWorkspace mounts (src/app/vault/page.tsx)
-> checkBackendAuth() (src/lib/api/authCheck.ts)
-> GET: /api/auth-check (src/app/api/auth-check/route.ts)
-> verifyRequestUser(request) (src/lib/auth/serverAuth.ts)
-> Firebase Admin verifies token (src/lib/firebase/admin.ts)
-> refreshVaultItems() (src/app/vault/page.tsx)
-> getVaultItems() (src/lib/api/vaultApi.ts)
-> GET: /api/vault (src/app/api/vault/route.ts)
-> query users/{uid}/vaultItems (Cloud Firestore)
-> VaultItemCard list (src/components/vault/VaultItemCard.tsx)
```

The backend auth check confirms the server can verify the browser session. The vault list request then fetches only the records under that verified user's UID.

## Record Controls

`VaultItemCard` owns the per-record actions: reveal, hide, copy, edit, and delete.

Reveal and copy password both decrypt inside the browser with `decryptPassword()`. The revealed plaintext is not sent to the backend or written back to Firestore. It exists only temporarily in component state or the clipboard action.

Copy username does not need decryption because usernames are stored as normal text.

## Edit Password Flow

```text
VaultItemCard (src/components/vault/VaultItemCard.tsx)
-> edit mode state
-> handleSaveEdit()
-> optional encryptPassword(editPassword) (src/lib/crypto/vaultCrypto.ts)
-> updateVaultItem(id, updates) (src/lib/api/vaultApi.ts)
-> PATCH: /api/vault/[id] (src/app/api/vault/[id]/route.ts)
-> verifyRequestUser(request) (src/lib/auth/serverAuth.ts)
-> adminDb updates users/{uid}/vaultItems/{id} (src/lib/firebase/admin.ts)
```

Important details:

- `PATCH` updates the existing record instead of creating a new document.
- Service and username are required so edited records stay readable.
- If the password field is blank in edit mode, the existing encrypted password stays unchanged.
- If the user enters a new password, the frontend encrypts it and sends a new `encryptedPassword` plus `passwordIv`.
- The backend requires encrypted password and IV to be updated together.

Delete uses `DELETE: /api/vault/[id]`, verifies the Firebase token on the backend, and removes only `users/{uid}/vaultItems/{id}`. The request body never decides which user's data is touched.

## Auth Pages

`LoginPage` and `SignupPage` keep local form validation and user-facing error messages in the page components.

Actual auth work goes through `src/lib/auth/clientAuth.ts`, which wraps Firebase browser Auth:

```text
LoginPage / SignupPage
-> clientAuth helper (src/lib/auth/clientAuth.ts)
-> Firebase Auth
-> router.push("/vault")
```

Firebase signs the user in after successful signup, so the app can route directly to the vault.

## App Check reCAPTCHA Flow

```text
Browser loads Firebase client (src/lib/firebase/client.ts)
-> initializeAppCheck(...)
-> invisible reCAPTCHA check
-> reCAPTCHA token
-> Firebase exchanges it for an App Check token
-> App Check token attaches to Firebase browser requests
-> Firebase services
```

Local development uses a registered Firebase App Check debug token so localhost can be trusted while testing.

## Inactivity Logout Flow

```text
ProtectedPage confirms session (src/components/ProtectedPage.tsx)
-> useInactivityLogout(isAuthenticated) (src/hooks/useInactivityLogout.ts)
-> listen for mousemove / keydown / click / scroll
-> reset timer on activity
-> saved timeout expires
-> logOut() (src/lib/auth/clientAuth.ts)
-> router.replace("/login")
```

Settings save the timeout here:

```text
SettingsPage (src/app/settings/page.tsx)
-> saveInactivityTimeout(selectedTimeout) (src/lib/settings/inactivity.ts)
-> localStorage
password-vault-timeout-minutes
```

## Public Pages and Ads

Ads are intentionally kept out of private routes.

Current public placement:

```text
Home page (src/app/page.tsx)
-> sponsored-space placeholder
-> future AdSense unit
```

Private routes do not import an ad component:

```text
/vault
/settings
```

## Firestore Data Shape

```text
users
  {uid}
    vaultItems
      {itemId}
        service: string
        username: string
        encryptedPassword: string
        passwordIv: string
        notes: string
        createdAt: server timestamp
        updatedAt: server timestamp
```

The `uid` comes from the verified Firebase ID token, not from the request body.

## Route Summary

```text
GET: /api/auth-check
verify the current Firebase ID token

GET: /api/vault
load encrypted vault records for the verified user

POST: /api/vault
create an encrypted vault record for the verified user

PATCH: /api/vault/[id]
update one encrypted vault record for the verified user

DELETE: /api/vault/[id]
remove one vault record for the verified user
```
