import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "../../../lib/lib-firebase/app";

/** Estructura completa por secciones (payload) */
export type IncidentePayload = {
  datosGenerales: {
    reportadoPor: string;
    puestoDepartamento?: string;
    fechaReporte: string;           // YYYY-MM-DD
    incidenteNo?: string;
    area?: string;                  // “Área” (campo general)
    localizacion?: string;          // Localización específica
  };
  detalles: {
    fechaIncidente: string;         // YYYY-MM-DD
    horaIncidente: string;          // HH:mm
    tipoIncidente: "Seguridad" | "Ambiental" | "Daño a la propiedad";
    severidad: "Menor" | "Moderado" | "Mayor" | "Crítico";
    areaOcurrencia: string;         // área de ocurrencia
  };
  personasAfectadas: Array<{
    nombre: string;
    puesto?: string;
    tipoLesion?: string;
  }>;
  areaPropiedadAfectada: {
    areasAfectadas?: string;
    propiedadAfectada?: string;
    danoAmbiental?: string;
    danoPropiedad?: string;
  };
  testigos: Array<{
    nombre: string;
    puesto?: string;
  }>;

  /** NUEVO: Relato libre del incidente */
  relatoIncidente?: string;

  accionesContencion: {
    accionesTomadas?: string;       // ¿Qué acciones se tomaron?
    medidas?: string;               // Medidas inmediatas/emergencia
    recursos?: string;              // Recursos utilizados
  };
};

/** Lo que usa tu tabla/lista */
export type IncidenteRow = {
  id?: string;
  fecha: string;                    // YYYY-MM-DD (de fechaIncidente)
  area: string;                     // de detalles.areaOcurrencia
  tipo: "Incidente";
  estado: "Abierto" | "Cerrado";
  severidad: "Alta" | "Media" | "Baja"; // mapeo desde (Menor/Moderado/Mayor/Crítico)
  creadoEn?: any;
  actualizadoEn?: any;
  payload: IncidentePayload;        // secciones completas
};

const COL = "incidentes";

function mapSeveridadToList(s: IncidentePayload["detalles"]["severidad"]): IncidenteRow["severidad"] {
  if (s === "Menor") return "Baja";
  if (s === "Moderado") return "Media";
  // “Mayor” y “Crítico” se muestran como “Alta” en la lista
  return "Alta";
}

export function suscribirIncidentes(cb: (rows: IncidenteRow[]) => void): Unsubscribe {
  const q = query(collection(db, COL), orderBy("creadoEn", "desc"));
  return onSnapshot(q, (snap) => {
    const rows: IncidenteRow[] = [];
    snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as any) }));
    cb(rows);
  });
}

export async function crearIncidenteDesdePayload(
  payload: IncidentePayload,
  opts?: { estado?: IncidenteRow["estado"] }
) {
  const fecha = payload.detalles.fechaIncidente;
  const area = payload.detalles.areaOcurrencia;
  const severidad = mapSeveridadToList(payload.detalles.severidad);
  const estado: IncidenteRow["estado"] = opts?.estado ?? "Abierto";

  const ref = await addDoc(collection(db, COL), {
    fecha,
    area,
    tipo: "Incidente",
    estado,
    severidad,
    payload,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  } satisfies IncidenteRow);
  return { id: ref.id };
}

export async function cargarIncidente(id: string): Promise<IncidenteRow | null> {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as any) };
}

export async function actualizarIncidenteConPayload(
  id: string,
  payload: IncidentePayload,
  opts?: { estado?: IncidenteRow["estado"] }
) {
  const fecha = payload.detalles.fechaIncidente;
  const area = payload.detalles.areaOcurrencia;
  const severidad = mapSeveridadToList(payload.detalles.severidad);

  await updateDoc(doc(db, COL, id), {
    fecha,
    area,
    severidad,
    estado: opts?.estado ?? "Abierto",
    payload,
    actualizadoEn: serverTimestamp(),
  });
}

export async function eliminarIncidente(id: string) {
  await deleteDoc(doc(db, COL, id));
}
