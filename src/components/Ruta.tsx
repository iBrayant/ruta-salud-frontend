"use client";
// Componentes para mostrar una ruta: tabla de paradas, explicación y veredas no incluidas.
import { dec2, km, lluviaEnVisita, minutos, nivelLluvia, pct } from "@/lib/formato";
import type { Ruta } from "@/lib/tipos";
import { IconoCheck, Insignia } from "./ui";

const TONO_LLUVIA = { sin_dato: "neutro", baja: "neutro", media: "marca", alta: "ocre" } as const;

export function TablaParadas({ ruta }: { ruta: Ruta }) {
  return (
    <div className="overflow-x-auto rounded-[10px] border border-linea bg-superficie">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <caption className="px-5 pt-4 pb-2 text-left text-[15px] font-semibold">Orden de visita</caption>
        <thead>
          <tr className="text-left text-[12.5px] text-tenue">
            <th scope="col" className="border-b border-linea px-5 py-2 font-medium">#</th>
            <th scope="col" className="border-b border-linea px-3 py-2 font-medium">Vereda</th>
            <th scope="col" className="border-b border-linea px-3 py-2 font-medium">Visita</th>
            <th scope="col" className="border-b border-linea px-3 py-2 font-medium">Tramo</th>
            <th scope="col" className="border-b border-linea px-3 py-2 font-medium">Prioridad</th>
            <th scope="col" className="border-b border-linea px-3 py-2 pr-5 font-medium">Lluvia en la visita</th>
          </tr>
        </thead>
        <tbody>
          {ruta.orden.map((p) => {
            const ll = lluviaEnVisita(p, ruta.clima_por_vereda);
            return (
              <tr key={p.vereda_id}>
                <td className="border-b border-linea-tenue px-5 py-3 text-tenue">{p.posicion}</td>
                <td className="border-b border-linea-tenue px-3 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium">{p.nombre}</span>
                    <span className="text-[12.5px] text-tenue">{p.corregimiento}</span>
                  </div>
                </td>
                <td className="border-b border-linea-tenue px-3 py-3 whitespace-nowrap">
                  {p.llegada} – {p.salida}
                </td>
                <td className="border-b border-linea-tenue px-3 py-3 whitespace-nowrap text-tinta-2">
                  {km(p.tramo_km)} · {minutos(p.tramo_min)}
                </td>
                <td className="border-b border-linea-tenue px-3 py-3">{dec2(p.puntaje.prioridad)}</td>
                <td className="border-b border-linea-tenue px-3 py-3 pr-5">
                  <Insignia tono={TONO_LLUVIA[nivelLluvia(ll)]}>{ll === null ? "sin pronóstico" : pct(ll)}</Insignia>
                </td>
              </tr>
            );
          })}
          <tr>
            <td className="px-5 py-3 text-tenue" />
            <td className="px-3 py-3 text-tinta-2">Regreso al hospital</td>
            <td className="px-3 py-3">{ruta.regreso.hora}</td>
            <td className="px-3 py-3 whitespace-nowrap text-tinta-2">
              {km(ruta.regreso.km)} · {minutos(ruta.regreso.min)}
            </td>
            <td colSpan={2} />
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function PanelExplicacion({ ruta }: { ruta: Ruta }) {
  const e = ruta.explicacion;
  if (!e) {
    return <p className="text-sm text-tenue">Esta ruta no tiene explicación: el servicio de IA no estaba disponible. La ruta es válida porque la calcula el algoritmo.</p>;
  }
  const revisada = e.revision_etica.aprobado_reglas;
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-tinta-2">{e.resumen}</p>
      <ul className="flex list-none flex-col gap-2 p-0">
        {e.por_parada.map((p) => (
          <li key={p.vereda} className="text-sm text-tinta-2">
            <span className="font-medium text-tinta">{p.vereda}.</span> {p.razon}
          </li>
        ))}
      </ul>
      {e.advertencias && e.advertencias.length > 0 && (
        <ul className="flex list-disc flex-col gap-1 pl-5 text-[13px] text-tenue">
          {e.advertencias.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      )}
      {revisada && (
        <div className="flex items-center gap-2 rounded-lg bg-verde-suave px-3 py-2.5 text-[13px] text-verde-texto">
          <IconoCheck />
          Texto revisado: sin lenguaje estigmatizante
        </div>
      )}
      <span className="text-xs text-tenue">
        {e.revision_etica.metodo === "plantilla" ? "Explicación generada por plantilla a partir del algoritmo (sin modelo de lenguaje)." : e.aviso}
      </span>
    </div>
  );
}

export function Descartadas({ ruta, nombres }: { ruta: Ruta; nombres: Record<string, string> }) {
  if (ruta.descartadas.length === 0) return null;
  return (
    <details className="rounded-[10px] border border-linea bg-superficie px-5 py-4">
      <summary className="cursor-pointer text-[15px] font-semibold">Veredas no incluidas y por qué ({ruta.descartadas.length})</summary>
      <ul className="mt-3 flex list-none flex-col gap-2 p-0 text-sm">
        {ruta.descartadas.map((d) => (
          <li key={d.vereda_id} className="flex flex-wrap justify-between gap-2 border-t border-linea-tenue pt-2">
            <span className="font-medium">{nombres[d.vereda_id] ?? d.vereda_id}</span>
            <span className="text-tinta-2">{d.motivo}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
