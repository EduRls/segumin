import {
    addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, type Unsubscribe
} from "firebase/firestore";
import { db } from "../../../lib/lib-firebase/app";

export type ResumenArchivo = {
    name: string;
    url: string;
    path: string;     // ruta en el bucket, para eliminarlo
    type?: string;
    size?: number;
};

export type ResumenDoc = {
    id?: string;
    titulo: string;
    descripcion?: string;
    fecha: string;              // YYYY-MM-DD (fecha del resumen)
    etiquetas?: string[];
    archivos: ResumenArchivo[]; // 1..N archivos subidos
    creadoEn?: any;
    actualizadoEn?: any;
};

const COL = "resumenes";

/** Suscripción en vivo. Orden principal por fecha desc, luego creadoEn desc. */
export function suscribirResumenes(cb: (rows: ResumenDoc[]) => void): Unsubscribe {
    const q = query(
        collection(db, COL),
        orderBy("creadoEn", "desc")
    );
    return onSnapshot(q, (snap) => {
        const rows: ResumenDoc[] = [];
        snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as any) }));
        cb(rows);
    });
}

/** Crea documento vacío para obtener ID. */
export async function crearResumenBase(input: Omit<ResumenDoc, "id" | "archivos" | "creadoEn" | "actualizadoEn">) {
    const payload = {
        titulo: input.titulo,
        descripcion: input.descripcion || "",
        fecha: input.fecha,
        etiquetas: input.etiquetas ?? [],
        archivos: [],
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
    } satisfies ResumenDoc;
    const ref = await addDoc(collection(db, COL), payload as any);
    return { id: ref.id };
}

/** Actualiza el doc con los archivos subidos. */
export async function actualizarResumenArchivos(id: string, archivos: ResumenArchivo[]) {
    await updateDoc(doc(db, COL, id), {
        archivos,
        actualizadoEn: serverTimestamp(),
    });
}

/** Elimina doc (Firestore). Ojo: borra archivos en Supabase desde la UI con storage.delete. */
export async function eliminarResumenDoc(id: string) {
    await deleteDoc(doc(db, COL, id));
}
