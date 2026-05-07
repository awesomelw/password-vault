import { adminAuth } from "@/lib/firebase/admin";

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  // remove the "Bearer " prefix before firebase admin verifies the token
  return authHeader.slice("Bearer ".length);
}

// verify the firebase id token sent with a backend request
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
