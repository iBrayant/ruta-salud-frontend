"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSesion } from "@/lib/sesion";
import type { Rol } from "@/lib/tipos";

const ENLACES: { href: string; texto: string; roles: Rol[] }[] = [
  { href: "/planificar", texto: "Planificar", roles: ["coordinador"] },
  { href: "/equipo", texto: "Jornada de hoy", roles: ["equipo_salud", "coordinador"] },
  { href: "/auditoria", texto: "Auditoría", roles: ["auditor"] },
];

export function Encabezado() {
  const { nombre, roles, salir } = useSesion();
  const ruta = usePathname();
  const visibles = ENLACES.filter((e) => e.roles.some((r) => roles.includes(r)));
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-linea bg-superficie px-4 py-3 sm:px-8">
      <div className="flex flex-col leading-tight">
        <span className="text-[15px] font-semibold">Ruta Salud Rural</span>
        <span className="text-[12.5px] text-tenue">Hospital San Rafael · Fusagasugá</span>
      </div>
      {visibles.length > 1 && (
        <nav aria-label="Principal" className="flex flex-wrap gap-0.5">
          {visibles.map((e) => {
            const activo = ruta === e.href;
            return (
              <Link
                key={e.href}
                href={e.href}
                aria-current={activo ? "page" : undefined}
                className={`rounded-lg px-3.5 py-2 no-underline ${activo ? "bg-marca-suave font-medium text-marca-hover" : "text-tinta-2 hover:bg-suave"}`}
              >
                {e.texto}
              </Link>
            );
          })}
        </nav>
      )}
      <div className="flex items-center gap-2.5 text-[13.5px] text-tinta-2">
        <span>{nombre}</span>
        <button
          type="button"
          onClick={salir}
          className="min-h-9 cursor-pointer rounded-lg border border-linea bg-superficie px-3 text-tinta-2 hover:bg-suave"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
