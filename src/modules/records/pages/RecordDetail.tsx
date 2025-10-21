import { useParams } from "react-router-dom";

export default function RecordDetail() {
  const { id } = useParams();
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Detalle de registro #{id}</h2>
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">Timeline, formulario, adjuntos…</p>
      </div>
    </div>
  );
}
