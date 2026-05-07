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

// GET: load encrypted vault records for the verified user
export async function GET(request: Request) {
  const user = await verifyRequestUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Missing or invalid authorization token." },
      { status: 401 },
    );
  }

  // scope the query to this user's vault subcollection
  const snapshot = await getVaultItemsCollection(user.uid)
    .orderBy("createdAt", "desc")
    .get();

  const items = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return NextResponse.json({ items });
}

// POST: create an encrypted vault record for the verified user
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

  // reject writes without browser-encrypted password data
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

  // store records under users/{uid}/vaultItems for user isolation
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
