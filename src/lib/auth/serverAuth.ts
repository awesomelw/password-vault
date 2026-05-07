import { adminAuth } from "@/lib/firebase/admin";

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  // Removes the "Bearer " prefix so Firebase Admin receives only the token.
  return authHeader.slice("Bearer ".length);
}

// Verifies the Firebase ID token sent with a backend request.
export async function verifyRequestUser(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  try {
    return await adminAuth.verifyIdToken(token);
  } catch {
    return null;
  }
}
