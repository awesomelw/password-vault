import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

// Creates a Firebase account with email and password from the browser.
export function signUpWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

// Signs in an existing Firebase account with email and password.
export function logInWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}
