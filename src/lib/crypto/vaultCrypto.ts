const VAULT_KEY_STORAGE_NAME = "password-vault-demo-key";
const AES_GCM_ALGORITHM = "AES-GCM";
const AES_KEY_LENGTH = 256;
const IV_LENGTH_BYTES = 12;

type EncryptedPassword = {
  encryptedPassword: string;
  passwordIv: string;
};

// Converts encrypted bytes into text that can be sent to the API and Firestore.
function bytesToBase64(bytes: Uint8Array) {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

// Converts stored base64 text back into bytes for Web Crypto.
function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function importStoredKey(base64Key: string) {
  // Imports the saved raw AES key back into the Web Crypto API.
  return crypto.subtle.importKey(
    "raw",
    base64ToBytes(base64Key),
    AES_GCM_ALGORITHM,
    true,
    ["encrypt", "decrypt"],
  );
}

async function createStoredKey() {
  // Generates a new AES-GCM key for encrypting and decrypting vault passwords.
  const key = await crypto.subtle.generateKey(
    {
      name: AES_GCM_ALGORITHM,
      length: AES_KEY_LENGTH,
    },
    true,
    ["encrypt", "decrypt"],
  );

  const rawKey = await crypto.subtle.exportKey("raw", key);
  // Stores the demo key locally so this browser can decrypt after refresh.
  localStorage.setItem(
    VAULT_KEY_STORAGE_NAME,
    bytesToBase64(new Uint8Array(rawKey)),
  );

  return key;
}

async function getVaultKey() {
  const storedKey = localStorage.getItem(VAULT_KEY_STORAGE_NAME);

  // Reuses the browser-held key so saved records can decrypt after refresh.
  if (storedKey) {
    return importStoredKey(storedKey);
  }

  // Creates the first local AES key for this browser profile.
  return createStoredKey();
}

export async function encryptPassword(
  password: string,
): Promise<EncryptedPassword> {
  const key = await getVaultKey();
  // AES-GCM needs a fresh IV for every password encryption.
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const encodedPassword = new TextEncoder().encode(password);

  // AES-GCM returns encrypted bytes that are safe to store after base64 encoding.
  const encryptedBytes = await crypto.subtle.encrypt(
    {
      name: AES_GCM_ALGORITHM,
      iv,
    },
    key,
    encodedPassword,
  );

  return {
    encryptedPassword: bytesToBase64(new Uint8Array(encryptedBytes)),
    passwordIv: bytesToBase64(iv),
  };
}

export async function decryptPassword(
  encryptedPassword: string,
  passwordIv: string,
) {
  const key = await getVaultKey();
  // Restores the encrypted password and IV from Firestore-safe text.
  const encryptedBytes = base64ToBytes(encryptedPassword);
  const iv = base64ToBytes(passwordIv);

  // Decrypts the stored bytes back into the original password text.
  const decryptedBytes = await crypto.subtle.decrypt(
    {
      name: AES_GCM_ALGORITHM,
      iv,
    },
    key,
    encryptedBytes,
  );

  return new TextDecoder().decode(decryptedBytes);
}
