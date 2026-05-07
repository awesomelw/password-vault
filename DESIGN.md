# password-vault design notes

this doc explains where the main pieces live, how requests move through the app, and why the project is split into separate files

## high-level architecture

```text
browser
react pages and components
        |
        | firebase auth session + id token
        v
next.js api routes
src/app/api
        |
        | firebase admin verifies token
        v
firebase admin sdk
src/lib/firebase/admin.ts
        |
        | reads and writes user-scoped records
        v
cloud firestore
users/{uid}/vaultItems/{itemId}
```

the browser handles ui, firebase auth, app check, and password encryption

the backend api routes handle user verification and firestore writes

firestore stores encrypted vault data scoped by firebase uid

## main file responsibilities

```text
src/app/page.tsx
public landing page with sponsored-space placeholder

src/app/login/page.tsx
public login form that calls firebase auth

src/app/signup/page.tsx
public signup form that calls firebase auth

src/app/vault/page.tsx
protected dashboard that loads and displays vault records

src/app/settings/page.tsx
protected page for inactivity timeout settings

src/components/ProtectedPage.tsx
auth guard for private routes

src/components/vault/AddPasswordForm.tsx
form for adding a new encrypted vault record

src/components/vault/VaultItemCard.tsx
per-record actions: reveal, hide, copy, edit, delete

src/hooks/useInactivityLogout.ts
idle timer for protected pages

src/lib/firebase/client.ts
browser firebase app, firebase auth, and app check recaptcha setup

src/lib/firebase/admin.ts
server firebase admin auth and firestore setup

src/lib/auth/clientAuth.ts
small wrapper functions around firebase browser auth

src/lib/auth/serverAuth.ts
backend helper that verifies bearer tokens with firebase admin

src/lib/api/vaultApi.ts
frontend helper functions for calling vault api routes

src/lib/api/authCheck.ts
frontend helper for checking backend token verification

src/lib/crypto/vaultCrypto.ts
browser-side aes-gcm encryption and decryption helpers

src/lib/settings/inactivity.ts
local storage helpers for the auto-lock timeout
```

## design choices

### separate `VaultPage` and `VaultWorkspace`

`VaultPage` wraps the real dashboard with `ProtectedPage`

`VaultWorkspace` loads records only after `ProtectedPage` confirms firebase restored the session

this avoids a timing bug where the vault page could call the backend before `auth.currentUser` exists

```text
VaultPage
src/app/vault/page.tsx
        |
        | renders private guard
        v
ProtectedPage
src/components/ProtectedPage.tsx
        |
        | waits for firebase auth session
        v
VaultWorkspace
src/app/vault/page.tsx
        |
        | loads backend auth check and vault records
        v
vault dashboard ui
```

### reusable protected page guard

private pages use the same auth gate instead of repeating auth checks in every page

```text
/vault or /settings
        |
        v
ProtectedPage
        |
        | onAuthStateChanged(auth)
        v
firebase auth
        |
        | user exists
        v
render children
        |
        | no user
        v
router.replace("/login")
```

### api helper files

the components do not manually build every `fetch` request

instead, frontend api helpers handle tokens, headers, urls, and error handling

```text
component
        |
        v
src/lib/api/vaultApi.ts
        |
        | gets id token from auth.currentUser
        | sends fetch request with Authorization header
        v
src/app/api/vault/*
```

### browser-side encryption

passwords are encrypted before they leave the browser

the backend never receives the plaintext password

```text
plaintext password
        |
        v
encryptPassword(password)
src/lib/crypto/vaultCrypto.ts
        |
        | aes-gcm + fresh iv
        v
encryptedPassword + passwordIv
        |
        v
api route and firestore
```

current key note: this version stores the aes key in browser local storage so the same browser profile can decrypt records after refresh

## add password flow

```text
VaultPage / VaultWorkspace
src/app/vault/page.tsx
        |
        | renders add form
        v
AddPasswordForm
src/components/vault/AddPasswordForm.tsx
        |
        | user fills service / username / password / notes
        v
handleAddPassword()
src/components/vault/AddPasswordForm.tsx
        |
        | validates required fields
        v
encryptPassword(password)
src/lib/crypto/vaultCrypto.ts
        |
        | returns encryptedPassword + passwordIv
        v
createVaultItem(...)
src/lib/api/vaultApi.ts
        |
        | gets firebase id token from auth.currentUser
        | sends POST request with Authorization header
        v
POST: /api/vault
src/app/api/vault/route.ts
        |
        | verifyRequestUser(request)
        v
verifyRequestUser()
src/lib/auth/serverAuth.ts
        |
        | adminAuth.verifyIdToken(token)
        v
firebase admin auth
src/lib/firebase/admin.ts
        |
        | confirms user uid
        v
POST: /api/vault continues
src/app/api/vault/route.ts
        |
        | adminDb writes encrypted record
        v
cloud firestore
users/{uid}/vaultItems/{itemId}
        |
        | frontend refreshes list
        v
getVaultItems()
src/lib/api/vaultApi.ts
```

## load vault records flow

