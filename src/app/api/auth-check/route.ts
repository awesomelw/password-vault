import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  // Removes the "Bearer " prefix so Firebase Admin receives only the token.
  return authHeader.slice("Bearer ".length);
}

export async function GET(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return NextResponse.json(
      { error: "Missing authorization token." },
      { status: 401 },
    );
  }

  try {
    // Verifies the browser token and identifies the Firebase user.
    const decodedToken = await adminAuth.verifyIdToken(token);

    return NextResponse.json({
      uid: decodedToken.uid,
      email: decodedToken.email ?? null,
    });
  } catch {
    return NextResponse.json(
      { error: "Invalid authorization token." },
      { status: 401 },
    );
  }
}
