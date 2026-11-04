"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Protegido } from "@/components/Protegido";
import { Descartadas, PanelExplicacion, TablaParadas } from "@/components/Ruta";
import { Boton, Cargando, Dato, Mensaje, Tarjeta } from "@/components/ui";
import { ErrorApi, useApi } from "@/lib/api";
import { fechaLarga, km, manana, pct } from "@/lib/formato";
import type { CatalogoVeredas, Ruta, RutaResumen, Simulacion } from "@/lib/tipos";

const MapaRuta = dynamic(() => import("@/components/MapaRuta"), {
  ssr: false,
  loading: () => <div className="h-[380px] rounded-lg bg-suave" aria-hidden="true" />,
});

export default function Planificar() {
  return (
    <Protegido roles={["coordinador"]}>
      <Planificador />
    </Protegido>
  );
}

function Planificador() {
  const api = useApi();
  const [catalogo, setCatalogo] = useState<CatalogoVeredas | null>(null);
  const [ruta, setRuta] = useState<Ruta | null>(null);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [sim, setSim] = useState<Simulacion | null>(null);
  const [simulando, setSimulando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);

  const [fecha, setFecha] = useState(manana());
  const [n, setN] = useState(5);
  const [alpha, setAlpha] = useState(0.7);
  const [lluvia, setLluvia] = useState(true);

  const nombres = useMemo(() => Object.fromEntries((catalogo?.veredas ?? []).map((v) => [v.id, v.nombre])), [catalogo]);
  const msg = (e: unknown) => (e instanceof ErrorApi ? e.message : "Ocurrió un error inesperado.");

  // Carga inicial: catálogo de veredas y la ruta más reciente
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const [cat, lista] = await Promise.all([api<CatalogoVeredas>("/veredas"), api<RutaResumen[]>("/rutas?limite=1")]);
        if (!vivo) return;
        setCatalogo(cat);
        if (lista[0]) setRuta(await api<Ruta>(`/rutas/${lista[0].id}`));
      } catch (e) {
        if (vivo) setError(msg(e));
      } finally {
        if (vivo) setCargandoInicial(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [api]);

  const generar = useCallback(
    async (ev: FormEvent) => {
      ev.preventDefault();
      setGenerando(true);
      setError(null);
      setAviso(null);
      setSim(null);
      try {
        const r = await api<Ruta>("/rutas", { metodo: "POST", cuerpo: { fecha, n_veredas: n, alpha, considerar_lluvia: lluvia } });
        setRuta(r);
        setAviso(`Ruta ${r.codigo} generada y registrada en la auditoría.`);
      } catch (e) {
        setError(msg(e));
      } finally {
        setGenerando(false);
      }
    },
    [api, fecha, n, alpha, lluvia],
  );

  const confirmar = useCallback(async () => {
    if (!ruta) return;
    if (!window.confirm(`¿Confirmar que la jornada ${ruta.codigo} se realizó? Esto actualiza los días sin visita de cada vereda.`)) return;
    setConfirmando(true);
    setError(null);
    try {
      setRuta(await api<Ruta>(`/rutas/${ruta.ruta_id}/ejecutada`, { metodo: "POST" }));
      setAviso("Jornada confirmada. Las próximas rutas tendrán en cuenta estas visitas.");
    } catch (e) {
      setError(msg(e));
    } finally {
      setConfirmando(false);
    }
  }, [api, ruta]);

  const simular = useCallback(async () => {
    setSimulando(true);
    setError(null);
    try {
      setSim(await api<Simulacion>("/rutas/simular", { metodo: "POST", cuerpo: { fecha, n_veredas: n, alpha, considerar_lluvia: false, n_jornadas: 10 } }));
    } catch (e) {
      setError(msg(e));
    } finally {
      setSimulando(false);
    }
  }, [api, fecha, n, alpha]);

  return (
    <main className="mx-auto flex max-w-[1360px] flex-col gap-5 px-4 py-7 sm:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-[22px] font-semibold">{ruta ? `Jornada del ${fechaLarga(ruta.fecha_jornada)}` : "Planificar jornada"}</h1>
        {ruta && (
          <span className="text-[13.5px] text-tenue">
            Ruta {ruta.codigo} · {ruta.estado === "ejecutada" ? "ejecutada" : "propuesta"}
          </span>
        )}
      </div>

      <div aria-live="polite" className="flex flex-col gap-2">
        {error && <Mensaje tipo="error">{error}</Mensaje>}
        {aviso && <Mensaje tipo="exito">{aviso}</Mensaje>}
      </div>

      <div className="flex flex-wrap items-start gap-5">
        {/* Parámetros */}
        <form onSubmit={generar} aria-labelledby="t-param" className="flex w-full flex-col gap-4 rounded-[10px] border border-linea bg-superficie p-5 lg:w-[300px]">
          <h2 id="t-param" className="text-[15px] font-semibold">
            Parámetros
          </h2>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fecha" className="text-[13px] text-tinta-2">Fecha</label>
            <input id="fecha" type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} className="h-[42px] rounded-lg border border-campo bg-superficie px-3" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="n" className="text-[13px] text-tinta-2">Veredas por jornada</label>
            <input id="n" type="number" min={1} max={7} required value={n} onChange={(e) => setN(Number(e.target.value))} className="h-[42px] rounded-lg border border-campo bg-superficie px-3" />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-[13px] text-tinta-2">
              <label htmlFor="alfa">Peso de la necesidad</label>
              <span aria-hidden="true">{alpha.toFixed(2).replace(".", ",")}</span>
            </div>
            <input id="alfa" type="range" min={0} max={1} step={0.05} value={alpha} onChange={(e) => setAlpha(Number(e.target.value))} aria-valuetext={`${Math.round(alpha * 100)} % necesidad`} className="w-full accent-marca" />
            <div className="flex justify-between text-xs text-tenue">
              <span>cercanía</span>
              <span>necesidad</span>
            </div>
            <details className="text-[12.5px] text-tenue">
              <summary className="cursor-pointer text-marca">¿Qué significa?</summary>
              <p className="mt-1">
                Con un valor alto se priorizan las veredas con mayor necesidad de atención aunque estén lejos. Con un valor bajo se priorizan las más cercanas. Además, ninguna vereda se repite antes de 7 días.
              </p>
            </details>
          </div>
          <label className="flex min-h-8 items-center gap-2.5 text-sm">
            <input type="checkbox" checked={lluvia} onChange={(e) => setLluvia(e.target.checked)} className="h-[18px] w-[18px] accent-marca" />
            Considerar pronóstico de lluvia
          </label>
          <Boton type="submit" disabled={generando}>
            {generando ? "Calculando…" : "Generar ruta"}
          </Boton>
          {generando && <Cargando texto="Consultando vías, clima y explicación. Puede tardar hasta 30 segundos." />}
          <p className="text-[12.5px] text-tenue">Salida y regreso: Hospital San Rafael. 45 min de atención por vereda, jornada de 8 h.</p>
        </form>

        {/* Resultado */}
        <section aria-label="Ruta generada" className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
          {cargandoInicial ? (
            <Cargando texto="Cargando la última ruta…" />
          ) : !ruta || !catalogo ? (
            <Tarjeta>
              <p className="text-sm text-tinta-2">Todavía no hay rutas. Elija la fecha y presione «Generar ruta».</p>
            </Tarjeta>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <Dato etiqueta="Distancia total" valor={km(ruta.distancia_total_km)} />
                <Dato etiqueta="Regreso al hospital" valor={ruta.regreso.hora} />
                <Dato etiqueta="Veredas" valor={`${ruta.orden.length} de ${catalogo.veredas.length}`} />
                <Dato etiqueta="Diferencia con el óptimo" valor={pct(ruta.optimizacion.brecha_vs_optimo_pct)} />
              </div>
              <Tarjeta titulo="Recorrido" id="t-mapa">
                <MapaRuta catalogo={catalogo} paradas={ruta.orden} />
              </Tarjeta>
              <TablaParadas ruta={ruta} />
              <Descartadas ruta={ruta} nombres={nombres} />
              {ruta.fuente_distancias !== "osrm" && (
                <Mensaje>Las distancias se estimaron en línea recta porque el servicio de vías no respondió.</Mensaje>
              )}
            </>
          )}
        </section>

        {/* Explicación y acciones */}
        {ruta && (
          <aside aria-label="Explicación y acciones" className="flex w-full flex-col gap-5 lg:w-[340px]">
            <Tarjeta titulo="Por qué esta ruta" id="t-exp">
              <PanelExplicacion ruta={ruta} />
            </Tarjeta>
            <Tarjeta titulo="Acciones" id="t-acc">
              <div className="flex flex-col gap-3">
                <Boton variante="secundario" onClick={confirmar} disabled={confirmando || ruta.estado === "ejecutada"}>
                  {ruta.estado === "ejecutada" ? "Jornada ya confirmada" : confirmando ? "Confirmando…" : "Confirmar jornada ejecutada"}
                </Boton>
                <Boton variante="neutro" onClick={simular} disabled={simulando}>
                  {simulando ? "Simulando…" : "Simular próximas 10 jornadas"}
                </Boton>
                <Link href="/equipo" className="text-sm">
                  Ver como equipo de salud
                </Link>
              </div>
            </Tarjeta>
          </aside>
        )}
      </div>

      {sim && <ResultadoSimulacion sim={sim} />}
    </main>
  );
}

