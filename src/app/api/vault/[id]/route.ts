import { NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/auth/serverAuth";
import { adminDb } from "@/lib/firebase/admin";

type VaultItemRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function getVaultItemDocument(uid: string, id: string) {
  return adminDb.collection("users").doc(uid).collection("vaultItems").doc(id);
}

// DELETE /api/vault/[id] removes one vault record owned by the current user.
export async function DELETE(
  request: Request,
  { params }: VaultItemRouteContext,
) {
  const user = await verifyRequestUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Missing or invalid authorization token." },
      { status: 401 },
    );
  }

  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: "Vault item id is required." },
      { status: 400 },
    );
  }

  // Deletes only from the verified user's vault collection.
  await getVaultItemDocument(user.uid, id).delete();

  return NextResponse.json({ success: true });
}
