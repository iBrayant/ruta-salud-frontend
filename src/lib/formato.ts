// Formatos en español de Colombia
import type { ClimaVereda, Parada } from "./tipos";

const nf = (dec: number) => new Intl.NumberFormat("es-CO", { minimumFractionDigits: dec, maximumFractionDigits: dec });

export const km = (v: number) => `${nf(1).format(v)} km`;
export const dec2 = (v: number) => nf(2).format(v);
export const pct = (v: number) => `${nf(0).format(v)} %`;

export function minutos(v: number): string {
  const m = Math.round(v);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} min`;
}

export function fechaLarga(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
}

// Los usuarios están en Colombia: se muestra siempre la hora de Bogotá, sin importar la zona del equipo.
export function horaCorta(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Bogota",
  });
}

export function manana(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Probabilidad máxima de lluvia entre la llegada y la salida de una parada (pronóstico por hora). */
export function lluviaEnVisita(p: Parada, clima: Record<string, ClimaVereda> | null): number | null {
  const c = clima?.[p.vereda_id];
  if (!c?.por_hora || Object.keys(c.por_hora).length === 0) return null;
  const desde = Number(p.llegada.slice(0, 2));
  const hasta = Number(p.salida.slice(0, 2));
  const valores = Object.entries(c.por_hora)
    .filter(([h]) => Number(h) >= desde && Number(h) <= hasta)
    .map(([, v]) => v.prob);
  return valores.length ? Math.max(...valores) : null;
}

export function nivelLluvia(prob: number | null): "sin_dato" | "baja" | "media" | "alta" {
  if (prob === null) return "sin_dato";
  if (prob < 20) return "baja";
  if (prob < 45) return "media";
  return "alta";
}

const NOMBRES_ACCION: Record<string, string> = {
  ruta_generada: "ruta generada",
  ruta_ejecutada: "jornada confirmada",
  ruta_reproducida: "ruta reproducida",
  explicacion_generada: "explicación generada",
  consulta_asistente: "consulta al asistente",
  simulacion_ejecutada: "simulación",
  auditoria_consultada: "auditoría consultada",
};
export const nombreAccion = (a: string) => NOMBRES_ACCION[a] ?? a.replace(/_/g, " ");
export const nombreActor = (a: string) =>
  a === "service-account-svc-rutas" ? "servicio de rutas" : a === "service-account-svc-ia" ? "servicio de IA" : a;
