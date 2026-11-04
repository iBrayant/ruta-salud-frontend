// Piezas de interfaz reutilizables (sin librerías de componentes)
import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Tarjeta({ children, className = "", titulo, id }: { children: ReactNode; className?: string; titulo?: string; id?: string }) {
  return (
    <section aria-labelledby={titulo && id ? id : undefined} className={`rounded-[10px] border border-linea bg-superficie p-5 ${className}`}>
      {titulo && (
        <h2 id={id} className="mb-3 text-[15px] font-semibold">
          {titulo}
        </h2>
      )}
      {children}
    </section>
  );
}

type Variante = "primario" | "secundario" | "neutro";
const VARIANTES: Record<Variante, string> = {
  primario: "border-0 bg-marca text-white hover:bg-marca-hover disabled:bg-tenue",
  secundario: "border border-marca bg-superficie text-marca hover:bg-marca-suave disabled:border-campo disabled:text-tenue",
  neutro: "border border-linea bg-superficie text-tinta-2 hover:bg-suave disabled:text-tenue",
};

export function Boton({ variante = "primario", className = "", ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      type="button"
      {...p}
      className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg px-4 font-medium transition-colors disabled:cursor-not-allowed ${VARIANTES[variante]} ${className}`}
    />
  );
}

export function Dato({ etiqueta, valor }: { etiqueta: string; valor: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 rounded-[10px] border border-linea bg-superficie px-4 py-3.5">
      <span className="text-[12.5px] text-tenue">{etiqueta}</span>
      <span className="text-xl font-semibold">{valor}</span>
    </div>
  );
}

export function Insignia({ tono = "neutro", children }: { tono?: "neutro" | "marca" | "verde" | "ocre" | "error"; children: ReactNode }) {
  const t = {
    neutro: "bg-linea-tenue text-tinta-2",
    marca: "bg-marca-suave text-marca-hover",
    verde: "bg-verde-suave text-verde-texto",
    ocre: "bg-ocre-suave text-ocre-texto",
    error: "bg-error-suave text-error-texto",
  }[tono];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-[12.5px] ${t}`}>{children}</span>;
}

export function Mensaje({ tipo = "info", children }: { tipo?: "info" | "error" | "exito"; children: ReactNode }) {
  const t = {
    info: "bg-suave text-tinta-2",
    error: "bg-error-suave text-error-texto",
    exito: "bg-verde-suave text-verde-texto",
  }[tipo];
  return (
    <div role={tipo === "error" ? "alert" : "status"} className={`rounded-lg px-3.5 py-2.5 text-sm ${t}`}>
      {children}
    </div>
  );
}

export function Cargando({ texto = "Cargando…" }: { texto?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 text-sm text-tenue">
      <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-marca-borde border-t-marca" />
      {texto}
    </div>
  );
}

export function IconoCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="flex-none">
      <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="var(--color-verde-icono)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
