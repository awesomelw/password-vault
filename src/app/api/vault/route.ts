import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/auth/serverAuth";
import { adminDb } from "@/lib/firebase/admin";

type CreateVaultItemBody = {
  service?: unknown;
  username?: unknown;
  encryptedPassword?: unknown;
  passwordIv?: unknown;
  notes?: unknown;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getVaultItemsCollection(uid: string) {
  return adminDb.collection("users").doc(uid).collection("vaultItems");
}

// GET /api/vault loads the current user's vault records.
export async function GET(request: Request) {
  const user = await verifyRequestUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Missing or invalid authorization token." },
      { status: 401 },
    );
  }

  // Reads only the vault items owned by the verified Firebase user.
  const snapshot = await getVaultItemsCollection(user.uid)
    .orderBy("createdAt", "desc")
    .get();

  const items = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return NextResponse.json({ items });
}

// POST /api/vault creates a new encrypted vault record.
export async function POST(request: Request) {
  const user = await verifyRequestUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Missing or invalid authorization token." },
      { status: 401 },
    );
  }

  const body = (await request.json()) as CreateVaultItemBody;
  const { service, username, encryptedPassword, passwordIv, notes } = body;

  // Requires encrypted password data so plaintext never reaches Firestore.
  if (
    !isNonEmptyString(service) ||
    !isNonEmptyString(username) ||
    !isNonEmptyString(encryptedPassword) ||
    !isNonEmptyString(passwordIv)
  ) {
    return NextResponse.json(
      { error: "Service, username, encrypted password, and IV are required." },
      { status: 400 },
    );
  }

  const item = {
    service: service.trim(),
    username: username.trim(),
    encryptedPassword,
    passwordIv,
    notes: isNonEmptyString(notes) ? notes.trim() : "",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  // Stores the new record inside the verified user's vault collection.
  const docRef = await getVaultItemsCollection(user.uid).add(item);

  return NextResponse.json(
    {
      item: {
        id: docRef.id,
        ...item,
      },
    },
    { status: 201 },
  );
}