function ResultadoSimulacion({ sim }: { sim: Simulacion }) {
  const m = sim.metricas;
  return (
    <Tarjeta titulo="Simulación de 10 jornadas" id="t-sim">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Dato etiqueta="Cobertura" valor={pct(m.cobertura_pct)} />
          <Dato etiqueta="Veredas nunca visitadas" valor={m.veredas_nunca_visitadas.length} />
          <Dato etiqueta="Espera máxima" valor={`${Math.max(0, ...Object.values(m.espera_maxima_dias))} días`} />
          <Dato etiqueta="Distancia total" valor={km(m.distancia_total_km)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="text-left text-[12.5px] text-tenue">
                <th scope="col" className="border-b border-linea py-2 pr-3 font-medium">Fecha</th>
                <th scope="col" className="border-b border-linea py-2 pr-3 font-medium">Veredas</th>
                <th scope="col" className="border-b border-linea py-2 font-medium">Distancia</th>
              </tr>
            </thead>
            <tbody>
              {sim.jornadas.map((j) => (
                <tr key={j.fecha}>
                  <td className="border-b border-linea-tenue py-2 pr-3 whitespace-nowrap">{fechaLarga(j.fecha)}</td>
                  <td className="border-b border-linea-tenue py-2 pr-3 text-tinta-2">{j.veredas.length ? j.veredas.join(", ") : "Sin veredas elegibles (periodo de descanso)"}</td>
                  <td className="border-b border-linea-tenue py-2 whitespace-nowrap">{j.veredas.length ? km(j.distancia_km) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[12.5px] text-tenue">
          Visitas por corregimiento: {Object.entries(m.visitas_por_corregimiento).map(([c, v]) => `${c} ${v.visitas}`).join(" · ")}. Supone que cada ruta se ejecuta completa.
        </p>
      </div>
    </Tarjeta>
  );
}
