import { NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/auth/serverAuth";

export async function GET(request: Request) {
  // confirm this api request belongs to a signed-in firebase user
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
