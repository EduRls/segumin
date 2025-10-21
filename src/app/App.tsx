import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    // Si no hay sesión, solo renderiza el contenido (Login, etc.)
    return (
      <div className="min-h-dvh bg-[#f6f8fb]">
        <main className="mx-auto max-w-6xl p-6">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#f6f8fb] flex">
      {/* Sidebar fijo a la izquierda */}
      <aside className="sticky left-0 top-0 h-screen w-[230px] border-r border-gray-200 bg-white p-4 shadow-[8px_0_40px_-25px_rgba(0,0,0,0.15)]">
        {/* Header brand */}
        <div className="mb-8 flex items-center gap-3 px-2">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#2bff4d]/20">
            <div className="h-5 w-5 rounded-md bg-[#2bff4d]" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-gray-900">Mining</div>
            <div className="text-xs text-gray-500">Gestión de Seguridad</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="space-y-1">
          <SideItem to="/dashboard" icon={DashboardIcon} label="Dashboard" />
          <SideItem to="/registros" icon={BookIcon} label="Registro de Incidentes" />
          <SideItem to="/usuarios" icon={UsersIcon} label="Gestión de Usuarios" />
        </nav>

        {/* Footer (salir) */}
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <button
            onClick={async () => {
              await signOut();
              navigate("/login");
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
            title="Cerrar sesión"
          >
            <LogoutIcon className="h-5 w-5 text-gray-400" />
            <span>Salir</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 pl-6 pr-8 pt-4 pb-6 overflow-y-auto">
        <header className="mb-4 rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Bienvenido, <span className="font-medium text-gray-900">{user.email}</span>
            </div>
          </div>
        </header>
        <div className="space-y-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

/* ---------- Item del sidebar ---------- */
function SideItem({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ComponentType<any>;
  label: string;
}) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-2xl px-3 py-2 text-sm transition-all duration-200",
          isActive
            ? "bg-[#eaffef] text-gray-900 shadow-[inset_0_0_0_1px_rgba(43,255,77,0.7)]"
            : "text-gray-700 hover:bg-gray-50 hover:translate-x-[2px]",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={
              "h-5 w-5 transition-colors duration-200" +
              (isActive ? " text-[#2bff4d]" : " text-gray-400")
            }
          />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

/* ---------- Íconos inline (SVG) ---------- */
function DashboardIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M4 13h7V4H4v9Zm9 7h7V4h-7v16ZM4 20h7v-5H4v5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function BookIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M6 4h11a2 2 0 0 1 2 2v13H7a3 3 0 0 1-3-3V6a2 2 0 0 1 2-2Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path d="M7 18V5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function UsersIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="9" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 19a6 6 0 0 1 12 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M17 7.5a2.5 2.5 0 1 1 0 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M20.5 19a4.5 4.5 0 0 0-5.5-4.4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
function LogoutIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M15 17l5-5-5-5M20 12H9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M11 20H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
