import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { verifyRequestUser } from "@/lib/auth/serverAuth";
import { adminDb } from "@/lib/firebase/admin";

type VaultItemRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateVaultItemBody = {
  service?: unknown;
  username?: unknown;
  notes?: unknown;
  encryptedPassword?: unknown;
  passwordIv?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getVaultItemDocument(uid: string, id: string) {
  return adminDb.collection("users").doc(uid).collection("vaultItems").doc(id);
}

// PATCH: update one encrypted vault record for the verified user
export async function PATCH(
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

  const body = (await request.json()) as UpdateVaultItemBody;
  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };

  // update text fields only when valid values are provided
  if (isNonEmptyString(body.service)) {
    updates.service = body.service.trim();
  }

  if (isNonEmptyString(body.username)) {
    updates.username = body.username.trim();
  }

  if (typeof body.notes === "string") {
    updates.notes = body.notes.trim();
  }

  // password ciphertext and iv must be rotated together
  if (
    isNonEmptyString(body.encryptedPassword) ||
    isNonEmptyString(body.passwordIv)
  ) {
    if (
      !isNonEmptyString(body.encryptedPassword) ||
      !isNonEmptyString(body.passwordIv)
    ) {
      return NextResponse.json(
        { error: "Encrypted password and IV must be updated together." },
        { status: 400 },
      );
    }

    updates.encryptedPassword = body.encryptedPassword;
    updates.passwordIv = body.passwordIv;
  }

  if (Object.keys(updates).length === 1) {
    return NextResponse.json(
      { error: "At least one update field is required." },
      { status: 400 },
    );
  }

  // apply validated changes inside this user's vault collection
  await getVaultItemDocument(user.uid, id).update(updates);

  return NextResponse.json({ success: true });
}

// DELETE: remove one vault record for the verified user
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

  // delete only inside users/{uid}/vaultItems
  await getVaultItemDocument(user.uid, id).delete();

  return NextResponse.json({ success: true });
}
