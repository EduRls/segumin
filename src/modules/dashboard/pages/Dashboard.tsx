import React, { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  AreaChart, Area,
  CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar,
} from "recharts";
import {
  suscribirIncidentes,
  type IncidenteRow,
} from "../../records/services/incidentes.service";

/* ================== Utils ================== */
function parseISO(d: string) {
  // fecha viene "YYYY-MM-DD"; forzamos a local
  const [y, m, dd] = (d || "").split("-").map(Number);
  if (!y || !m || !dd) return null;
  return new Date(y, m - 1, dd);
}
function fmtYYYYMM(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthLabel(d: Date) {
  return d.toLocaleDateString(undefined, { month: "short" });
}
function addMonths(d: Date, n: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}
function daysDiff(a: Date, b: Date) {
  return Math.max(0, Math.round((+a - +b) / 86400000));
}

/* ================== Página ================== */
export default function Dashboard() {
  const [rows, setRows] = useState<(IncidenteRow & { id?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  // filtros básicos
  const [fStart, setFStart] = useState<string>(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 5); // últimos 6 meses por defecto
    return d.toISOString().slice(0, 10);
  });
  const [fEnd, setFEnd] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [fArea, setFArea] = useState<string>("(todas)");
  const [fSev, setFSev] = useState<"" | "Alta" | "Media" | "Baja">("");

  // suscripción a incidentes
  useEffect(() => {
    const off = suscribirIncidentes((r) => {
      setRows(r as any);
      setLoading(false);
    });
    return () => off();
  }, []);

  // opciones de filtros
  const areaOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach(r => r.area && set.add(r.area));
    return ["(todas)", ...Array.from(set)];
  }, [rows]);

  // aplicar filtros
  const filtered = useMemo(() => {
    const start = parseISO(fStart);
    const end = parseISO(fEnd);
    return rows.filter(r => {
      const d = parseISO(r.fecha);
      if (!d) return false;
      const inRange = (!start || d >= start) && (!end || d <= end);
      const byArea = fArea === "(todas)" || r.area === fArea;
      const bySev = !fSev || r.severidad === fSev;
      return inRange && byArea && bySev;
    });
  }, [rows, fStart, fEnd, fArea, fSev]);

  /* ===== KPIs ===== */
  const totalPeriodo = filtered.length;

  const diasSinIncidentes = useMemo(() => {
    if (!rows.length) return 0;
    const last = [...rows]
      .map(r => parseISO(r.fecha))
      .filter(Boolean)
      .sort((a, b) => +b! - +a!)[0] as Date | undefined;
    if (!last) return 0;
    return daysDiff(new Date(), last);
  }, [rows]);

  // serie mensual (últimos 6 meses)
  const serieMensual = useMemo(() => {
    const out: { x: string; y: number }[] = [];
    const today = new Date();
    const start6 = addMonths(new Date(today.getFullYear(), today.getMonth(), 1), -5); // hace 5 meses
    const map = new Map<string, number>();
    filtered.forEach(r => {
      const d = parseISO(r.fecha);
      if (!d) return;
      const key = fmtYYYYMM(new Date(d.getFullYear(), d.getMonth(), 1));
      map.set(key, (map.get(key) || 0) + 1);
    });
    for (let i = 0; i < 6; i++) {
      const m = addMonths(start6, i);
      const key = fmtYYYYMM(m);
      out.push({ x: monthLabel(m), y: map.get(key) || 0 });
    }
    return out;
  }, [filtered]);

  // barras por área (conteo)
  const incidentesArea = useMemo(() => {
    const counts = new Map<string, number>();
    filtered.forEach(r => counts.set(r.area || "N/D", (counts.get(r.area || "N/D") || 0) + 1));
    return Array.from(counts.entries())
      .map(([area, valor]) => ({ area, valor }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8);
  }, [filtered]);

  // últimos incidentes
  const ultimosIncidentes = useMemo(() => {
    const withIncNo = (r: IncidenteRow & { id?: string }) =>
      r.payload?.datosGenerales?.incidenteNo || `#${(r.id || "").slice(0, 6)}`;
    return [...filtered]
      .sort((a, b) => ((parseISO(b.fecha)?.getTime() || 0) - (parseISO(a.fecha)?.getTime() || 0)))
      .slice(0, 8)
      .map(r => ({ id: withIncNo(r), fecha: r.fecha, area: r.area, severidad: r.severidad }));
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        {/* Rango de fechas */}
        <div className="flex items-center gap-2">
          <Pill icon={CalendarIcon}>
            <div className="flex items-center gap-2">
              <input type="date" value={fStart} onChange={e => setFStart(e.target.value)}
                     className="rounded-xl border border-gray-200 px-2 py-1 text-sm" />
              <span className="text-gray-400">—</span>
              <input type="date" value={fEnd} onChange={e => setFEnd(e.target.value)}
                     className="rounded-xl border border-gray-200 px-2 py-1 text-sm" />
            </div>
          </Pill>
        </div>
        <Divider />

        {/* Área */}
        <Pill icon={TableIcon}>
          <select value={fArea} onChange={e => setFArea(e.target.value)}
                  className="rounded-xl border border-gray-200 px-2 py-1 text-sm">
            {areaOptions.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </Pill>
        <Divider />

        {/* Severidad */}
        <Pill icon={WarnIcon}>
          <select value={fSev} onChange={e => setFSev(e.target.value as any)}
                  className="rounded-xl border border-gray-200 px-2 py-1 text-sm">
            <option value="">(todas)</option>
            <option value="Alta">Alta</option>
            <option value="Media">Media</option>
            <option value="Baja">Baja</option>
          </select>
        </Pill>

        <div className="ml-auto text-sm text-gray-500">
          {loading ? "Cargando…" : `${totalPeriodo} incidente(s) en el período`}
        </div>
      </div>

      {/* Tarjetas superiores */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader title="Incidentes en el período" icon={<TrendIcon />} />
          <div className="px-5 pb-5">
            <div className="text-4xl font-bold text-gray-900">{totalPeriodo}</div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-gray-500">Filtrado por fecha/área/severidad</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Días sin incidentes" icon={<ShieldIcon />} />
          <div className="px-5 pb-5">
            <div className="text-4xl font-bold text-gray-900">{diasSinIncidentes}</div>
            <div className="mt-2 text-sm text-gray-500">Desde el último registro</div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Evolución de reportes (6 meses)" icon={<TrendIcon />} />
          <div className="px-2 pb-2">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={serieMensual} margin={{ left: 8, right: 8 }}>
                <defs>
                  <linearGradient id="seguminGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00FF80" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#00FF80" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#EEF1F5" strokeDasharray="3 3" />
                <XAxis dataKey="x" tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#E5E7EB" }} labelStyle={{ color: "#6B7280" }} />
                <Area type="monotone" dataKey="y" stroke="#00FF80" strokeWidth={3} fill="url(#seguminGreen)" activeDot={{ r: 6, fill: "#00FF80" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="px-5 pb-5 text-sm text-gray-500">
            {serieMensual.reduce((a, b) => a + b.y, 0)} <span className="ml-1">Total últimos 6 meses</span>
          </div>
        </Card>
      </div>

      {/* Segunda fila: barras + tabla */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Incidentes por Área" icon={<BarsIcon />} />
          <div className="px-5 pb-3">
            <div className="text-4xl font-bold text-gray-900">{filtered.length}</div>
            <div className="mt-1 text-sm text-gray-500">Distribución por área</div>
          </div>
          <div className="px-2 pb-2">
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={incidentesArea} margin={{ left: 8, right: 8 }}>
                <CartesianGrid stroke="#EEF1F5" strokeDasharray="3 3" />
                <XAxis dataKey="area" tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#E5E7EB" }} />
                <Bar dataKey="valor" radius={[10, 10, 10, 10]} fill="#9AF7BE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between px-5 pt-5">
            <div className="text-sm font-semibold text-gray-700">Últimos Incidentes Registrados</div>
            <div className="text-gray-400"><ListIcon /></div>
          </div>
          <div className="px-3 pb-4 pt-3">
            <div className="overflow-hidden rounded-2xl border border-gray-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#f6f8fb] text-gray-600">
                  <tr>
                    <Th>Incidente No.</Th>
                    <Th>Fecha</Th>
                    <Th>Área</Th>
                    <Th>Severidad</Th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosIncidentes.map((r) => (
                    <tr key={`${r.id}-${r.fecha}`} className="border-t border-gray-100">
                      <Td>{r.id}</Td>
                      <Td>{r.fecha}</Td>
                      <Td>{r.area}</Td>
                      <Td>
                        {r.severidad === "Alta" && <Badge color="red">Alta</Badge>}
                        {r.severidad === "Media" && <Badge color="amber">Media</Badge>}
                        {r.severidad === "Baja" && <Badge color="green">Baja</Badge>}
                      </Td>
                    </tr>
                  ))}
                  {ultimosIncidentes.length === 0 && (
                    <tr><Td colSpan={4}><span className="text-gray-500">Sin registros en el período.</span></Td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>

      {/* Placeholder mapa (igual que antes) 
      <Card>
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="text-sm font-semibold text-gray-700">Ubicación de Puntos Críticos</div>
          <div className="text-gray-400"><MapIcon /></div>
        </div>
        <div className="px-5 pb-6">
          <div className="mt-3 h-56 w-full rounded-xl border border-dashed border-gray-300 bg-[#f9fafb]" />
        </div>
      </Card>
      */}
    </div>
  );
}

/* ================== Helpers UI ================== */
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[22px] border border-gray-200 bg-white shadow-[0_18px_50px_-25px_rgba(0,0,0,0.25)]">
      {children}
    </div>
  );
}
function CardHeader({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 pt-5 pb-3">
      <div className="text-sm font-semibold text-gray-700">{title}</div>
      <div className="text-gray-400">{icon}</div>
    </div>
  );
}
function Pill({ children, icon: Icon }: { children: React.ReactNode; icon?: React.ComponentType<any>; }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700">
      {Icon && <Icon className="h-4 w-4 text-gray-500" />}
      {children}
    </div>
  );
}
function Divider() {
  return <div className="mx-1 hidden h-6 w-px bg-gray-200 sm:block" />;
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3 text-xs font-semibold">{children}</th>;
}
function Td({ children, colSpan }: { children: React.ReactNode; colSpan?: number }) {
  return <td colSpan={colSpan} className="px-5 py-3 text-gray-700">{children}</td>;
}
function Badge({ children, color }: { children: React.ReactNode; color: "red" | "amber" | "green"; }) {
  const styles = {
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-green-100 text-green-700",
  }[color];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}>{children}</span>;
}

/* ================== Íconos (SVG) ================== */
function ChevronDown(props: any) { return (<svg viewBox="0 0 24 24" fill="none" {...props}><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>); }
function CalendarIcon(props: any) { return (<svg viewBox="0 0 24 24" fill="none" {...props}><rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" /><path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>); }
function TableIcon(props: any) { return (<svg viewBox="0 0 24 24" fill="none" {...props}><rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M3 10h18M9 5v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>); }
function WarnIcon(props: any) { return (<svg viewBox="0 0 24 24" fill="none" {...props}><path d="M12 3l9 16H3l9-16z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>); }
function TrendIcon(props: any) { return (<svg viewBox="0 0 24 24" fill="none" {...props}><path d="M4 14l5-5 4 4 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>); }
function ShieldIcon(props: any) { return (<svg viewBox="0 0 24 24" fill="none" {...props}><path d="M12 3l8 4v5a10 10 0 01-8 9 10 10 0 01-8-9V7l8-4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>); }
function BarsIcon(props: any) { return (<svg viewBox="0 0 24 24" fill="none" {...props}><path d="M6 18V9M12 18V6M18 18v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>); }
function ListIcon(props: any) { return (<svg viewBox="0 0 24 24" fill="none" {...props}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>); }
function MapIcon(props: any) { return (<svg viewBox="0 0 24 24" fill="none" {...props}><path d="M9 6l-5 2v10l5-2 6 2 5-2V6l-5 2-6-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /></svg>); }
