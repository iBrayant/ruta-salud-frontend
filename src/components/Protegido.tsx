"use client";
// Muestra la página solo con sesión y rol válidos. La autorización real la hace el backend en cada petición.
import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { inicioPorRol, useSesion } from "@/lib/sesion";
import type { Rol } from "@/lib/tipos";
import { Encabezado } from "./Encabezado";
import { Cargando } from "./ui";

export function Protegido({ roles, children }: { roles: Rol[]; children: ReactNode }) {
  const s = useSesion();

  useEffect(() => {
    if (!s.cargando && !s.usuario) void s.ingresar();
  }, [s]);

  if (s.cargando || !s.usuario) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Cargando texto="Verificando sesión…" />
      </div>
    );
  }
  if (!roles.some((r) => s.roles.includes(r))) {
    return (
      <>
        <Encabezado />
        <main className="mx-auto flex max-w-lg flex-col gap-3 px-4 py-16 text-center">
          <h1 className="text-xl font-semibold">No tiene acceso a esta sección</h1>
          <p className="text-tinta-2">Su rol no permite ver esta página.</p>
          <Link href={inicioPorRol(s.roles)}>Ir a mi página de inicio</Link>
        </main>
      </>
    );
  }
  return (
    <>
      <Encabezado />
      {children}
    </>
  );
}
