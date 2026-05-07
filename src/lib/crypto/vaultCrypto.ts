const VAULT_KEY_STORAGE_NAME = "password-vault-demo-key";
const AES_GCM_ALGORITHM = "AES-GCM";
const AES_KEY_LENGTH = 256;
const IV_LENGTH_BYTES = 12;

type EncryptedPassword = {
  encryptedPassword: string;
  passwordIv: string;
};

// encode binary ciphertext as firestore-safe text
function bytesToBase64(bytes: Uint8Array) {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary);
}

// decode stored ciphertext back into bytes for web crypto
function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function importStoredKey(base64Key: string) {
  // restore the browser-held aes key after a page refresh
  return crypto.subtle.importKey(
    "raw",
    base64ToBytes(base64Key),
    AES_GCM_ALGORITHM,
    true,
    ["encrypt", "decrypt"],
  );
}

async function createStoredKey() {
  // create the local aes-gcm key used for this browser's vault records
  const key = await crypto.subtle.generateKey(
    {
      name: AES_GCM_ALGORITHM,
      length: AES_KEY_LENGTH,
    },
    true,
    ["encrypt", "decrypt"],
  );

  const rawKey = await crypto.subtle.exportKey("raw", key);
  // store the key locally so this browser can decrypt saved records later
  localStorage.setItem(
    VAULT_KEY_STORAGE_NAME,
    bytesToBase64(new Uint8Array(rawKey)),
  );

  return key;
}

async function getVaultKey() {
  const storedKey = localStorage.getItem(VAULT_KEY_STORAGE_NAME);

  // use the existing browser-held key when one has already been created
  if (storedKey) {
    return importStoredKey(storedKey);
  }

  // first use in this browser creates the vault key
  return createStoredKey();
}

export async function encryptPassword(
  password: string,
): Promise<EncryptedPassword> {
  const key = await getVaultKey();
  // aes-gcm uses a fresh iv for every password encryption
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES));
  const encodedPassword = new TextEncoder().encode(password);

  // ciphertext is encoded before it leaves the browser
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
  // restore the stored ciphertext and iv before decrypting
  const encryptedBytes = base64ToBytes(encryptedPassword);
  const iv = base64ToBytes(passwordIv);

  // plaintext exists only in browser memory after this point
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
