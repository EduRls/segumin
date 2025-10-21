import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { emailPasswordSignIn } from "../../../lib/lib-firebase/auth";
import { useNavigate, useLocation, Link } from "react-router-dom";

const schema = z.object({
  email: z.string().email("Correo no válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type FormData = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const { state } = useLocation() as { state?: { from?: Location } };
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await emailPasswordSignIn(data.email, data.password);
      const to = (state?.from?.pathname as string) ?? "/dashboard";
      navigate(to, { replace: true });
    } catch (e: any) {
      setError(e?.message ?? "No fue posible iniciar sesión.");
    }
  };

  return (
    <div className="min-h-dvh from-white to-[#f6f8fb]">
      <div className="mx-auto flex min-h-dvh max-w-xl items-center justify-center p-6">
        <div className="w-full rounded-[28px] bg-white p-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.25)] animate-fade-in-up">
          {/* Logo */}
          <div className="mb-7 grid place-items-center">
            <div className="relative">
              <img
                src="/mina.png"
                alt="Logo"
                className="h-50 w-50 animate-float select-none"
                onError={(e) => {
                  (e.currentTarget.style.display = "none");
                  const ph = e.currentTarget.nextElementSibling as HTMLDivElement | null;
                  if (ph) ph.style.display = "grid";
                }}
              />
              <div
                className="hidden h-12 w-12 place-items-center rounded-xl bg-[#2bff4d]/20 text-black"
                aria-label="Logo placeholder"
              >
                <div className="h-6 w-6 rounded-md bg-[#2bff4d]" />
              </div>
            </div>
            <div className="mt-3 text-base font-semibold tracking-wide" style={{ fontFamily: "Arial, sans-serif" }}>
              SEGUMIN
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Correo */}
            <div className="animate-fade-in-up delay-1">
              <label className="mb-2 block text-sm font-medium text-gray-700">Correo Electrónico</label>
              <div className="group flex items-center gap-2 rounded-2xl border border-gray-200 bg-[#f9fafb] px-3 py-3 transition focus-within:border-gray-400">
                <svg className="h-5 w-5 text-gray-400 transition group-focus-within:text-gray-600" viewBox="0 0 24 24" fill="none">
                  <path d="M3 8l9 6 9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  type="email"
                  placeholder="su-correo@ejemplo.com"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                  {...register("email")}
                  autoComplete="email"
                  style={{ fontFamily: "Arial, sans-serif" }}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>

            {/* Contraseña */}
            <div className="animate-fade-in-up delay-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">Contraseña</label>
              <div className="group flex items-center gap-2 rounded-2xl border border-gray-200 bg-[#f9fafb] px-3 py-3 transition focus-within:border-gray-400">
                <svg className="h-5 w-5 text-gray-400 transition group-focus-within:text-gray-600" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="10" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7 10V8a5 5 0 0110 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Ingrese su contraseña"
                  className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                  {...register("password")}
                  autoComplete="current-password"
                  style={{ fontFamily: "Arial, sans-serif" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(s => !s)}
                  className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPw ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M10.6 10.6A3 3 0 0012 15a3 3 0 002.4-4.4M6.2 6.6C4 8 3 10 3 10s3.8 6 9 6c1.1 0 2.1-.2 3-.6m3.8-2C20 12 21 10 21 10s-3.8-6-9-6c-.9 0-1.9.2-2.8.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <path d="M3 10s3.8-6 9-6 9 6 9 6-3.8 6-9 6-9-6-9-6z" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {/* Error */}
            {error && (
              <div className="animate-fade-in-up delay-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Botón principal */}
            <button
              className="mt-2 w-full rounded-2xl bg-[#2bff4d] px-5 py-3 text-center text-sm font-semibold text-black shadow-[0_8px_30px_rgba(43,255,77,0.45)] transition-all hover:shadow-[0_12px_40px_rgba(43,255,77,0.55)] hover:scale-[1.02] active:scale-[0.98] animate-scale-in"
              disabled={isSubmitting}
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              {isSubmitting ? "Entrando…" : "Iniciar Sesión"}
            </button>

            {/* Botones secundarios con animación */}
            <div className="mt-4 flex items-center justify-between text-sm text-[#557ac8]">
              <Link
                to="#"
                className="transition-all hover:text-[#2bff4d] hover:underline hover:scale-[1.02]"
              >
                Recuperar contraseña
              </Link>
              <Link
                to="#"
                className="transition-all hover:text-[#2bff4d] hover:underline hover:scale-[1.02]"
              >
                Crear cuenta
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
