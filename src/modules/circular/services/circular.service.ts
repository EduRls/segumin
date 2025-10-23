import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../../../lib/lib-firebase/app";

export type Destinatario = { email: string; nombre?: string };
export type DraftCircular = {
  plantilla: string;
  asunto: string;
  cuerpo: string;
  destinatarios: Destinatario[];
  creadoEn?: any;
  estado: "Borrador" | "Programado" | "Enviado";
};

export async function guardarBorradorCircular(d: Omit<DraftCircular, "creadoEn" | "estado">) {
  const payload: DraftCircular = {
    ...d,
    creadoEn: serverTimestamp() as any,
    estado: "Borrador",
  };
  const ref = await addDoc(collection(db, "circulares_borradores"), payload as any);
  return { id: ref.id };
}
