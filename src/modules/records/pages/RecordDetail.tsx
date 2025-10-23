import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import {
  cargarIncidente,
  crearIncidenteDesdePayload,
  actualizarIncidenteConPayload,
  type IncidentePayload,
} from "../services/incidentes.service";
import { uploadIncidentImages } from "../services/storage.service";

export default function RecordDetail() {
  const { id } = useParams(); // "nuevo" | <docId>
  const isNew = id === "nuevo";
  const navigate = useNavigate();

  const [form, setForm] = useState<IncidentePayload>({
    datosGenerales: {
      reportadoPor: "",
      puestoDepartamento: "",
      fechaReporte: new Date().toISOString().slice(0, 10),
      incidenteNo: "",
      area: "",
      localizacion: "",
    },
    detalles: {
      fechaIncidente: new Date().toISOString().slice(0, 10),
      horaIncidente: "",
      tipoIncidente: "Seguridad",
      severidad: "Primeros Auxilios",
    },
    personasAfectadas: [],
    areaPropiedadAfectada: {
      areasAfectadas: [],
      propiedadesAfectadas: [],
    },
    testigos: [],
    relatoIncidente: "",
    relatoImagenes: [],
    accionesContencion: [],
    accionesPreventivas: [],
  });

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  // imágenes locales a subir (previas a guardar)
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isNew && id) {
        setLoading(true);
        const data = await cargarIncidente(id);
        if (alive && data?.payload) {
          const p = data.payload;
          setForm({
            ...p,
            // defaults seguros
            relatoIncidente: p.relatoIncidente ?? "",
            relatoImagenes: p.relatoImagenes ?? [],
            accionesContencion: p.accionesContencion ?? [],
            accionesPreventivas: p.accionesPreventivas ?? [],
            areaPropiedadAfectada: {
              areasAfectadas: p.areaPropiedadAfectada?.areasAfectadas ?? [],
              propiedadesAfectadas: p.areaPropiedadAfectada?.propiedadesAfectadas ?? [],
            },
            personasAfectadas: p.personasAfectadas ?? [],
            testigos: p.testigos ?? [],
          });
        }
        setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id, isNew]);

  function closeModal() {
    navigate("/registros");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      // 1) sube imágenes nuevas (si hay) a Supabase y agrega URLs al payload
      let urls: string[] = [];
      if (files.length) {
        urls = await uploadIncidentImages(files, isNew ? undefined : id);
      }
      const payload: IncidentePayload = {
        ...form,
        relatoImagenes: [...(form.relatoImagenes ?? []), ...urls].slice(0, 4),
      };

      // 2) crea/actualiza en Firestore
      if (isNew) {
        const { id: newId } = await crearIncidenteDesdePayload(payload);
        navigate(`/registros/${newId}`, { replace: true });
      } else if (id) {
        await actualizarIncidenteConPayload(id, payload);
        closeModal();
      }
    } finally {
      setSaving(false);
    }
  }

  // helpers repetibles — Personas/testigos
  const addLesionado = () =>
    setForm((f) => ({ ...f, personasAfectadas: [...f.personasAfectadas, { nombre: "", puesto: "" }] }));
  const removeLesionado = (i: number) =>
    setForm((f) => ({ ...f, personasAfectadas: f.personasAfectadas.filter((_, idx) => idx !== i) }));

  const addTestigo = () => setForm((f) => ({ ...f, testigos: [...f.testigos, { nombre: "", puesto: "" }] }));
  const removeTestigo = (i: number) =>
    setForm((f) => ({ ...f, testigos: f.testigos.filter((_, idx) => idx !== i) }));

  // helpers repetibles — Áreas/Propiedades afectadas
  const addAreaAfectada = () =>
    setForm((f) => ({ ...f, areaPropiedadAfectada: { ...f.areaPropiedadAfectada, areasAfectadas: [...f.areaPropiedadAfectada.areasAfectadas, ""] } }));
  const removeAreaAfectada = (i: number) =>
    setForm((f) => ({ ...f, areaPropiedadAfectada: { ...f.areaPropiedadAfectada, areasAfectadas: f.areaPropiedadAfectada.areasAfectadas.filter((_, idx) => idx !== i) } }));

  const addPropiedadAfectada = () =>
    setForm((f) => ({ ...f, areaPropiedadAfectada: { ...f.areaPropiedadAfectada, propiedadesAfectadas: [...f.areaPropiedadAfectada.propiedadesAfectadas, ""] } }));
  const removePropiedadAfectada = (i: number) =>
    setForm((f) => ({ ...f, areaPropiedadAfectada: { ...f.areaPropiedadAfectada, propiedadesAfectadas: f.areaPropiedadAfectada.propiedadesAfectadas.filter((_, idx) => idx !== i) } }));

  // acciones de contención
  const addContencion = () =>
    setForm((f) => ({ ...f, accionesContencion: [...f.accionesContencion, { descripcion: "", fecha: "", responsable: "" }] }));
  const removeContencion = (i: number) =>
    setForm((f) => ({ ...f, accionesContencion: f.accionesContencion.filter((_, idx) => idx !== i) }));

  // acciones preventivas
  const addPreventiva = () =>
    setForm((f) => ({
      ...f,
      accionesPreventivas: [
        ...f.accionesPreventivas,
        { descripcion: "", tipoAccion: "Preventiva", fechaCompromiso: "", fechaTermino: "", responsable: "" },
      ],
    }));
  const removePreventiva = (i: number) =>
    setForm((f) => ({ ...f, accionesPreventivas: f.accionesPreventivas.filter((_, idx) => idx !== i) }));

  // control input files
  function onPickImages(e: React.ChangeEvent<HTMLInputElement>) {
    const fl = Array.from(e.target.files ?? []);
    const next = [...files, ...fl].slice(0, 4);
    setFiles(next);
    e.currentTarget.value = "";
  }
  function removeLocalFile(i: number) {
    setFiles((arr) => arr.filter((_, idx) => idx !== i));
  }
  function removeExistingUrl(i: number) {
    setForm((f) => ({ ...f, relatoImagenes: (f.relatoImagenes ?? []).filter((_, idx) => idx !== i) }));
  }

  const root = document.getElementById("root") || document.body;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="mt-4 w-full max-w-6xl rounded-[28px] bg-white/90 shadow-[0_30px_120px_rgba(0,0,0,0.35)] ring-1 ring-black/5 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black/5 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {isNew ? "Crear Nuevo Incidente" : `Editar Incidente ${id?.slice(0, 6)}`}
          </h2>
          <button
            onClick={closeModal}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
            aria-label="Cerrar"
            title="Cerrar"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[80vh] overflow-y-auto px-6 py-6">
          {loading ? (
            <p className="p-6 text-center text-sm text-gray-500">Cargando…</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-8">

              {/* DATOS GENERALES */}
              <Card title="Datos Generales del Reporte">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Reportado por">
                    <Input value={form.datosGenerales.reportadoPor} onChange={(v) => setForm((f) => ({ ...f, datosGenerales: { ...f.datosGenerales, reportadoPor: v } }))} />
                  </Field>
                  <Field label="Puesto / Departamento">
                    <Input value={form.datosGenerales.puestoDepartamento || ""} onChange={(v) => setForm((f) => ({ ...f, datosGenerales: { ...f.datosGenerales, puestoDepartamento: v } }))} />
                  </Field>
                  <Field label="Fecha de reporte">
                    <Input type="date" value={form.datosGenerales.fechaReporte} onChange={(v) => setForm((f) => ({ ...f, datosGenerales: { ...f.datosGenerales, fechaReporte: v } }))} />
                  </Field>
                  <Field label="Incidente No.">
                    <Input value={form.datosGenerales.incidenteNo || ""} onChange={(v) => setForm((f) => ({ ...f, datosGenerales: { ...f.datosGenerales, incidenteNo: v } }))} />
                  </Field>
                  <Field label="Área">
                    <Input value={form.datosGenerales.area} onChange={(v) => setForm((f) => ({ ...f, datosGenerales: { ...f.datosGenerales, area: v } }))} />
                  </Field>
                  <Field label="Localización específica">
                    <Input value={form.datosGenerales.localizacion || ""} onChange={(v) => setForm((f) => ({ ...f, datosGenerales: { ...f.datosGenerales, localizacion: v } }))} />
                  </Field>
                </div>
              </Card>

              {/* DETALLES */}
              <Card title="Detalles del Incidente">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Fecha del incidente">
                    <Input type="date" value={form.detalles.fechaIncidente} onChange={(v) => setForm((f) => ({ ...f, detalles: { ...f.detalles, fechaIncidente: v } }))} />
                  </Field>
                  <Field label="Hora del incidente">
                    <Input type="time" value={form.detalles.horaIncidente} onChange={(v) => setForm((f) => ({ ...f, detalles: { ...f.detalles, horaIncidente: v } }))} />
                  </Field>
                  <Field label="Tipo de incidente">
                    <Select value={form.detalles.tipoIncidente} onChange={(v) => setForm((f) => ({ ...f, detalles: { ...f.detalles, tipoIncidente: v as any } }))} options={["Seguridad", "Ambiental", "Daño a la propiedad"]} />
                  </Field>
                  <Field label="Nivel de severidad">
                    <Select
                      value={form.detalles.severidad}
                      onChange={(v) => setForm((f) => ({ ...f, detalles: { ...f.detalles, severidad: v as any } }))}
                      options={["Primeros Auxilios", "Atención Médica", "Tiempo pérdido", "Fatal"]}
                    />
                  </Field>
                </div>
              </Card>

              {/* PERSONAS AFECTADAS */}
              <Card title="Personas Afectadas" action={<ButtonAdd onClick={addLesionado} label="+ Agregar" />}>
                <div className="space-y-4">
                  {form.personasAfectadas.map((p, i) => (
                    <div key={i} className="grid gap-3 rounded-2xl border border-gray-200/70 bg-white/70 p-3 md:grid-cols-2">
                      <Field label="Nombre">
                        <Input value={p.nombre} onChange={(v) => { const arr = [...form.personasAfectadas]; arr[i] = { ...arr[i], nombre: v }; setForm((f) => ({ ...f, personasAfectadas: arr })); }} />
                      </Field>
                      <Field label="Puesto / Depto.">
                        <Input value={p.puesto || ""} onChange={(v) => { const arr = [...form.personasAfectadas]; arr[i] = { ...arr[i], puesto: v }; setForm((f) => ({ ...f, personasAfectadas: arr })); }} />
                      </Field>
                      <div className="md:col-span-2">
                        <button type="button" onClick={() => removeLesionado(i)} className="text-sm text-red-600 hover:underline">Eliminar</button>
                      </div>
                    </div>
                  ))}
                  {form.personasAfectadas.length === 0 && <p className="text-sm text-gray-500">Sin personas afectadas registradas.</p>}
                </div>
              </Card>

              {/* ÁREA O PROPIEDAD AFECTADA (dinámico) */}
              <Card title="Área o Propiedad Afectada">
                {/* Áreas afectadas */}
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Área(s) afectada(s)</h4>
                    <ButtonAdd onClick={addAreaAfectada} label="+ Agregar" />
                  </div>
                  <div className="space-y-3">
                    {form.areaPropiedadAfectada.areasAfectadas.map((txt, i) => (
                      <div key={`area-${i}`} className="flex items-center gap-3">
                        <Input value={txt} onChange={(v) => {
                          const arr = [...form.areaPropiedadAfectada.areasAfectadas];
                          arr[i] = v;
                          setForm((f) => ({ ...f, areaPropiedadAfectada: { ...f.areaPropiedadAfectada, areasAfectadas: arr } }));
                        }} />
                        <button type="button" onClick={() => removeAreaAfectada(i)} className="text-sm text-red-600 hover:underline">Eliminar</button>
                      </div>
                    ))}
                    {form.areaPropiedadAfectada.areasAfectadas.length === 0 && <p className="text-sm text-gray-500">Sin áreas registradas.</p>}
                  </div>
                </div>

                {/* Propiedades afectadas */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">Propiedad(es) afectada(s)</h4>
                    <ButtonAdd onClick={addPropiedadAfectada} label="+ Agregar" />
                  </div>
                  <div className="space-y-3">
                    {form.areaPropiedadAfectada.propiedadesAfectadas.map((txt, i) => (
                      <div key={`prop-${i}`} className="flex items-center gap-3">
                        <Input value={txt} onChange={(v) => {
                          const arr = [...form.areaPropiedadAfectada.propiedadesAfectadas];
                          arr[i] = v;
                          setForm((f) => ({ ...f, areaPropiedadAfectada: { ...f.areaPropiedadAfectada, propiedadesAfectadas: arr } }));
                        }} />
                        <button type="button" onClick={() => removePropiedadAfectada(i)} className="text-sm text-red-600 hover:underline">Eliminar</button>
                      </div>
                    ))}
                    {form.areaPropiedadAfectada.propiedadesAfectadas.length === 0 && <p className="text-sm text-gray-500">Sin propiedades registradas.</p>}
                  </div>
                </div>
              </Card>

              {/* TESTIGOS */}
              <Card title="Testigos" action={<ButtonAdd onClick={addTestigo} label="+ Agregar" />}>
                <div className="space-y-4">
                  {form.testigos.map((t, i) => (
                    <div key={i} className="grid gap-3 rounded-2xl border border-gray-200/70 bg-white/70 p-3 md:grid-cols-2">
                      <Field label="Nombre"><Input value={t.nombre} onChange={(v) => { const arr = [...form.testigos]; arr[i] = { ...arr[i], nombre: v }; setForm((f) => ({ ...f, testigos: arr })); }} /></Field>
                      <Field label="Puesto / Depto."><Input value={t.puesto || ""} onChange={(v) => { const arr = [...form.testigos]; arr[i] = { ...arr[i], puesto: v }; setForm((f) => ({ ...f, testigos: arr })); }} /></Field>
                      <div className="md:col-span-2"><button type="button" onClick={() => removeTestigo(i)} className="text-sm text-red-600 hover:underline">Eliminar</button></div>
                    </div>
                  ))}
                  {form.testigos.length === 0 && <p className="text-sm text-gray-500">Sin testigos registrados.</p>}
                </div>
              </Card>

              {/* RELATO + IMÁGENES */}
              <Card title="Relato del Incidente">
                <div className="grid gap-4">
                  <Field label="Descripción general del incidente">
                    <Textarea rows={6} value={form.relatoIncidente || ""} onChange={(v) => setForm((f) => ({ ...f, relatoIncidente: v }))} />
                  </Field>

                  {/* Imágenes: existentes + nuevas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-1">Imágenes (1–4)</label>

                    {/* previews de URLs existentes */}
                    {(form.relatoImagenes ?? []).length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-3">
                        {form.relatoImagenes!.map((u, i) => (
                          <div key={u} className="relative h-24 w-32 overflow-hidden rounded-xl border">
                            <img src={u} alt={`img-${i}`} className="h-full w-full object-cover" />
                            <button type="button" onClick={() => removeExistingUrl(i)} className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">x</button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* previews de archivos locales */}
                    {files.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-3">
                        {files.map((f, i) => {
                          const url = URL.createObjectURL(f);
                          return (
                            <div key={i} className="relative h-24 w-32 overflow-hidden rounded-xl border">
                              <img src={url} className="h-full w-full object-cover" />
                              <button type="button" onClick={() => removeLocalFile(i)} className="absolute right-1 top-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">x</button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={onPickImages}
                      className="block w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-inner"
                    />
                    <p className="mt-1 text-xs text-gray-500">Formatos comunes (JPG/PNG). Máx. 4 imágenes.</p>
                  </div>
                </div>
              </Card>

              {/* ACCIONES DE CONTENCIÓN (DINÁMICAS) */}
              <Card title="Acciones de Contención" action={<ButtonAdd onClick={addContencion} label="+ Agregar" />}>
                <div className="space-y-4">
                  {form.accionesContencion.map((a, i) => (
                    <div key={i} className="grid gap-3 rounded-2xl border border-gray-200/70 bg-white/70 p-3 md:grid-cols-3">
                      <Field label="Descripción">
                        <Input value={a.descripcion} onChange={(v) => {
                          const arr = [...form.accionesContencion]; arr[i] = { ...arr[i], descripcion: v };
                          setForm((f) => ({ ...f, accionesContencion: arr }));
                        }} />
                      </Field>
                      <Field label="Fecha">
                        <Input type="date" value={a.fecha || ""} onChange={(v) => {
                          const arr = [...form.accionesContencion]; arr[i] = { ...arr[i], fecha: v };
                          setForm((f) => ({ ...f, accionesContencion: arr }));
                        }} />
                      </Field>
                      <Field label="Responsable">
                        <Input value={a.responsable || ""} onChange={(v) => {
                          const arr = [...form.accionesContencion]; arr[i] = { ...arr[i], responsable: v };
                          setForm((f) => ({ ...f, accionesContencion: arr }));
                        }} />
                      </Field>
                      <div className="md:col-span-3">
                        <button type="button" onClick={() => removeContencion(i)} className="text-sm text-red-600 hover:underline">Eliminar</button>
                      </div>
                    </div>
                  ))}
                  {form.accionesContencion.length === 0 && <p className="text-sm text-gray-500">Sin acciones registradas.</p>}
                </div>
              </Card>

              {/* ACCIONES PREVENTIVAS/CORRECTIVAS/MEJORA (DINÁMICAS) */}
              <Card title="Acciones Preventivas / Correctivas / Mejora" action={<ButtonAdd onClick={addPreventiva} label="+ Agregar" />}>
                <div className="space-y-4">
                  {form.accionesPreventivas.map((a, i) => (
                    <div key={i} className="grid gap-3 rounded-2xl border border-gray-200/70 bg-white/70 p-3 md:grid-cols-5">
                      <Field label="Descripción" >
                        <Input value={a.descripcion} onChange={(v) => {
                          const arr = [...form.accionesPreventivas]; arr[i] = { ...arr[i], descripcion: v };
                          setForm((f) => ({ ...f, accionesPreventivas: arr }));
                        }} />
                      </Field>
                      <Field label="Tipo de acción">
                        <Select value={a.tipoAccion} onChange={(v) => {
                          const arr = [...form.accionesPreventivas]; arr[i] = { ...arr[i], tipoAccion: v as any };
                          setForm((f) => ({ ...f, accionesPreventivas: arr }));
                        }} options={["Preventiva", "Correctiva", "Mejora"]} />
                      </Field>
                      <Field label="Fecha compromiso">
                        <Input type="date" value={a.fechaCompromiso || ""} onChange={(v) => {
                          const arr = [...form.accionesPreventivas]; arr[i] = { ...arr[i], fechaCompromiso: v };
                          setForm((f) => ({ ...f, accionesPreventivas: arr }));
                        }} />
                      </Field>
                      <Field label="Fecha de término">
                        <Input type="date" value={a.fechaTermino || ""} onChange={(v) => {
                          const arr = [...form.accionesPreventivas]; arr[i] = { ...arr[i], fechaTermino: v };
                          setForm((f) => ({ ...f, accionesPreventivas: arr }));
                        }} />
                      </Field>
                      <Field label="Responsable">
                        <Input value={a.responsable || ""} onChange={(v) => {
                          const arr = [...form.accionesPreventivas]; arr[i] = { ...arr[i], responsable: v };
                          setForm((f) => ({ ...f, accionesPreventivas: arr }));
                        }} />
                      </Field>
                      <div className="md:col-span-5">
                        <button type="button" onClick={() => removePreventiva(i)} className="text-sm text-red-600 hover:underline">Eliminar</button>
                      </div>
                    </div>
                  ))}
                  {form.accionesPreventivas.length === 0 && <p className="text-sm text-gray-500">Sin acciones registradas.</p>}
                </div>
              </Card>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={closeModal} className="rounded-2xl bg-gray-100 px-4 py-2 font-medium text-gray-800 ring-1 ring-gray-200 hover:bg-gray-200">Cancelar</button>
                <button type="submit" disabled={saving} className="rounded-2xl bg-emerald-500 px-4 py-2 font-semibold text-white shadow-[0_10px_30px_rgba(16,185,129,0.35)] hover:bg-emerald-600 disabled:opacity-60">
                  {isNew ? (saving ? "Creando..." : "Guardar Incidente") : (saving ? "Guardando..." : "Guardar Cambios")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    root
  );
}

/* ——— UI helpers ——— */
function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="rounded-[22px] border border-gray-200/70 bg-white/80 p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-medium text-gray-900">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-800">{label}</label>
      {children}
    </div>
  );
}
function ButtonAdd({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50">
      {label}
    </button>
  );
}
function Input({ value, onChange, type = "text" }: { value: string; onChange: (v: string) => void; type?: React.HTMLInputTypeAttribute; }) {
  return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-inner outline-none focus:ring-2 focus:ring-emerald-400/40" />;
}
function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[]; }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-inner outline-none focus:ring-2 focus:ring-emerald-400/40">
      {options.map((op) => (<option key={op} value={op}>{op}</option>))}
    </select>
  );
}
function Textarea({ value, onChange, rows = 3 }: { value: string; onChange: (v: string) => void; rows?: number; }) {
  return <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-inner outline-none focus:ring-2 focus:ring-emerald-400/40" />;
}
