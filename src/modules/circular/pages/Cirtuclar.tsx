import React, { useEffect, useMemo, useState } from "react";
import {
  addDoc, collection, getDocs, serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../lib/lib-firebase/app"; // <-- ajusta la ruta si tu lib está en otro lugar

type Destinatario = { email: string; nombre?: string };

type Usuario = {
  id: string;
  nombre?: string;
  correo?: string;
  area?: string;
  rol?: string;
  estado?: "Activo" | "Inactivo";
};

type DraftCircular = {
  plantilla: string;      // id/clave de la circular
  asunto: string;
  cuerpo: string;
  destinatarios: Destinatario[];
  creadoEn?: any;
  estado: "Borrador" | "Programado" | "Enviado";
};

const PLANTILLAS = [
  { id: "boletin-seguridad", label: "Boletín de Seguridad" },
  { id: "aviso-paro", label: "Aviso de Paro Programado" },
  { id: "recordatorio-capacitacion", label: "Recordatorio de Capacitación" },
];

export default function Circular() {
  // ----- estado base -----
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busca, setBusca] = useState("");
  const [seleccionados, setSeleccionados] = useState<Record<string, boolean>>({});
  const [destinatarios, setDestinatarios] = useState<Destinatario[]>([]);

  const [plantilla, setPlantilla] = useState(PLANTILLAS[0].id);
  const [asunto, setAsunto] = useState("");
  const [cuerpo, setCuerpo] = useState("");

  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoEmail, setNuevoEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingUsuarios, setLoadingUsuarios] = useState(false);

  // ----- cargar usuarios desde Firestore (colección 'usuarios') -----
  useEffect(() => {
    (async () => {
      setLoadingUsuarios(true);
      try {
        const snap = await getDocs(collection(db, "usuarios"));
        const rows: Usuario[] = [];
        snap.forEach((d) => rows.push({ id: d.id, ...(d.data() as any) }));
        // opcional: ordenar por estado/nombre
        rows.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || ""));
        setUsuarios(rows);
      } finally {
        setLoadingUsuarios(false);
      }
    })();
  }, []);

  // ----- filtros / listas derivadas -----
  const usuariosFiltrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return usuarios;
    return usuarios.filter((u) =>
      `${u.nombre || ""} ${u.correo || ""}`.toLowerCase().includes(q)
    );
  }, [usuarios, busca]);

  // ----- helpers -----
  function validateEmail(e: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
  }

  function toggleUsuario(u: Usuario) {
    setSeleccionados((prev) => {
      const next = { ...prev, [u.id]: !prev[u.id] };
      return next;
    });
  }

  function agregarSeleccionados() {
    const picked = usuarios.filter((u) => seleccionados[u.id] && u.correo);
    const nuevos: Destinatario[] = picked.map((u) => ({
      email: u.correo!, nombre: u.nombre || "",
    }));
    setDestinatarios((list) => {
      // evitar duplicados por email
      const seen = new Set(list.map((d) => d.email.toLowerCase()));
      const out = [...list];
      nuevos.forEach((n) => {
        const key = n.email.toLowerCase();
        if (!seen.has(key)) out.push(n);
      });
      return out;
    });
    setSeleccionados({});
  }

  function agregarManual() {
    const email = nuevoEmail.trim();
    const nombre = nuevoNombre.trim();
    if (!validateEmail(email)) {
      alert("Correo inválido.");
      return;
    }
    setDestinatarios((list) => {
      if (list.some((d) => d.email.toLowerCase() === email.toLowerCase())) return list;
      return [...list, { email, nombre }];
    });
    setNuevoEmail("");
    setNuevoNombre("");
  }

  function eliminarDestinatario(idx: number) {
    setDestinatarios((arr) => arr.filter((_, i) => i !== idx));
  }

  async function enviarCircular() {
    if (!destinatarios.length) {
      alert("Agrega al menos un destinatario.");
      return;
    }
    if (!asunto.trim()) {
      alert("Escribe un asunto.");
      return;
    }
    setSaving(true);
    try {
      const payload: DraftCircular = {
        plantilla,
        asunto: asunto.trim(),
        cuerpo: cuerpo.trim(),
        destinatarios,
        creadoEn: serverTimestamp() as any,
        estado: "Borrador", // luego pasará a Enviado cuando conectemos SMTP
      };
      await addDoc(collection(db, "circulares_borradores"), payload as any);
      alert(`Borrador guardado. (${destinatarios.length} destinatario(s))`);
      // reset opcional
      // setDestinatarios([]); setAsunto(""); setCuerpo("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Circulares</h1>
        <p className="text-sm text-gray-500">Selecciona usuarios, redacta tu circular y guarda el borrador de envío.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Col A: usuarios */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <input
              type="text"
              placeholder="Buscar usuario (nombre o correo)…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-inner outline-none focus:ring-2 focus:ring-emerald-400/30"
            />
          </div>
          <div className="mb-2 text-xs text-gray-500">
            {loadingUsuarios ? "Cargando usuarios…" : `${usuariosFiltrados.length} resultado(s)`}
          </div>
          <div className="max-h-[360px] overflow-y-auto rounded-xl border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f6f8fb] text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-xs font-semibold w-10"></th>
                  <th className="px-3 py-2 text-xs font-semibold">Nombre</th>
                  <th className="px-3 py-2 text-xs font-semibold">Correo</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u) => (
                  <tr key={u.id} className="border-t border-gray-100">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={!!seleccionados[u.id]}
                        onChange={() => toggleUsuario(u)}
                      />
                    </td>
                    <td className="px-3 py-2 text-gray-800">{u.nombre || "—"}</td>
                    <td className="px-3 py-2 text-gray-700">{u.correo || "—"}</td>
                  </tr>
                ))}
                {usuariosFiltrados.length === 0 && (
                  <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-500">Sin resultados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <button
              onClick={agregarSeleccionados}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Agregar seleccionados →
            </button>
          </div>
        </section>

        {/* Col B: destinatarios seleccionados + agregar manual */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-700">Destinatarios ({destinatarios.length})</div>
            <div className="text-xs text-gray-500">Añade manual o desde la lista</div>
          </div>

          {/* agregar manualmente */}
          <div className="mb-3 grid gap-2 md:grid-cols-2">
            <input
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder="Nombre (opcional)"
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-inner outline-none focus:ring-2 focus:ring-emerald-400/30"
            />
            <div className="flex gap-2">
              <input
                value={nuevoEmail}
                onChange={(e) => setNuevoEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-inner outline-none focus:ring-2 focus:ring-emerald-400/30"
              />
              <button
                onClick={agregarManual}
                className="whitespace-nowrap rounded-xl bg-[#2bff4d] px-3 py-2 text-sm font-semibold text-black shadow-[0_8px_30px_rgba(43,255,77,0.35)] hover:opacity-95"
              >
                Añadir
              </button>
            </div>
          </div>

          {/* listado */}
          <div className="max-h-[300px] overflow-y-auto rounded-xl border border-gray-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f6f8fb] text-gray-600">
                <tr>
                  <th className="px-3 py-2 text-xs font-semibold">Nombre</th>
                  <th className="px-3 py-2 text-xs font-semibold">Correo</th>
                  <th className="px-3 py-2 text-xs font-semibold w-16">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {destinatarios.map((d, i) => (
                  <tr key={`${d.email}-${i}`} className="border-t border-gray-100">
                    <td className="px-3 py-2 text-gray-800">{d.nombre || "—"}</td>
                    <td className="px-3 py-2 text-gray-700">{d.email}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => eliminarDestinatario(i)}
                        className="rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                        title="Eliminar"
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
                {destinatarios.length === 0 && (
                  <tr><td colSpan={3} className="px-3 py-6 text-center text-gray-500">Sin destinatarios.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Col C: circular (plantilla, asunto, cuerpo) */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-3 text-sm font-semibold text-gray-700">Circular</div>

          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Selecciona plantilla</label>
            <select
              value={plantilla}
              onChange={(e) => setPlantilla(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            >
              {PLANTILLAS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-600 mb-1">Asunto</label>
            <input
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder="Asunto del correo"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-inner outline-none focus:ring-2 focus:ring-emerald-400/30"
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-600 mb-1">Mensaje</label>
            <textarea
              value={cuerpo}
              onChange={(e) => setCuerpo(e.target.value)}
              rows={8}
              placeholder="Escribe el contenido de la circular…"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-inner outline-none focus:ring-2 focus:ring-emerald-400/30"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => { setAsunto(""); setCuerpo(""); }}
              className="rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-800 ring-1 ring-gray-200 hover:bg-gray-200"
              type="button"
            >
              Limpiar
            </button>
            <button
              onClick={enviarCircular}
              disabled={saving}
              className="rounded-xl bg-[#2d60ff] px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(45,96,255,0.35)] hover:opacity-95 disabled:opacity-60"
            >
              {saving ? "Guardando…" : `Enviar (${destinatarios.length})`}
            </button>
          </div>

          <p className="mt-3 text-xs text-gray-500">
            *Por ahora “Enviar” guarda un borrador en <code>circulares_borradores</code>. Luego conectamos SMTP.
          </p>
        </section>
      </div>
    </div>
  );
}
