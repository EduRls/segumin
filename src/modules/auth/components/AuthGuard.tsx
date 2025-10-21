import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../../app/context/AuthContext";

export default function AuthGuard() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div className="p-8 text-center">Cargando…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  return <Outlet />;
}
