"use client";
// Cliente HTTP del backend. Las rutas /api/* se reenvían al gateway desde next.config.ts.
import { useCallback } from "react";
import { useSesion } from "./sesion";

export class ErrorApi extends Error {
  constructor(public estado: number, mensaje: string) {
    super(mensaje);
  }
}

const MENSAJES: Record<number, string> = {
  401: "Su sesión expiró. Vuelva a ingresar.",
  403: "Su rol no tiene permiso para esta acción.",
  404: "No se encontró la información solicitada.",
  429: "Se alcanzó el límite de consultas. Intente de nuevo en unos minutos.",
  502: "El servidor no respondió. Verifique que el backend esté en línea.",
  503: "Un servicio no está disponible en este momento. La operación no se realizó.",
};

async function mensajeDeError(r: Response): Promise<string> {
  try {
    const d = await r.json();
    if (typeof d?.detail === "string") return d.detail;
    if (Array.isArray(d?.detail)) {
      return d.detail.map((e: { loc?: string[]; msg?: string }) => `${e.loc?.slice(-1)[0] ?? "campo"}: ${e.msg}`).join(". ");
    }
  } catch {
    /* sin cuerpo JSON */
  }
  return MENSAJES[r.status] ?? `Error ${r.status}`;
}

export function useApi() {
  const { token, ingresar } = useSesion();
  return useCallback(
    async function api<T>(ruta: string, opciones: { metodo?: string; cuerpo?: unknown } = {}): Promise<T> {
      const t = await token();
      if (!t) {
        await ingresar();
        throw new ErrorApi(401, MENSAJES[401]);
      }
      let r: Response;
      try {
        r = await fetch(`/api${ruta}`, {
          method: opciones.metodo ?? "GET",
          headers: {
            Authorization: `Bearer ${t}`,
            ...(opciones.cuerpo !== undefined ? { "Content-Type": "application/json" } : {}),
          },
          body: opciones.cuerpo !== undefined ? JSON.stringify(opciones.cuerpo) : undefined,
          cache: "no-store",
        });
      } catch {
        throw new ErrorApi(0, "No hay conexión con el servidor.");
      }
      if (!r.ok) {
        const mensaje = r.status >= 500 && r.status !== 503 ? MENSAJES[502] : await mensajeDeError(r);
        throw new ErrorApi(r.status, r.status === 403 ? MENSAJES[403] : mensaje);
      }
      return (await r.json()) as T;
    },
    [token, ingresar],
  );
}
