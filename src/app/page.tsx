"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Boton, Cargando } from "@/components/ui";
import { inicioPorRol, useSesion } from "@/lib/sesion";

export default function Ingreso() {
  const s = useSesion();
  const router = useRouter();

  useEffect(() => {
    if (!s.cargando && s.usuario) router.replace(inicioPorRol(s.roles));
  }, [s.cargando, s.usuario, s.roles, router]);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="flex w-full max-w-[400px] flex-col gap-6">
        <div className="flex flex-col leading-snug">
          <span className="text-[17px] font-semibold">Ruta Salud Rural</span>
          <span className="text-[13px] text-tenue">Hospital San Rafael · Fusagasugá</span>
        </div>
        <div className="flex flex-col gap-4 rounded-xl border border-linea bg-superficie p-7">
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold">Ingresar</h1>
            <p className="text-sm text-tenue">Planificación de visitas domiciliarias priorizadas en las veredas del municipio.</p>
          </div>
          {s.cargando || s.usuario ? (
            <Cargando texto="Verificando sesión…" />
          ) : (
            <Boton onClick={() => void s.ingresar()}>Ingresar con cuenta institucional</Boton>
          )}
          <p className="text-[12.5px] text-tenue">Será redirigido al servidor de autenticación (Keycloak). Su contraseña nunca pasa por esta aplicación.</p>
        </div>
        <p className="text-center text-[12.5px] text-tenue">
          Acceso con OAuth 2.0. No se almacenan datos de pacientes. Tratamiento de datos según la Ley 1581 de 2012.
          <br />
          Prototipo académico — Maratón de Programación UCundinamarca 2026.
        </p>
      </div>
    </main>
  );
}
