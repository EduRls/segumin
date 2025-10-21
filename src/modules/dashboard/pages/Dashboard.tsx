import {
  ResponsiveContainer,
  AreaChart, Area,
  CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar,
} from "recharts";
import React from "react";

/* ================== Datos de ejemplo ================== */
const serieMensual = [
  { x: "May", y: 30 }, { x: "Jun", y: 22 }, { x: "Jul", y: 45 },
  { x: "Ago", y: 38 }, { x: "Sep", y: 29 }, { x: "Oct", y: 41 },
];

const incidentesArea = [
  { area: "Área A", valor: 24 },
  { area: "Área B", valor: 17 },
  { area: "Área C", valor: 35 },
  { area: "Área D", valor: 14 },
];

const ultimosIncidentes = [
  { id: "INC-001", fecha: "2023-10-26", area: "Mina Norte", severidad: "Alta" },
  { id: "INC-002", fecha: "2023-10-25", area: "Planta", severidad: "Media" },
  { id: "INC-003", fecha: "2023-10-25", area: "Transporte", severidad: "Baja" },
];

/* ================== Página ================== */
export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Barra de filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <Pill icon={CalendarIcon}>Rango de Fechas</Pill>
        <Divider />
        <Pill icon={TableIcon}>Filtrar por Área</Pill>
        <Divider />
        <Pill icon={ClockIcon}>Filtrar por Turno</Pill>
        <Divider />
        <Pill icon={WarnIcon}>Filtrar por Severidad</Pill>
        <div className="ml-auto">
          <button className="rounded-full bg-[#2bff4d] px-4 py-2 text-sm font-semibold text-black shadow-[0_8px_30px_rgba(43,255,77,0.35)] transition-all hover:scale-[1.02] hover:shadow-[0_12px_40px_rgba(43,255,77,0.55)] active:scale-[0.98]">
            Aplicar
          </button>
        </div>
      </div>

      {/* Tarjetas superiores */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader title="Tasa de Incidentes Mensual" icon={<TrendIcon />} />
          <div className="px-5 pb-5">
            <div className="text-4xl font-bold text-gray-900">1.23</div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-green-500">↑ +0.1%</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Días sin Accidentes" icon={<ShieldIcon />} />
          <div className="px-5 pb-5">
            <div className="text-4xl font-bold text-gray-900">365</div>
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-green-500">↑ +10%</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Evolución de Reportes de Seguridad" icon={<TrendIcon />} />
          <div className="px-2 pb-2">
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={serieMensual} margin={{ left: 8, right: 8 }}>
                <defs>
                  {/* Degradado verde como el ejemplo */}
                  <linearGradient id="seguminGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00FF80" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#00FF80" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#EEF1F5" strokeDasharray="3 3" />
                <XAxis dataKey="x" tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, borderColor: "#E5E7EB" }} labelStyle={{ color: "#6B7280" }} />
                <Area
                  type="monotone"
                  dataKey="y"
                  stroke="#00FF80"
                  strokeWidth={3}
                  fill="url(#seguminGreen)"
                  activeDot={{ r: 6, fill: "#00FF80" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="px-5 pb-5 text-sm text-gray-500">
            125 <span className="ml-1">Últimos 6 meses</span>
          </div>
        </Card>
      </div>

      {/* Segunda fila: barras + tabla */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Incidentes por Área y Tipo" icon={<BarsIcon />} />
          <div className="px-5 pb-3">
            <div className="text-4xl font-bold text-gray-900">45</div>
            <div className="mt-1 text-sm text-gray-500">Mensual</div>
          </div>
          <div className="px-2 pb-2">
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={incidentesArea} margin={{ left: 8, right: 8 }}>
                <CartesianGrid stroke="#EEF1F5" strokeDasharray="3 3" />
                <XAxis dataKey="area" tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#9CA3AF", fontSize: 12 }} axisLine={false} tickLine={false} />
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
                    <Th>ID</Th>
                    <Th>Fecha</Th>
                    <Th>Área</Th>
                    <Th>Severidad</Th>
                  </tr>
                </thead>
                <tbody>
                  {ultimosIncidentes.map((r) => (
                    <tr key={r.id} className="border-t border-gray-100">
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
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>

      {/* Mapa / Ubicación de puntos críticos (placeholder) */}
      <Card>
        <div className="flex items-center justify-between px-5 pt-5">
          <div className="text-sm font-semibold text-gray-700">Ubicación de Puntos Críticos</div>
          <div className="text-gray-400"><MapIcon /></div>
        </div>
        <div className="px-5 pb-6">
          <div className="mt-3 h-56 w-full rounded-xl border border-dashed border-gray-300 bg-[#f9fafb]" />
        </div>
      </Card>
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
function Pill({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: React.ComponentType<any>;
}) {
  return (
    <button className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50">
      {Icon && <Icon className="h-4 w-4 text-gray-500" />}
      {children}
      <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
    </button>
  );
}
function Divider() {
  return <div className="mx-1 hidden h-6 w-px bg-gray-200 sm:block" />;
}
function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3 text-xs font-semibold">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-5 py-3 text-gray-700">{children}</td>;
}
function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color: "red" | "amber" | "green";
}) {
  const styles = {
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    green: "bg-green-100 text-green-700",
  }[color];
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles}`}>
      {children}
    </span>
  );
}

/* ================== Íconos (SVG) ================== */
function ChevronDown(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function CalendarIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="4" width="18" height="16" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 2v4M16 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function TableIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 10h18M9 5v14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function ClockIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function WarnIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M12 3l9 16H3l9-16z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function TrendIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M4 14l5-5 4 4 7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function ShieldIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M12 3l8 4v5a10 10 0 01-8 9 10 10 0 01-8-9V7l8-4z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function BarsIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M6 18V9M12 18V6M18 18v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function ListIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function MapIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M9 6l-5 2v10l5-2 6 2 5-2V6l-5 2-6-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
