"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Protegido } from "@/components/Protegido";
import { Cargando, Insignia, Mensaje } from "@/components/ui";
import { ErrorApi, useApi } from "@/lib/api";
import { fechaLarga, km, lluviaEnVisita, nivelLluvia, pct } from "@/lib/formato";
import type { RespuestaConsulta, Ruta, RutaResumen } from "@/lib/tipos";

export default function Equipo() {
  return (
    <Protegido roles={["equipo_salud", "coordinador"]}>
      <JornadaDeHoy />
    </Protegido>
  );
}

interface Mensaje {
  de: "usuario" | "asistente" | "sistema";
  texto: string;
}

const SUGERENCIAS = ["¿A qué hora llegamos a cada vereda?", "¿Dónde es más probable que llueva?", "¿Por qué esta es la primera parada?"];

function JornadaDeHoy() {
  const api = useApi();
  const [ruta, setRuta] = useState<Ruta | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [pregunta, setPregunta] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fin = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const lista = await api<RutaResumen[]>("/rutas?limite=1");
        if (vivo && lista[0]) setRuta(await api<Ruta>(`/rutas/${lista[0].id}`));
      } catch (e) {
        if (vivo) setError(e instanceof ErrorApi ? e.message : "No fue posible cargar la jornada.");
      } finally {
        if (vivo) setCargando(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [api]);

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [mensajes]);

  async function enviar(texto: string, ev?: FormEvent) {
    ev?.preventDefault();
    const q = texto.trim();
    if (!ruta || q.length < 3 || enviando) return;
    setMensajes((m) => [...m, { de: "usuario", texto: q }]);
    setPregunta("");
    setEnviando(true);
    try {
      const r = await api<RespuestaConsulta>("/ia/consultas", { metodo: "POST", cuerpo: { ruta_id: ruta.ruta_id, pregunta: q } });
      const extra: Mensaje[] = [];
      if (r.datos_personales_ocultados > 0) {
        extra.push({ de: "sistema", texto: `Se ocultaron ${r.datos_personales_ocultados} dato(s) personal(es) antes de enviar la pregunta. No escriba datos de pacientes.` });
      }
      setMensajes((m) => [...m, ...extra, { de: "asistente", texto: r.respuesta }]);
    } catch (e) {
      setMensajes((m) => [...m, { de: "sistema", texto: e instanceof ErrorApi ? e.message : "No fue posible enviar la pregunta." }]);
    } finally {
      setEnviando(false);
    }
  }

  if (cargando) {
    return (
      <main className="px-4 py-8">
        <Cargando texto="Cargando la jornada…" />
      </main>
    );
  }
  if (error || !ruta) {
    return (
      <main className="mx-auto max-w-xl px-4 py-8">
        {error ? <Mensaje tipo="error">{error}</Mensaje> : <Mensaje>Todavía no hay una ruta asignada.</Mensaje>}
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-5">
      <div className="flex flex-col leading-snug">
        <h1 className="text-lg font-semibold">Jornada del {fechaLarga(ruta.fecha_jornada)}</h1>
        <span className="text-[12.5px] text-tenue">
          {ruta.codigo} · {ruta.orden.length} veredas · {km(ruta.distancia_total_km)} · regreso {ruta.regreso.hora}
        </span>
      </div>

      <ol aria-label="Paradas" className="flex list-none flex-col gap-2 p-0">
        {ruta.orden.map((p) => {
          const ll = lluviaEnVisita(p, ruta.clima_por_vereda);
          const nivel = nivelLluvia(ll);
          return (
            <li key={p.vereda_id} className="flex items-center gap-3 rounded-[10px] border border-linea bg-superficie px-3 py-2.5">
              <span aria-hidden="true" className="inline-flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full bg-marca-suave text-[13px] font-semibold text-marca-hover">
                {p.posicion}
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium">
                  <span className="sr-only">Parada {p.posicion}: </span>
                  {p.nombre}
                </span>
                <span className="text-[12.5px] text-tenue">
                  {p.llegada} – {p.salida}
                </span>
              </div>
              <Insignia tono={nivel === "alta" ? "ocre" : nivel === "media" ? "marca" : "neutro"}>{ll === null ? "sin pronóstico" : `lluvia ${pct(ll)}`}</Insignia>
            </li>
          );
        })}
      </ol>

      <section aria-labelledby="t-asist" className="flex flex-col rounded-[10px] border border-linea bg-superficie">
        <h2 id="t-asist" className="border-b border-linea-tenue px-3.5 py-3 text-sm font-semibold">
          Preguntas sobre la ruta
        </h2>
        <div aria-live="polite" className="flex max-h-[420px] min-h-[160px] flex-col gap-2.5 overflow-y-auto p-3.5 text-sm">
          {mensajes.length === 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-tenue">Pregunte por horarios, lluvia o el motivo de cada parada.</p>
              <div className="flex flex-wrap gap-2">
                {SUGERENCIAS.map((s) => (
                  <button key={s} type="button" onClick={() => void enviar(s)} className="min-h-9 cursor-pointer rounded-full border border-linea bg-superficie px-3 text-[13px] text-tinta-2 hover:bg-suave">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {mensajes.map((m, i) =>
            m.de === "sistema" ? (
              <p key={i} className="rounded-lg bg-suave px-3 py-2 text-[13px] text-tinta-2">
                {m.texto}
              </p>
            ) : (
              <div key={i} className={`max-w-[90%] rounded-xl px-3 py-2 ${m.de === "usuario" ? "self-end bg-marca text-white" : "self-start bg-suave text-tinta"}`}>
                <span className="sr-only">{m.de === "usuario" ? "Usted: " : "Asistente: "}</span>
                {m.texto}
              </div>
            ),
          )}
          {enviando && <Cargando texto="El asistente está respondiendo…" />}
          <div ref={fin} />
        </div>
        <form onSubmit={(e) => void enviar(pregunta, e)} className="flex gap-2 border-t border-linea-tenue p-2.5">
          <label htmlFor="q" className="sr-only">
            Escriba su pregunta
          </label>
          <input
            id="q"
            type="text"
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            maxLength={500}
            placeholder="Escriba su pregunta"
            className="h-11 min-w-0 flex-1 rounded-lg border border-campo px-3"
          />
          <button type="submit" disabled={enviando || pregunta.trim().length < 3} className="h-11 cursor-pointer rounded-lg bg-marca px-3.5 font-medium text-white hover:bg-marca-hover disabled:cursor-not-allowed disabled:bg-tenue">
            Enviar
          </button>
        </form>
        <p className="px-3.5 pb-3 text-xs text-tenue">El asistente no da diagnósticos ni usa datos de pacientes. La ruta solo la cambia el coordinador.</p>
      </section>
    </main>
  );
}
