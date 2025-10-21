import { useEffect, useMemo, useState } from "react";
import {
  crearUsuarioCompleto,
  eliminarUsuarioDoc,
  suscribirUsuarios,
  genPasswordFromName,
  type UserDoc,
} from "../services/usersService";

type TabKey = "areas" | "turnos" | "equipos";

export default function Users() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("areas");
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<UserDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Suscripción en vivo
  useEffect(() => {
    setLoading(true);
    const off = suscribirUsuarios((list) => {
      setRows(list);
      setLoading(false);
    });
    return off;
  }, []);

  // Convierte Timestamp | Date | null a ms
  function toMillis(ts?: any): number {
    if (!ts) return 0;
    if (typeof ts.toMillis === "function") return ts.toMillis();
    if (typeof ts.toDate === "function") return ts.toDate().getTime();
    if (ts instanceof Date) return ts.getTime();
    return 0;
  }

  // "hace 5 min", "hace 2 h", "ayer", "hace 3 d"
  function timeAgo(ts?: any): string {
    const ms = toMillis(ts);
    if (!ms) return "sin fecha";
    const diff = Date.now() - ms;
    const sec = Math.max(1, Math.floor(diff / 1000));
    if (sec < 60) return `hace ${sec} s`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `hace ${min} min`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `hace ${hr} h`;
    const d = Math.floor(hr / 24);
    if (d === 1) return "ayer";
    return `hace ${d} d`;
  }


  // Filtro de búsqueda
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (u) =>
        (u.nombre || "").toLowerCase().includes(s) ||
        (u.correo || "").toLowerCase().includes(s) ||
        (u.rol || "").toLowerCase().includes(s) ||
        (u.area || "").toLowerCase().includes(s)
    );
  }, [q, rows]);

  // Crear usuario (Auth + Firestore)
  async function handleCreate(
    data: Omit<UserDoc, "id" | "creadoEn" | "tempPassword">,
    tempPassword?: string
  ) {
    setSaving(true);
    setError(null);
    try {
      const { tempPassword: used } = await crearUsuarioCompleto(data, { tempPassword });
      setOpen(false);
      alert(`✅ Usuario creado:\nCorreo: ${data.correo}\nContraseña: ${used}`);
    } catch (e: any) {
      setError(e?.message ?? "No fue posible crear el usuario.");
    } finally {
      setSaving(false);
    }
  }

  // Eliminar doc en Firestore
  async function handleDelete(id?: string) {
    if (!id) return;
    if (!confirm("¿Eliminar este usuario del listado? (No borra de Auth)")) return;
    try {
      await eliminarUsuarioDoc(id);
      alert("Usuario eliminado de Firestore.");
    } catch {
      alert("No se pudo eliminar. Intenta de nuevo.");
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_360px]">
      {/* Principal */}
      <section className="space-y-5">
        <header className="flex items-center justify-between animate-fade-in-up">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Gestión de Personal y Roles
            </h1>
            <p className="text-sm text-gray-500">Crea, edita y administra cuentas y permisos.</p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#2bff4d] px-4 py-2 text-sm font-semibold text-black shadow-[0_8px_30px_rgba(43,255,77,0.35)] transition-all hover:shadow-[0_12px_40px_rgba(43,255,77,0.55)] hover:scale-[1.02] active:scale-[0.98]"
          >
            ＋ Crear Usuario
          </button>
        </header>

        {/* Buscador */}
        <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm animate-fade-in-up delay-1">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, rol, área o correo…"
            className="w-full rounded-xl border border-gray-200 bg-[#f9fafb] px-3 py-2 text-sm outline-none"
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Tabla */}
        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-sm text-gray-600">
            Cargando usuarios…
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm animate-fade-in-up delay-2">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f6f8fb] text-gray-600">
                <tr>
                  <Th>NOMBRE</Th>
                  <Th>CORREO</Th>
                  <Th>ROL</Th>
                  <Th>ÁREA</Th>
                  <Th>ESTADO</Th>
                  <Th>ACCIONES</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-t border-gray-100 transition hover:bg-gray-50/50">
                    <Td className="font-medium">{u.nombre}</Td>
                    <Td>{u.correo}</Td>
                    <Td>{u.rol}</Td>
                    <Td>{u.area}</Td>
                    <Td>
                      {u.estado === "Activo" ? (
                        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">Activo</span>
                      ) : (
                        <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-medium text-gray-700">Inactivo</span>
                      )}
                    </Td>
                    <Td className="flex items-center gap-3 py-4">
                      <button className="text-[#2d60ff] hover:underline" title="Editar">✎</button>
                      <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:underline" title="Eliminar">🗑</button>
                    </Td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-center text-sm text-gray-500">
                      {q ? "Sin resultados para tu búsqueda." : "Aún no hay usuarios."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pestañas simples */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm animate-fade-in-up delay-3">
          <div className="flex gap-2">
            <TabButton active={tab === "areas"} onClick={() => setTab("areas")}>Áreas</TabButton>
            <TabButton active={tab === "turnos"} onClick={() => setTab("turnos")}>Turnos</TabButton>
            <TabButton active={tab === "equipos"} onClick={() => setTab("equipos")}>Equipos</TabButton>
          </div>
          <div className="mt-4">
            {tab === "areas" && <AreasPanel />}
            {tab === "turnos" && <TurnosPanel />}
            {tab === "equipos" && <EquiposPanel />}
          </div>
        </div>
      </section>

      {/* Lateral (Actividad reciente basada en Firestore) */}
      <aside className="space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm animate-fade-in-up">
          <h3 className="mb-3 text-base font-semibold">Actividad Reciente</h3>

          {/* Toma los últimos 8 por fecha de creación */}
          {rows.length === 0 ? (
            <p className="text-sm text-gray-500">Aún no hay actividad.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {[...rows]
                .sort((a, b) => (toMillis(b.creadoEn) - toMillis(a.creadoEn)))
                .slice(0, 8)
                .map((u) => (
                  <li key={`act-${u.id}-${toMillis(u.creadoEn)}`}>
                    <b>{u.nombre || "Usuario"}</b>{" "}
                    <span className="text-gray-700">fue creado</span>{" "}
                    {u.estado === "Activo" ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700 align-middle">
                        Activo
                      </span>
                    ) : (
                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-700 align-middle">
                        Inactivo
                      </span>
                    )}{" "}
                    <span className="text-gray-500">· {timeAgo(u.creadoEn)}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>
      </aside>


      {/* Modal de creación */}
      {open && (
        <NewUserModal onClose={() => setOpen(false)} onSave={handleCreate} saving={saving} />
      )}
    </div>
  );
}

/* ---------- Auxiliares ---------- */
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3 text-xs font-semibold">{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-4 text-gray-700 ${className}`}>{children}</td>;
}
function TabButton({ children, active, onClick }: { children: React.ReactNode; active?: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-2xl border px-4 py-2 text-sm transition-all hover:scale-[1.02] ${active ? "border-[#2bff4d] bg-[#eaffef] text-gray-900"
        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
        }`}
    >
      {children}
    </button>
  );
}

/* ---------- Panels demo ---------- */
function AreasPanel() {
  const areas = ["Extracción", "Procesamiento", "Exploración", "Mantenimiento", "Administración"];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-fade-in-up">
      {areas.map((a) => (
        <div key={a} className="rounded-xl border border-gray-200 bg-[#f9fafb] px-4 py-3 text-sm">
          {a}
        </div>
      ))}
    </div>
  );
}
function TurnosPanel() {
  const turnos = [
    { nombre: "Turno A", horario: "06:00–14:00" },
    { nombre: "Turno B", horario: "14:00–22:00" },
    { nombre: "Turno C", horario: "22:00–06:00" },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white animate-fade-in-up">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#f6f8fb] text-gray-600"><tr><Th>Turno</Th><Th>Horario</Th></tr></thead>
        <tbody>
          {turnos.map((t) => (
            <tr key={t.nombre} className="border-t border-gray-100 hover:bg-gray-50/50">
              <Td className="font-medium">{t.nombre}</Td><Td>{t.horario}</Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function EquiposPanel() {
  const equipos = [
    { eq: "Casco de seguridad", tipo: "EPP", estado: "Disponible" },
    { eq: "Guantes dieléctricos", tipo: "EPP", estado: "Mantenimiento" },
    { eq: "Arnés de seguridad", tipo: "EPP", estado: "Disponible" },
  ];
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white animate-fade-in-up">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#f6f8fb] text-gray-600"><tr><Th>Equipo</Th><Th>Tipo</Th><Th>Estado</Th></tr></thead>
        <tbody>
          {equipos.map((e) => (
            <tr key={e.eq} className="border-t border-gray-100 hover:bg-gray-50/50">
              <Td className="font-medium">{e.eq}</Td>
              <Td>{e.tipo}</Td>
              <Td>
                {e.estado === "Disponible" ? (
                  <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">Disponible</span>
                ) : (
                  <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">Mantenimiento</span>
                )}
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Modal de creación ---------- */
function NewUserModal({
  onClose,
  onSave,
  saving,
}: {
  onClose: () => void;
  onSave: (data: Omit<UserDoc, "id" | "creadoEn" | "tempPassword">, tempPassword?: string) => Promise<void>;
  saving: boolean;
}) {
  const [correo, setCorreo] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("Supervisor de Seguridad");
  const [area, setArea] = useState("Extracción");
  const [estado, setEstado] = useState<"Activo" | "Inactivo">("Activo");
  const [tempPassword, setTempPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  // Sugerir/actualizar contraseña desde el nombre
  useEffect(() => {
    if (nombre.trim() && !tempPassword) setTempPassword(genPasswordFromName(nombre));
  }, [nombre, tempPassword]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center">
      <div className="absolute inset-0 bg-black/45 animate-overlay-fade" onClick={onClose} />
      <div className="relative w-full max-w-xl animate-modal-in glass-card">
        <div className="p-6 md:p-8">
          <div className="mb-6 flex items-start justify-between">
            <h3 className="text-2xl font-semibold text-gray-900">Crear Nuevo Usuario</h3>
            <button onClick={onClose} className="rounded-full p-1 text-gray-500 transition hover:bg-white/60 hover:text-gray-700">✕</button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Correo */}
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-gray-800">Correo</span>
              <input
                className="glass-input"
                placeholder="correo@dominio.com"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                type="email"
              />
            </label>

            {/* Nombre */}
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-gray-800">Nombre</span>
              <input
                className="glass-input"
                placeholder="Nombre completo"
                value={nombre}
                onChange={(e) => {
                  const n = e.target.value;
                  setNombre(n);
                  if (!tempPassword) setTempPassword(genPasswordFromName(n || "Usuario"));
                }}
              />
            </label>

            {/* Rol */}
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-800">Rol</span>
              <select className="glass-input" value={rol} onChange={(e) => setRol(e.target.value)}>
                <option>Supervisor de Seguridad</option>
                <option>Operador</option>
                <option>Administrador</option>
              </select>
            </label>

            {/* Área */}
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-800">Área</span>
              <select className="glass-input" value={area} onChange={(e) => setArea(e.target.value)}>
                <option>Extracción</option>
                <option>Procesamiento</option>
                <option>Exploración</option>
                <option>Mantenimiento</option>
                <option>Administración</option>
              </select>
            </label>

            {/* Estado */}
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-gray-800">Estado</span>
              <select className="glass-input" value={estado} onChange={(e) => setEstado(e.target.value as any)}>
                <option>Activo</option>
                <option>Inactivo</option>
              </select>
            </label>

            {/* Contraseña temporal */}
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-gray-800">Contraseña Temporal</span>
              <div className="flex gap-2">
                <input
                  className="glass-input flex-1"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="Se genera a partir del nombre (editable)"
                />
                <button
                  type="button"
                  onClick={() => setTempPassword(genPasswordFromName(nombre || "Usuario"))}
                  className="rounded-2xl border border-white/50 bg-white/50 px-3 py-2 text-sm text-gray-800 backdrop-blur-md transition hover:bg-white/70"
                >
                  Regenerar
                </button>
              </div>
              <p className="text-xs text-gray-500">Puedes editarla antes de guardar.</p>
            </label>
          </div>

          {err && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {err}
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="rounded-2xl border border-white/50 bg-white/50 px-4 py-2 text-sm text-gray-800 backdrop-blur-md transition hover:bg-white/70"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                setErr(null);
                if (!correo.trim()) { setErr("El correo es obligatorio."); return; }
                const pwd = (tempPassword && tempPassword.trim().length >= 6)
                  ? tempPassword.trim()
                  : genPasswordFromName(nombre || "Usuario");
                try {
                  await onSave(
                    { nombre: nombre.trim() || "Usuario", correo, rol, area, estado },
                    pwd
                  );
                } catch (e: any) {
                  setErr(e?.message ?? "No se pudo crear usuario.");
                }
              }}
              disabled={saving}
              className="rounded-2xl bg-[#2bff4d] px-4 py-2 text-sm font-semibold text-black shadow-[0_8px_30px_rgba(43,255,77,0.35)] transition-all hover:shadow-[0_12px_40px_rgba(43,255,77,0.55)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar Usuario"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
