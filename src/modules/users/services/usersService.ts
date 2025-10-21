import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc
} from "firebase/firestore";

import type { Timestamp, Unsubscribe } from "firebase/firestore";

import { db } from "../../../lib/lib-firebase/app";

// ---- Auth helpers (crear usuario sin tocar tu sesión actual) ----
import {
  getApp,
  initializeApp,
  deleteApp,
  type FirebaseOptions,
} from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signOut as signOutAuth,
} from "firebase/auth";

export type UserDoc = {
  id?: string;                 // = uid
  nombre: string;
  correo: string;
  rol: string;
  area: string;
  estado: "Activo" | "Inactivo";
  creadoEn?: Timestamp | null;
  tempPassword?: string;       // password temporal visible en UI
};

const COL = "usuarios";

/** Genera una contraseña temporal legible a partir del correo. */
export function genPasswordFromEmail(email: string) {
  const local = (email.split("@")[0] || "").replace(/[^a-zA-Z]/g, "");
  const padded = (local + "xxx").slice(0, 3);
  const L0 = (padded[0] || "x").toUpperCase();
  const L1 = (padded[1] || "x").toLowerCase();
  const L2 = (padded[2] || "x").toUpperCase();
  const letters = `${L0}${L1}${L2}`;
  const nDigits = Math.random() < 0.5 ? 3 : 4;
  let nums = "";
  for (let i = 0; i < nDigits; i++) nums += Math.floor(Math.random() * 10);
  return `${letters}${nums}@`;
}

/** Crea usuario en AUTH **sin cambiar** tu sesión y retorna el UID. */
export async function createAuthUserNoSwap(email: string, password: string): Promise<string> {
  const primary = getApp();                                 // usa tu app actual
  const cfg = primary.options as FirebaseOptions;
  const temp = initializeApp(cfg, `provisioner-${Date.now()}`); // app temporal
  const tempAuth = getAuth(temp);
  try {
    const cred = await createUserWithEmailAndPassword(tempAuth, email, password);
    return cred.user.uid;
  } finally {
    try { await signOutAuth(tempAuth); } catch { }
    try { await deleteApp(temp); } catch { }
  }
}

/** Crea usuario en AUTH y su documento en Firestore (usuarios/{uid}). */
/** Crea usuario en AUTH y su documento en Firestore (usuarios/{uid}). */
export async function crearUsuarioCompleto(
  input: Omit<UserDoc, "id" | "creadoEn" | "tempPassword">,
  opts?: { tempPassword?: string }
) {
  const email = String(input.correo || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Correo inválido.");
  }

  // Usa la contraseña proporcionada (por nombre) o genera desde email
  const tempPassword = opts?.tempPassword ?? genPasswordFromEmail(email);

  // 1) AUTH
  const uid = await createAuthUserNoSwap(email, tempPassword);

  // 2) Firestore
  const payload: UserDoc = {
    nombre: input.nombre?.trim() || email.split("@")[0],
    correo: email,
    rol: input.rol,
    area: input.area,
    estado: input.estado,
    creadoEn: serverTimestamp() as any,
    tempPassword,
  };
  await setDoc(doc(db, COL, uid), payload);

  return { uid, tempPassword };
}


/** Elimina SOLO el documento de Firestore (no borra de Auth desde cliente). */
export async function eliminarUsuarioDoc(uid: string) {
  await deleteDoc(doc(db, COL, uid));
}

/** Carga una vez. */
export async function listarUsuarios(): Promise<UserDoc[]> {
  const snap = await getDocs(collection(db, COL));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as UserDoc) }));
}

/** Suscripción en vivo (onSnapshot). */
export function suscribirUsuarios(cb: (rows: UserDoc[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COL), (snap) => {
    const rows: UserDoc[] = [];
    snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as UserDoc) }));
    // ordena por timestamp si existe (más reciente primero)
    rows.sort((a, b) => ((b.creadoEn as any)?.toMillis?.() ?? 0) - ((a.creadoEn as any)?.toMillis?.() ?? 0));
    cb(rows);
  });
}

export function genPasswordFromName(fullName: string) {
  const base = (fullName || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita acentos
    .replace(/[^a-zA-Z\s]/g, " ")                     // sólo letras/espacios
    .trim()
    .split(/\s+/);

  const first = (base[0] || "user").slice(0, 3);
  const last = (base[1] || "seg").slice(0, 3);
  // Patrón: FfF-LlL + 3–4 dígitos + @
  const partA = (first[0] || "u").toUpperCase() + (first[1] || "s").toLowerCase() + (first[2] || "e").toUpperCase();
  const partB = (last[0] || "s").toUpperCase() + (last[1] || "e").toLowerCase() + (last[2] || "g").toUpperCase();
  const nDigits = Math.random() < 0.5 ? 3 : 4;
  let nums = "";
  for (let i = 0; i < nDigits; i++) nums += Math.floor(Math.random() * 10);
  return `${partA}${partB}${nums}@`;
}

