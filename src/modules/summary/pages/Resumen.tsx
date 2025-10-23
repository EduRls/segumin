import React, { useEffect, useMemo, useState } from "react";
import {
  suscribirResumenes,
  crearResumenBase,
  actualizarResumenArchivos,
  eliminarResumenDoc,
  type ResumenDoc,
} from "../service/resumenes.service";
import { uploadResumenFiles, deleteResumenFiles } from "../service/storage.service";

export default function Resumenes() {
  // listado
  const [rows, setRows] = useState<ResumenDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // filtros
  const [q, setQ] = useState("");
  const [fStart, setFStart] = useState<string>("");
  const [fEnd, setFEnd] = useState<string>("");

  // nuevo resumen
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [etiquetas, setEtiquetas] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const off = suscribirResumenes((r) => {
      setRows(r);
      setLoading(false);
    });
    return () => off();
  }, []);

  const filtered = useMemo(() => {
    const txt = q.trim().toLowerCase();
    const start = fStart ? new Date(fStart) : null;
    const end = fEnd ? new Date(fEnd) : null;

    return rows.filter((r) => {
      const matchTxt =
        !txt ||
        r.titulo.toLowerCase().includes(txt) ||
        (r.descripcion || "").toLowerCase().includes(txt) ||
        (r.etiquetas || []).join(" ").toLowerCase().includes(txt);
      if (!matchTxt) return false;

      if (start || end) {
        const d = new Date(r.fecha);
        if (start && d < start) return false;
        if (end) {
          const endDay = new Date(end); endDay.setHours(23, 59, 59, 999);
          if (d > endDay) return false;
        }
      }
      return true;
    });
  }, [rows, q, fStart, fEnd]);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const fl = Array.from(e.target.files || []);
    setFiles(fl);
  }

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) {
      alert("Escribe un título.");
      return;
    }
    if (files.length === 0) {
      alert("Selecciona al menos un archivo.");
      return;
    }

    setSaving(true);
    try {
      // 1) crea doc base para obtener ID
      const etiq = etiquetas
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);
      const { id } = await crearResumenBase({
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        fecha,
        etiquetas: etiq,
      });

      // 2) sube archivos al bucket usando el ID
      const archivos = await uploadResumenFiles(id, files);

      // 3) actualiza doc con los archivos
      await actualizarResumenArchivos(id, archivos);

      // reset
      setTitulo("");
      setDescripcion("");
      setEtiquetas("");
      setFiles([]);
      alert("Resumen creado correctamente.");
    } catch (err: any) {
      console.error(err);
      alert(`Error: ${err?.message || err}`);
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(row: ResumenDoc) {
    if (!row.id) return;
    if (!confirm("¿Eliminar este resumen y sus archivos?")) return;
    try {
      const paths = (row.archivos || []).map(a => a.path);
      await deleteResumenFiles(paths);
      await eliminarResumenDoc(row.id);
    } catch (err: any) {
      console.error(err);
      alert(`Error al eliminar: ${err?.message || err}`);
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Gestor de Resúmenes</h1>
        <p className="text-sm text-gray-500">Sube documentos, filtra por nombre o fecha, y administra tu archivero digital.</p>
      </header>

      {/* Filtros */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título, descripción o etiqueta…"
            className="w-64 rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-inner outline-none focus:ring-2 focus:ring-emerald-400/30"
          />
          <div className="flex items-center gap-2">
            <input type="date" value={fStart} onChange={(e) => setFStart(e.target.value)}
                   className="rounded-xl border border-gray-200 px-2 py-1 text-sm" />
            <span className="text-gray-400">—</span>
            <input type="date" value={fEnd} onChange={(e) => setFEnd(e.target.value)}
                   className="rounded-xl border border-gray-200 px-2 py-1 text-sm" />
          </div>
          <div className="ml-auto text-sm text-gray-500">
            {loading ? "Cargando…" : `${filtered.length} resultado(s)`}
          </div>
        </div>
      </div>

      {/* Crear nuevo resumen */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <form onSubmit={onCreate} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Título *</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-inner outline-none focus:ring-2 focus:ring-emerald-400/30"
              placeholder="Ej. Resumen de Seguridad - Semana 42"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha del resumen *</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-inner outline-none focus:ring-2 focus:ring-emerald-400/30"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Etiquetas (coma separadas)</label>
            <input
              value={etiquetas}
              onChange={(e) => setEtiquetas(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-inner outline-none focus:ring-2 focus:ring-emerald-400/30"
              placeholder="seguridad, planta, junio"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm shadow-inner outline-none focus:ring-2 focus:ring-emerald-400/30"
              placeholder="Notas breves sobre el contenido del resumen…"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Archivos (PDF, DOCX, PPTX, XLSX, etc.) *</label>
            <input
              type="file"
              multiple
              onChange={onPick}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.rtf,.md,image/*"
              className="block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
            {files.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">{files.length} archivo(s) listo(s) para subir.</p>
            )}
          </div>
          <div className="md:col-span-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => { setTitulo(""); setDescripcion(""); setEtiquetas(""); setFiles([]); }}
              className="rounded-xl bg-gray-100 px-4 py-2 text-sm text-gray-800 ring-1 ring-gray-200 hover:bg-gray-200"
            >
              Limpiar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_30px_rgba(16,185,129,0.35)] hover:bg-emerald-600 disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar resumen"}
            </button>
          </div>
        </form>
      </div>

      {/* Lista de resúmenes */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f6f8fb] text-gray-600">
            <tr>
              <Th>Título</Th>
              <Th>Fecha</Th>
              <Th>Etiquetas</Th>
              <Th>Archivos</Th>
              <Th>Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-gray-100">
                <Td>
                  <div className="font-medium text-gray-900">{r.titulo}</div>
                  {r.descripcion && <div className="text-xs text-gray-500">{r.descripcion}</div>}
                </Td>
                <Td>{r.fecha}</Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {(r.etiquetas || []).map((t) => (
                      <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{t}</span>
                    ))}
                  </div>
                </Td>
                <Td>
                  <ul className="list-disc ps-4">
                    {(r.archivos || []).map((a, i) => (
                      <li key={i}>
                        <a href={a.url} target="_blank" rel="noreferrer" className="text-[#2d60ff] hover:underline">
                          {a.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onDelete(r)}
                      className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                      title="Eliminar"
                    >
                      Eliminar
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
            {filtered.length === 0 && !loading && (
              <tr>
                <Td colSpan={5}><span className="block py-8 text-center text-gray-500">Sin resúmenes.</span></Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---- helpers de tabla ---- */
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3 text-xs font-semibold">{children}</th>;
}
function Td({ children, colSpan }: { children: React.ReactNode; colSpan?: number }) {
  return <td colSpan={colSpan} className="px-5 py-3 align-top text-gray-700">{children}</td>;
}
