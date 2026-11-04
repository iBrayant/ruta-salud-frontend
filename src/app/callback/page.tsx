"use client";
// Retorno de Keycloak: intercambia el código de autorización (con PKCE) por los tokens.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Cargando, Mensaje } from "@/components/ui";
import { gestorSesion, inicioPorRol, rolesDelToken } from "@/lib/sesion";

export default function Callback() {
  const [error, setError] = useState<string | null>(null);
  const hecho = useRef(false);

  useEffect(() => {
    if (hecho.current) return;
    hecho.current = true;
    gestorSesion()
      .signinRedirectCallback()
      // Recarga completa para que el proveedor de sesión lea el usuario recién guardado.
      .then((u) => window.location.replace(inicioPorRol(rolesDelToken(u.access_token))))
      .catch(() => setError("No fue posible completar el inicio de sesión."));
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="flex max-w-sm flex-col gap-3">
        {error ? (
          <>
            <Mensaje tipo="error">{error}</Mensaje>
            <Link href="/">Volver a intentar</Link>
          </>
        ) : (
          <Cargando texto="Completando el inicio de sesión…" />
        )}
      </div>
    </main>
  );
}
