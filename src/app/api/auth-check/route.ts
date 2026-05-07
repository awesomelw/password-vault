import { NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/auth/serverAuth";

export async function GET(request: Request) {
  // Confirms this API request belongs to a logged-in Firebase user.
  const user = await verifyRequestUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Missing or invalid authorization token." },
      { status: 401 },
    );
  }

  return NextResponse.json({
    uid: user.uid,
    email: user.email ?? null,
  });
}
