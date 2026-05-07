import { auth } from "@/lib/firebase/client";

type CreateVaultItemInput = {
  service: string;
  username: string;
  encryptedPassword: string;
  passwordIv: string;
  notes?: string;
};

export type VaultItem = CreateVaultItemInput & {
  id: string;
};

async function getAuthHeaders() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No logged-in Firebase user.");
  }

  // Sends the Firebase ID token so backend routes can verify the user.
  const token = await user.getIdToken();

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function getVaultItems(): Promise<{ items: VaultItem[] }> {
  const response = await fetch("/api/vault", {
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Unable to load vault items.");
  }

  return response.json();
}

export async function createVaultItem(
  input: CreateVaultItemInput,
): Promise<{ item: VaultItem }> {
  const response = await fetch("/api/vault", {
    method: "POST",
    headers: {
      ...(await getAuthHeaders()),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("Unable to create vault item.");
  }

  return response.json();
}

export async function deleteVaultItem(id: string) {
  const response = await fetch(`/api/vault/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error("Unable to delete vault item.");
  }

  return response.json();
}