```text
VaultWorkspace mounts
src/app/vault/page.tsx
        |
        | checkBackendAuth()
        v
GET: /api/auth-check
src/app/api/auth-check/route.ts
        |
        | verifyRequestUser(request)
        v
firebase admin auth verifies id token
        |
        | session accepted
        v
refreshVaultItems()
src/app/vault/page.tsx
        |
        | getVaultItems()
        v
GET: /api/vault
src/app/api/vault/route.ts
        |
        | verify token again
        | query users/{uid}/vaultItems
        v
cloud firestore
        |
        | returns encrypted records
        v
VaultItemCard list
src/components/vault/VaultItemCard.tsx
```

## reveal and hide password flow

```text
VaultItemCard
src/components/vault/VaultItemCard.tsx
        |
        | user clicks reveal password
        v
handleTogglePassword()
        |
        | decryptPassword(encryptedPassword, passwordIv)
        v
decryptPassword()
src/lib/crypto/vaultCrypto.ts
        |
        | uses browser-held aes key
        v
plaintext password in component state
        |
        | user clicks hide password
        v
setRevealedPassword("")
```

important detail: the revealed plaintext is not written back to firestore or sent to the backend

## copy password flow

```text
VaultItemCard
        |
        | user clicks copy password
        v
handleCopyPassword()
        |
        | uses revealed password if already visible
        | otherwise decrypts on demand
        v
navigator.clipboard.writeText(password)
```

## edit password flow

```text
VaultItemCard
        |
        | user clicks edit
        v
edit mode state
        |
        | user changes service / username / notes
        | optional new password
        v
handleSaveEdit()
        |
        | validates service and username
        | if new password exists, encrypt it
        v
updateVaultItem(id, updates)
src/lib/api/vaultApi.ts
        |
        | sends PATCH with firebase id token
        v
PATCH: /api/vault/[id]
src/app/api/vault/[id]/route.ts
        |
        | verifyRequestUser(request)
        | validate update fields
        | require encryptedPassword + passwordIv together
        v
adminDb updates users/{uid}/vaultItems/{id}
```

why `patch` is used: editing updates an existing record without creating a new document id

why password is re-encrypted: changing the password creates new ciphertext and a new iv

why password can be blank in edit mode: blank means keep the existing encrypted password fields

## delete password flow

```text
VaultItemCard
        |
        | user clicks delete
        v
handleDelete()
        |
        | deleteVaultItem(item.id)
        v
DELETE: /api/vault/[id]
src/app/api/vault/[id]/route.ts
        |
        | verifyRequestUser(request)
        | delete users/{uid}/vaultItems/{id}
        v
refreshVaultItems()
```

## login flow

```text
LoginPage
src/app/login/page.tsx
        |
        | user enters email and password
        v
handleLogin()
        |
        | local required-field check
        v
logInWithEmail(email, password)
src/lib/auth/clientAuth.ts
        |
        | signInWithEmailAndPassword(auth, ...)
        v
firebase auth
        |
        | success
        v
router.push("/vault")
```

## signup flow

```text
SignupPage
src/app/signup/page.tsx
        |
        | user enters email / password / confirm password
        v
handleSignup()
        |
        | local validation
        v
signUpWithEmail(email, password)
src/lib/auth/clientAuth.ts
        |
        | createUserWithEmailAndPassword(auth, ...)
        v
firebase auth
        |
        | firebase signs user in
        v
router.push("/vault")
```

## app check recaptcha flow

```text
browser loads firebase client
src/lib/firebase/client.ts
        |
        | initializeAppCheck(...)
        v
firebase app check
        |
        | invisible recaptcha check
        v
recaptcha token
        |
        | exchanged by firebase for app check token
        v
app check token
        |
        | attached to firebase browser requests
        v
firebase services
```

local development uses a firebase app check debug token so localhost can be trusted while testing

## inactivity logout flow

```text
ProtectedPage confirms session
src/components/ProtectedPage.tsx
        |
        | useInactivityLogout(isAuthenticated)
        v
useInactivityLogout()
src/hooks/useInactivityLogout.ts
        |
        | listens for mousemove / keydown / click / scroll
        | resets timer on activity
        v
saved timeout expires
        |
        | logOut()
        | router.replace("/login")
        v
login page
```

settings are stored by:

```text
SettingsPage
src/app/settings/page.tsx
        |
        | saveInactivityTimeout(selectedTimeout)
        v
localStorage
password-vault-timeout-minutes
```

## public pages and ads

ads are intentionally kept out of private routes

current public placement:

```text
Home page
src/app/page.tsx
        |
        | sponsored-space placeholder
        v
future adsense unit
```

private routes do not import an ad component:

```text
/vault
/settings
```

## firestore data shape

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

the `uid` comes from the verified firebase id token, not from the request body

## route summary

```text
GET: /api/auth-check
verify the current firebase id token

GET: /api/vault
load encrypted vault records for the verified user

POST: /api/vault
create an encrypted vault record for the verified user

PATCH: /api/vault/[id]
update one encrypted vault record for the verified user

DELETE: /api/vault/[id]
remove one vault record for the verified user
```
