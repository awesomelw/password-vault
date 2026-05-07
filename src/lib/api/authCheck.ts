import { auth } from "@/lib/firebase/client";

type AuthCheckResponse = {
  uid: string;
  email: string | null;
};

export async function checkBackendAuth(): Promise<AuthCheckResponse> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No logged-in Firebase user.");
  }

  // Gets a fresh Firebase ID token for the backend to verify.
  const token = await user.getIdToken();

  const response = await fetch("/api/auth-check", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Backend auth check failed.");
  }

  return response.json();
}
