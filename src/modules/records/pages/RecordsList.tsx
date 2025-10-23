import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  suscribirIncidentes,
  eliminarIncidente,
  type IncidenteRow,
} from "../services/incidentes.service";
import { exportIncidenteExcelRellenoStyled } from "../services/pdf.service"; // ⬅️ nuevo import

type Row = IncidenteRow & { id: string };

export default function RecordsList() {
  const [view, setView] = useState<"tabla" | "tarjetas">("tabla");
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const off = suscribirIncidentes((r) => setRows(r as Row[]));
    return () => off();
  }, []);

  async function onDelete(id: string) {
    if (!confirm("¿Eliminar este registro?")) return;
    await eliminarIncidente(id);
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Registros de Seguridad</h1>
        <p className="text-sm text-gray-500">Gestione y siga todos los incidentes e informes.</p>
      </header>

      {/* Filtros / Acciones */}
      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Drop label="Área" />
          <Drop label="Tipo" />
          <Drop label="Estado" />
          <Drop label="Severidad" />

          <div className="ms-auto flex items-center gap-3">
            <button className="hidden rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50 md:inline-flex">
              Vista de {view === "tabla" ? "Tabla" : "Tarjetas"}
            </button>
            <button
              onClick={() => setView((v) => (v === "tabla" ? "tarjetas" : "tabla"))}
              className="rounded-2xl border border-gray-200 bg-gray-100 px-3 py-2 text-xs text-gray-700 hover:bg-gray-200"
            >
              Cambiar vista
            </button>

            <Link
              to="/registros/nuevo"
              className="inline-flex items-center gap-2 rounded-2xl bg-[#2bff4d] px-4 py-2 text-sm font-semibold text-black shadow-[0_8px_30px_rgba(43,255,77,0.35)] hover:opacity-95"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                <path d="M6 12h12M12 6v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Nuevo Registro
            </Link>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f6f8fb] text-gray-600">
            <tr>
              <Th>INCIDENTE NO.</Th>
              <Th>FECHA</Th>
              <Th>ÁREA</Th>
              <Th>TIPO</Th>
              <Th>ESTADO</Th>
              <Th>SEVERIDAD</Th>
              <Th>ACCIONES</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const incNo = r.payload?.datosGenerales?.incidenteNo || `#${r.id?.slice(0, 6)}`;
              return (
                <tr key={r.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                  <Td>{incNo}</Td>
                  <Td>{r.fecha}</Td>
                  <Td>{r.area}</Td>
                  <Td>{r.tipo}</Td>
                  <Td><Badge tone={r.estado === "Abierto" ? "amber" : "green"}>{r.estado}</Badge></Td>
                  <Td>
                    {r.severidad === "Alta" && <Badge tone="red">Alta</Badge>}
                    {r.severidad === "Media" && <Badge tone="yellow">Media</Badge>}
                    {r.severidad === "Baja" && <Badge tone="blue">Baja</Badge>}
                  </Td>
                  <Td className="flex items-center gap-2 py-4">
                    {/* Editar */}
                    <Link
                      to={`/registros/${r.id}`}
                      title="Editar"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M16.5 3a2.121 2.121 0 013 3l-9 9H7.5V12l9-9z" />
                      </svg>
                    </Link>

                    {/* Eliminar */}
                    <button
                      onClick={() => onDelete(r.id!)}
                      title="Eliminar"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Exportar reporte */}
                    <button
                      onClick={() => exportIncidenteExcelRellenoStyled(r)}
                      title="Exportar reporte (PDF)"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
                      </svg>
                    </button>
                  </Td>

                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <Td className="py-10 text-center text-gray-500" colSpan={7}>Sin registros.</Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3 text-xs font-semibold">{children}</th>;
}
function Td({ children, className = "", colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return <td colSpan={colSpan} className={`px-5 py-4 text-gray-700 ${className}`}>{children}</td>;
}
function Drop({ label }: { label: string }) {
  return (
    <button className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50">
      {label} <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
    </button>
  );
}
function Badge({ children, tone }: { children: React.ReactNode; tone: "green" | "amber" | "red" | "yellow" | "blue" }) {
  const map = {
    green: "bg-green-100 text-green-700 border-green-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200",
    red: "bg-red-100 text-red-700 border-red-200",
    yellow: "bg-yellow-100 text-yellow-700 border-yellow-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200",
  } as const;
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs ${map[tone]}`}>{children}</span>;
}
