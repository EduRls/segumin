import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import {
  cargarIncidente,
  crearIncidenteDesdePayload,
  actualizarIncidenteConPayload,
  type IncidentePayload,
} from "../services/incidentes.service";

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
      severidad: "Menor",
      areaOcurrencia: "",
    },
    personasAfectadas: [],
    areaPropiedadAfectada: {
      areasAfectadas: "",
      propiedadAfectada: "",
      danoAmbiental: "",
      danoPropiedad: "",
    },
    testigos: [],
    relatoIncidente: "",
    accionesContencion: {
      accionesTomadas: "",
      medidas: "",
      recursos: "",
    },
  });

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!isNew && id) {
        setLoading(true);
        const data = await cargarIncidente(id);
        if (alive && data?.payload) setForm(data.payload);
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id, isNew]);

  function closeModal() {
    navigate("/registros");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (isNew) {
        const { id: newId } = await crearIncidenteDesdePayload(form);
        navigate(`/registros/${newId}`, { replace: true });
      } else if (id) {
        await actualizarIncidenteConPayload(id, form);
        closeModal();
      }
    } finally {
      setSaving(false);
    }
  }

  const addLesionado = () =>
    setForm((f) => ({
      ...f,
      personasAfectadas: [...f.personasAfectadas, { nombre: "", puesto: "", tipoLesion: "" }],
    }));
  const removeLesionado = (i: number) =>
    setForm((f) => ({ ...f, personasAfectadas: f.personasAfectadas.filter((_, idx) => idx !== i) }));

  const addTestigo = () => setForm((f) => ({ ...f, testigos: [...f.testigos, { nombre: "", puesto: "" }] }));
  const removeTestigo = (i: number) =>
    setForm((f) => ({ ...f, testigos: f.testigos.filter((_, idx) => idx !== i) }));

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
                    <Input
                      value={form.datosGenerales.reportadoPor}
                      onChange={(v) =>
                        setForm((f) => ({ ...f, datosGenerales: { ...f.datosGenerales, reportadoPor: v } }))
                      }
                    />
                  </Field>
                  <Field label="Puesto / Departamento">
                    <Input
                      value={form.datosGenerales.puestoDepartamento || ""}
                      onChange={(v) =>
                        setForm((f) => ({ ...f, datosGenerales: { ...f.datosGenerales, puestoDepartamento: v } }))
                      }
                    />
                  </Field>
                  <Field label="Fecha de reporte">
                    <Input
                      type="date"
                      value={form.datosGenerales.fechaReporte}
                      onChange={(v) =>
                        setForm((f) => ({ ...f, datosGenerales: { ...f.datosGenerales, fechaReporte: v } }))
                      }
                    />
                  </Field>
                  <Field label="Incidente No.">
                    <Input
                      value={form.datosGenerales.incidenteNo || ""}
                      onChange={(v) =>
                        setForm((f) => ({ ...f, datosGenerales: { ...f.datosGenerales, incidenteNo: v } }))
                      }
                    />
                  </Field>
                  <Field label="Área">
                    <Input
                      value={form.datosGenerales.area || ""}
                      onChange={(v) =>
                        setForm((f) => ({ ...f, datosGenerales: { ...f.datosGenerales, area: v } }))
                      }
                    />
                  </Field>
                  <Field label="Localización específica">
                    <Input
                      value={form.datosGenerales.localizacion || ""}
                      onChange={(v) =>
                        setForm((f) => ({ ...f, datosGenerales: { ...f.datosGenerales, localizacion: v } }))
                      }
                    />
                  </Field>
                </div>
              </Card>

              {/* DETALLES */}
              <Card title="Detalles del Incidente">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Fecha del incidente">
                    <Input
                      type="date"
                      value={form.detalles.fechaIncidente}
                      onChange={(v) =>
                        setForm((f) => ({ ...f, detalles: { ...f.detalles, fechaIncidente: v } }))
                      }
                    />
                  </Field>
                  <Field label="Hora del incidente">
                    <Input
                      type="time"
                      value={form.detalles.horaIncidente}
                      onChange={(v) =>
                        setForm((f) => ({ ...f, detalles: { ...f.detalles, horaIncidente: v } }))
                      }
                    />
                  </Field>
                  <Field label="Tipo de incidente">
                    <Select
                      value={form.detalles.tipoIncidente}
                      onChange={(v) =>
                        setForm((f) => ({ ...f, detalles: { ...f.detalles, tipoIncidente: v as any } }))
                      }
                      options={["Seguridad", "Ambiental", "Daño a la propiedad"]}
                    />
                  </Field>
                  <Field label="Nivel de severidad">
                    <Select
                      value={form.detalles.severidad}
                      onChange={(v) =>
                        setForm((f) => ({ ...f, detalles: { ...f.detalles, severidad: v as any } }))
                      }
                      options={["Menor", "Moderado", "Mayor", "Crítico"]}
                    />
                  </Field>
                  <Field label="Área de ocurrencia (ej. Planta, Trituración)">
                    <Input
                      value={form.detalles.areaOcurrencia}
                      onChange={(v) =>
                        setForm((f) => ({ ...f, detalles: { ...f.detalles, areaOcurrencia: v } }))
                      }
                    />
                  </Field>
                </div>
              </Card>

              {/* PERSONAS AFECTADAS */}
              <Card
                title="Personas Afectadas"
                action={<ButtonAdd onClick={addLesionado} label="+ Agregar" />}
              >
                <div className="space-y-4">
                  {form.personasAfectadas.map((p, i) => (
                    <div key={i} className="grid gap-3 rounded-2xl border border-gray-200/70 bg-white/70 p-3 md:grid-cols-3">
                      <Field label="Nombre">
                        <Input
                          value={p.nombre}
                          onChange={(v) => {
                            const arr = [...form.personasAfectadas];
                            arr[i] = { ...arr[i], nombre: v };
                            setForm((f) => ({ ...f, personasAfectadas: arr }));
                          }}
                        />
                      </Field>
                      <Field label="Puesto / Depto.">
                        <Input
                          value={p.puesto || ""}
                          onChange={(v) => {
                            const arr = [...form.personasAfectadas];
                            arr[i] = { ...arr[i], puesto: v };
                            setForm((f) => ({ ...f, personasAfectadas: arr }));
                          }}
                        />
                      </Field>
                      <Field label="Tipo de lesión (si aplica)">
                        <Input
                          value={p.tipoLesion || ""}
                          onChange={(v) => {
                            const arr = [...form.personasAfectadas];
                            arr[i] = { ...arr[i], tipoLesion: v };
                            setForm((f) => ({ ...f, personasAfectadas: arr }));
                          }}
                        />
                      </Field>
                      <div className="md:col-span-3">
                        <button
                          type="button"
                          onClick={() => removeLesionado(i)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                  {form.personasAfectadas.length === 0 && (
                    <p className="text-sm text-gray-500">Sin personas afectadas registradas.</p>
                  )}
                </div>
              </Card>

              {/* ÁREA O PROPIEDAD AFECTADA */}
              <Card title="Área o Propiedad Afectada">
                <div className="grid gap-4">
                  <Field label="Área(s) afectada(s)">
                    <Input
                      value={form.areaPropiedadAfectada.areasAfectadas || ""}
                      onChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          areaPropiedadAfectada: { ...f.areaPropiedadAfectada, areasAfectadas: v },
                        }))
                      }
                    />
                  </Field>
                  <Field label="Propiedad(es) afectada(s)">
                    <Input
                      value={form.areaPropiedadAfectada.propiedadAfectada || ""}
                      onChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          areaPropiedadAfectada: { ...f.areaPropiedadAfectada, propiedadAfectada: v },
                        }))
                      }
                    />
                  </Field>
                  <Field label="Daño ambiental (descripción)">
                    <Textarea
                      rows={3}
                      value={form.areaPropiedadAfectada.danoAmbiental || ""}
                      onChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          areaPropiedadAfectada: { ...f.areaPropiedadAfectada, danoAmbiental: v },
                        }))
                      }
                    />
                  </Field>
                  <Field label="Daño a la propiedad (descripción/valoración)">
                    <Textarea
                      rows={3}
                      value={form.areaPropiedadAfectada.danoPropiedad || ""}
                      onChange={(v) =>
                        setForm((f) => ({
                          ...f,
                          areaPropiedadAfectada: { ...f.areaPropiedadAfectada, danoPropiedad: v },
                        }))
                      }
                    />
                  </Field>
                </div>
              </Card>

              {/* TESTIGOS */}
              <Card
                title="Testigos"
                action={<ButtonAdd onClick={addTestigo} label="+ Agregar" />}
              >
                <div className="space-y-4">
                  {form.testigos.map((t, i) => (
                    <div key={i} className="grid gap-3 rounded-2xl border border-gray-200/70 bg-white/70 p-3 md:grid-cols-2">
                      <Field label="Nombre">
                        <Input
                          value={t.nombre}
                          onChange={(v) => {
                            const arr = [...form.testigos];
                            arr[i] = { ...arr[i], nombre: v };
                            setForm((f) => ({ ...f, testigos: arr }));
                          }}
                        />
                      </Field>
                      <Field label="Puesto / Depto.">
                        <Input
                          value={t.puesto || ""}
                          onChange={(v) => {
                            const arr = [...form.testigos];
                            arr[i] = { ...arr[i], puesto: v };
                            setForm((f) => ({ ...f, testigos: arr }));
                          }}
                        />
                      </Field>
                      <div className="md:col-span-2">
                        <button
                          type="button"
                          onClick={() => removeTestigo(i)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                  {form.testigos.length === 0 && (
                    <p className="text-sm text-gray-500">Sin testigos registrados.</p>
                  )}
                </div>
              </Card>

              {/* RELATO DEL INCIDENTE */}
              <Card title="Relato del Incidente">
                <div className="grid gap-4">
                  <Field label="Descripción general del incidente">
                    <Textarea
                      rows={6}
                      value={form.relatoIncidente || ""}
                      onChange={(v) => setForm((f) => ({ ...f, relatoIncidente: v }))}
                    />
                  </Field>
                </div>
              </Card>

              {/* ACCIONES DE CONTENCIÓN */}
              <Card title="Acciones de Contención">
                <div className="grid gap-4">
                  <Field label="¿Qué acciones se tomaron?">
                    <Textarea
                      rows={3}
                      value={form.accionesContencion.accionesTomadas || ""}
                      onChange={(v) =>
                        setForm((f) => ({ ...f, accionesContencion: { ...f.accionesContencion, accionesTomadas: v } }))
                      }
                    />
                  </Field>
                  <Field label="Medidas inmediatas o de emergencia">
                    <Textarea
                      rows={3}
                      value={form.accionesContencion.medidas || ""}
                      onChange={(v) =>
                        setForm((f) => ({ ...f, accionesContencion: { ...f.accionesContencion, medidas: v } }))
                      }
                    />
                  </Field>
                  <Field label="Recursos utilizados">
                    <Textarea
                      rows={3}
                      value={form.accionesContencion.recursos || ""}
                      onChange={(v) =>
                        setForm((f) => ({ ...f, accionesContencion: { ...f.accionesContencion, recursos: v } }))
                      }
                    />
                  </Field>
                </div>
              </Card>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl bg-gray-100 px-4 py-2 font-medium text-gray-800 ring-1 ring-gray-200 hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-2xl bg-emerald-500 px-4 py-2 font-semibold text-white shadow-[0_10px_30px_rgba(16,185,129,0.35)] hover:bg-emerald-600 disabled:opacity-60"
                >
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

/* ——— UI helpers con el look del modal ——— */

function Card({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
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
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 shadow-sm hover:bg-gray-50"
    >
      {label}
    </button>
  );
}

function Input({
  value,
  onChange,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  type?: React.HTMLInputTypeAttribute;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-inner outline-none focus:ring-2 focus:ring-emerald-400/40"
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-inner outline-none focus:ring-2 focus:ring-emerald-400/40"
    >
      {options.map((op) => (
        <option key={op} value={op}>
          {op}
        </option>
      ))}
    </select>
  );
}

function Textarea({
  value,
  onChange,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 w-full rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-inner outline-none focus:ring-2 focus:ring-emerald-400/40"
    />
  );
}
