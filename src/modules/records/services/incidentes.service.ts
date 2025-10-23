import {
  addDoc, collection, deleteDoc, doc, getDoc, onSnapshot,
  orderBy, query, serverTimestamp, updateDoc, type Unsubscribe
} from "firebase/firestore";
import { db } from "../../../lib/lib-firebase/app";

/** Estructura completa por secciones (payload) */
export type IncidentePayload = {
  datosGenerales: {
    reportadoPor: string;
    puestoDepartamento?: string;
    fechaReporte: string;                 // YYYY-MM-DD
    incidenteNo?: string;
    area: string;                         // Área general (para la lista)
    localizacion?: string;
  };
  detalles: {
    fechaIncidente: string;               // YYYY-MM-DD
    horaIncidente: string;                // HH:mm
    tipoIncidente: "Seguridad" | "Ambiental" | "Daño a la propiedad";
    // Nueva clasificación solicitada
    severidad: "Primeros Auxilios" | "Atención Médica" | "Tiempo pérdido" | "Fatal";
    // áreaOcurrencia eliminado
  };

  personasAfectadas: Array<{
    nombre: string;
    puesto?: string;
    // tipoLesion eliminado
  }>;

  /** Ahora ambas son listas dinámicas */
  areaPropiedadAfectada: {
    areasAfectadas: string[];             // dinámico
    propiedadesAfectadas: string[];       // dinámico
  };

  testigos: Array<{
    nombre: string;
    puesto?: string;
  }>;

  /** Relato + imágenes (URLs públicas) */
  relatoIncidente?: string;
  relatoImagenes?: string[];              // 0..4 URLs

  /** Acciones de contención (dinámicas) */
  accionesContencion: Array<{
    descripcion: string;
    fecha?: string;                       // YYYY-MM-DD
    responsable?: string;
  }>;

  /** Acciones preventivas/correctivas/mejora (dinámicas) */
  accionesPreventivas: Array<{
    descripcion: string;
    tipoAccion: "Preventiva" | "Correctiva" | "Mejora";
    fechaCompromiso?: string;             // YYYY-MM-DD
    fechaTermino?: string;                // YYYY-MM-DD
    responsable?: string;
  }>;
};

/** Lo que usa tu tabla/lista */
export type IncidenteRow = {
  id?: string;
  fecha: string;                          // YYYY-MM-DD (de detalles.fechaIncidente)
  area: string;                           // de datosGenerales.area
  tipo: "Incidente";
  estado: "Abierto" | "Cerrado";
  severidad: "Alta" | "Media" | "Baja";   // mapeo desde severidad nueva
  creadoEn?: any;
  actualizadoEn?: any;
  payload: IncidentePayload;              // secciones completas
};

const COL = "incidentes";

// Mapeo solicitado:
// Primeros Auxilios -> Baja
// Atención Médica   -> Media
// Tiempo pérdido    -> Alta
// Fatal             -> Alta
function mapSeveridadToList(
  s: IncidentePayload["detalles"]["severidad"]
): IncidenteRow["severidad"] {
  if (s === "Primeros Auxilios") return "Baja";
  if (s === "Atención Médica") return "Media";
  return "Alta"; // Tiempo pérdido y Fatal
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
  const area = payload.datosGenerales.area;
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
  const area = payload.datosGenerales.area;
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
