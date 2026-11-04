"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Protegido } from "@/components/Protegido";
import { Boton, Cargando, IconoCheck, Insignia, Mensaje, Tarjeta } from "@/components/ui";
import { ErrorApi, useApi } from "@/lib/api";
import { horaCorta, km, nombreAccion, nombreActor } from "@/lib/formato";
import type { EventoAuditoria, Reproduccion, RutaResumen, Verificacion } from "@/lib/tipos";

const ACCIONES = ["ruta_generada", "explicacion_generada", "consulta_asistente", "ruta_reproducida", "ruta_ejecutada", "simulacion_ejecutada", "auditoria_consultada"];

export default function Auditoria() {
  return (
    <Protegido roles={["auditor"]}>
      <PanelAuditoria />
    </Protegido>
  );
}

function PanelAuditoria() {
  const api = useApi();
  const [verif, setVerif] = useState<Verificacion | null>(null);
  const [eventos, setEventos] = useState<EventoAuditoria[] | null>(null);
  const [rutas, setRutas] = useState<RutaResumen[]>([]);
  const [accion, setAccion] = useState("");
  const [rutaFiltro, setRutaFiltro] = useState("");
  const [sel, setSel] = useState<RutaResumen | null>(null);
  const [repro, setRepro] = useState<Reproduccion | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const msg = (e: unknown) => (e instanceof ErrorApi ? e.message : "Ocurrió un error inesperado.");

  const verificar = useCallback(async () => {
    setOcupado("verificar");
    try {
      setVerif(await api<Verificacion>("/auditoria/verificar"));
    } catch (e) {
      setError(msg(e));
    } finally {
      setOcupado(null);
    }
  }, [api]);

  const cargarEventos = useCallback(
    async (acc: string, rutaId: string) => {
      setOcupado("eventos");
      setError(null);
      const q = new URLSearchParams({ limite: "50" });
      if (acc) q.set("accion", acc);
      if (rutaId) q.set("recurso", `ruta:${rutaId}`);
      try {
        setEventos(await api<EventoAuditoria[]>(`/auditoria/eventos?${q}`));
      } catch (e) {
        setError(msg(e));
      } finally {
        setOcupado(null);
      }
    },
    [api],
  );

  useEffect(() => {
    void verificar();
    void cargarEventos("", "");
    api<RutaResumen[]>("/rutas?limite=20").then(setRutas).catch((e) => setError(msg(e)));
  }, [api, verificar, cargarEventos]);

  function filtrar(ev: FormEvent) {
    ev.preventDefault();
    const r = rutas.find((x) => x.codigo === rutaFiltro.trim() || x.id === rutaFiltro.trim());
    if (rutaFiltro.trim() && !r) {
      setError("No se encontró una ruta con ese código entre las 20 más recientes.");
      return;
    }
    void cargarEventos(accion, r?.id ?? "");
  }

  async function reproducir(r: RutaResumen) {
    setSel(r);
    setRepro(null);
    setOcupado("repro");
    setError(null);
    try {
      setRepro(await api<Reproduccion>(`/rutas/${r.id}/reproducir`, { metodo: "POST" }));
      void cargarEventos("", r.id);
    } catch (e) {
      setError(msg(e));
    } finally {
      setOcupado(null);
    }
  }

  return (
    <main className="mx-auto flex max-w-[1360px] flex-col gap-5 px-4 py-7 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-[22px] font-semibold">Registro de auditoría</h1>
          <p className="text-sm text-tenue">Cada evento queda encadenado con el anterior. El registro no se puede modificar ni borrar.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {verif && (
            <span
              role="status"
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13.5px] ${verif.integra ? "bg-verde-suave text-verde-texto" : "bg-error-suave text-error-texto"}`}
            >
              {verif.integra && <IconoCheck />}
              {verif.integra ? `Cadena íntegra · ${verif.eventos_verificados} eventos` : `Cadena alterada desde el evento ${verif.primer_seq_invalido}: ${verif.motivo}`}
            </span>
          )}
          <Boton variante="neutro" onClick={verificar} disabled={ocupado === "verificar"}>
            {ocupado === "verificar" ? "Verificando…" : "Verificar ahora"}
          </Boton>
        </div>
      </div>

      {error && <Mensaje tipo="error">{error}</Mensaje>}

      <form onSubmit={filtrar} className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
          <label htmlFor="acc" className="text-[13px] text-tinta-2">Acción</label>
          <select id="acc" value={accion} onChange={(e) => setAccion(e.target.value)} className="h-10 rounded-lg border border-campo bg-superficie px-2.5">
            <option value="">Todas</option>
            {ACCIONES.map((a) => (
              <option key={a} value={a}>
                {nombreAccion(a)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
          <label htmlFor="rec" className="text-[13px] text-tinta-2">Código de ruta</label>
          <input id="rec" type="text" value={rutaFiltro} onChange={(e) => setRutaFiltro(e.target.value)} placeholder="R-20261105-01" className="h-10 rounded-lg border border-campo px-3" />
        </div>
        <Boton type="submit" disabled={ocupado === "eventos"}>
          Filtrar
        </Boton>
      </form>

      <div className="flex flex-wrap items-start gap-5">
        <div className="min-w-0 flex-[999_1_620px] overflow-x-auto rounded-[10px] border border-linea bg-superficie">
          {eventos === null ? (
            <div className="p-5">
              <Cargando texto="Cargando eventos…" />
            </div>
          ) : (
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <caption className="sr-only">Eventos de auditoría, del más reciente al más antiguo</caption>
              <thead>
                <tr className="text-left text-[12.5px] text-tenue">
                  <th scope="col" className="border-b border-linea px-5 py-2.5 font-medium">#</th>
                  <th scope="col" className="border-b border-linea px-3 py-2.5 font-medium">Hora</th>
                  <th scope="col" className="border-b border-linea px-3 py-2.5 font-medium">Quién</th>
                  <th scope="col" className="border-b border-linea px-3 py-2.5 font-medium">Acción</th>
                  <th scope="col" className="border-b border-linea px-3 py-2.5 pr-5 font-medium">Hash</th>
                </tr>
              </thead>
              <tbody>
                {eventos.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-4 text-tenue">
                      No hay eventos con esos filtros.
                    </td>
                  </tr>
                )}
                {eventos.map((e) => (
                  <tr key={e.seq}>
                    <td className="border-b border-linea-tenue px-5 py-2.5 text-tenue">{e.seq}</td>
                    <td className="border-b border-linea-tenue px-3 py-2.5 whitespace-nowrap">{horaCorta(e.ts)}</td>
                    <td className="border-b border-linea-tenue px-3 py-2.5">{nombreActor(e.actor)}</td>
                    <td className="border-b border-linea-tenue px-3 py-2.5">{nombreAccion(e.accion)}</td>
                    <td className="border-b border-linea-tenue px-3 py-2.5 pr-5 font-mono text-[13px] text-tenue" title={e.hash}>
                      {e.hash.slice(0, 10)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <aside aria-label="Reproducir rutas" className="flex w-full flex-col gap-5 lg:w-[400px]">
          <Tarjeta titulo="Reproducir una ruta" id="t-repro">
            <p className="mb-3 text-[13px] text-tenue">Vuelve a calcular la ruta con sus entradas originales y compara el resultado con el guardado.</p>
            <ul className="flex max-h-[320px] list-none flex-col gap-1.5 overflow-y-auto p-0">
              {rutas.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-2 border-t border-linea-tenue pt-1.5 text-sm">
                  <div className="flex flex-col">
                    <span className="font-medium">{r.codigo}</span>
                    <span className="text-[12.5px] text-tenue">
                      {r.creado_por} · {km(r.distancia_total_km)} · {r.estado}
                    </span>
                  </div>
                  <Boton variante="secundario" className="min-h-9 px-3 text-[13px]" onClick={() => void reproducir(r)} disabled={ocupado === "repro"}>
                    Reproducir
                  </Boton>
                </li>
              ))}
            </ul>
          </Tarjeta>
          {sel && (
            <Tarjeta titulo={sel.codigo} id="t-res">
              {ocupado === "repro" || !repro ? (
                <Cargando texto="Recalculando…" />
              ) : (
                <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] gap-x-3 gap-y-2 text-sm">
                  <dt className="text-tenue">Entradas</dt>
                  <dd>{repro.integridad_entradas ? <Insignia tono="verde">sin alteraciones</Insignia> : <Insignia tono="error">alteradas</Insignia>}</dd>
                  <dt className="text-tenue">Resultado</dt>
                  <dd>{repro.resultado_coincide ? <Insignia tono="verde">idéntico al original</Insignia> : <Insignia tono="error">distinto</Insignia>}</dd>
                  <dt className="text-tenue">Distancia</dt>
                  <dd>
                    {km(repro.distancia_original_km)} → {km(repro.distancia_reproducida_km)}
                  </dd>
                  <dt className="text-tenue">Huella</dt>
                  <dd className="font-mono text-[12.5px] break-all text-tinta-2">{repro.huella_resultado_reproducido.slice(0, 24)}…</dd>
                </dl>
              )}
            </Tarjeta>
          )}
        </aside>
      </div>
    </main>
  );
}
