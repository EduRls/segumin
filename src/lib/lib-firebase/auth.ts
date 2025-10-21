// src/firebase/auth.ts
import { auth } from "./app";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";

export function observeAuth(cb: (u: User | null) => void) {
  return onAuthStateChanged(auth, cb);
}

export async function emailPasswordSignIn(email: string, password: string) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signOut() {
  await fbSignOut(auth);
}
