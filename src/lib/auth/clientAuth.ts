import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

// create a firebase account with email and password from the browser
export function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

// sign in an existing firebase account with email and password
export function logInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

// sign out the current firebase user from the browser
export function logOut() {
  return signOut(auth);
}
