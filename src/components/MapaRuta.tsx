"use client";
// Mapa real (Leaflet + OpenStreetMap). Solo puntos fijos de veredas: no hay rastreo de ubicación.
import { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import type { CatalogoVeredas, Parada } from "@/lib/tipos";

const MARCA = "#16748a";

// Servidores de teselas. Si el oficial falla (p. ej. un firewall con inspección TLS lo bloquea,
// como ocurre en la red de la universidad), el mapa cambia solo al de OpenStreetMap Francia.
const TESELAS = [
  {
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    atribucion: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  {
    url: "https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png",
    atribucion: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · teselas OSM France',
  },
];
const ERRORES_PARA_CAMBIAR = 3;

function Encuadre({ limites }: { limites: LatLngBoundsExpression }) {
  const mapa = useMap();
  useEffect(() => {
    mapa.fitBounds(limites, { padding: [28, 28] });
  }, [mapa, limites]);
  return null;
}

export default function MapaRuta({ catalogo, paradas }: { catalogo: CatalogoVeredas; paradas: Parada[] }) {
  const { hospital, veredas } = catalogo;
  const porId = useMemo(() => Object.fromEntries(veredas.map((v) => [v.id, v])), [veredas]);
  const puntos = useMemo<[number, number][]>(
    () => [
      [hospital.lat, hospital.lon],
      ...paradas.filter((p) => porId[p.vereda_id]).map((p) => [porId[p.vereda_id].lat, porId[p.vereda_id].lon] as [number, number]),
      [hospital.lat, hospital.lon],
    ],
    [hospital, paradas, porId],
  );
  const [trazado, setTrazado] = useState<{ linea: LatLngExpression[]; porVia: boolean }>({ linea: puntos, porVia: false });
  const [servidor, setServidor] = useState(0);
  const fallas = useRef(0);
  const alFallarTesela = () => {
    fallas.current += 1;
    if (fallas.current >= ERRORES_PARA_CAMBIAR && servidor < TESELAS.length - 1) {
      fallas.current = 0;
      setServidor((s) => s + 1);
    }
  };

  // Trazado por las vías reales con OSRM; si falla, líneas rectas entre paradas.
  useEffect(() => {
    let vivo = true;
    setTrazado({ linea: puntos, porVia: false });
    if (puntos.length < 3) return;
    const coords = puntos.map(([la, lo]) => `${lo.toFixed(5)},${la.toFixed(5)}`).join(";");
    fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        const g: [number, number][] | undefined = d?.routes?.[0]?.geometry?.coordinates;
        if (vivo && g?.length) setTrazado({ linea: g.map(([lo, la]) => [la, lo]), porVia: true });
      })
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [puntos]);

  const limites = useMemo<LatLngBoundsExpression>(() => {
    const todos = [[hospital.lat, hospital.lon], ...veredas.map((v) => [v.lat, v.lon])] as [number, number][];
    return todos;
  }, [hospital, veredas]);
  const enRuta = new Set(paradas.map((p) => p.vereda_id));

  return (
    <div className="flex flex-col gap-2">
      <div className="h-[380px] overflow-hidden rounded-lg border border-linea">
        <MapContainer
          center={[hospital.lat, hospital.lon]}
          zoom={12}
          scrollWheelZoom={false}
          style={{ height: "100%", width: "100%" }}
          aria-label="Mapa del recorrido de la jornada"
        >
          <TileLayer
            key={servidor}
            attribution={TESELAS[servidor].atribucion}
            url={TESELAS[servidor].url}
            eventHandlers={{ tileerror: alFallarTesela }}
          />
          <Encuadre limites={limites} />
          <Polyline positions={trazado.linea} pathOptions={{ color: MARCA, weight: 3.5, opacity: 0.85, dashArray: trazado.porVia ? undefined : "6 6" }} />
          {veredas
            .filter((v) => !enRuta.has(v.id))
            .map((v) => (
              <CircleMarker key={v.id} center={[v.lat, v.lon]} radius={5} pathOptions={{ color: "#9aa8af", fillColor: "#b6c2c8", fillOpacity: 1, weight: 1 }}>
                <Tooltip className="etiqueta-mapa">{v.nombre}</Tooltip>
              </CircleMarker>
            ))}
          {paradas.map((p) =>
            porId[p.vereda_id] ? (
              <CircleMarker
                key={p.vereda_id}
                center={[porId[p.vereda_id].lat, porId[p.vereda_id].lon]}
                radius={11}
                pathOptions={{ color: "#ffffff", fillColor: MARCA, fillOpacity: 1, weight: 2 }}
              >
                <Tooltip permanent direction="center" className="!border-0 !bg-transparent !p-0 !text-[12px] !font-semibold !text-white !shadow-none">
                  {p.posicion}
                </Tooltip>
              </CircleMarker>
            ) : null,
          )}
          <CircleMarker center={[hospital.lat, hospital.lon]} radius={8} pathOptions={{ color: "#ffffff", fillColor: "#1e2a30", fillOpacity: 1, weight: 2 }}>
            <Tooltip permanent direction="right" offset={[10, 0]} className="etiqueta-mapa">
              Hospital San Rafael
            </Tooltip>
          </CircleMarker>
        </MapContainer>
      </div>
      <p className="text-[12.5px] text-tenue">
        {trazado.porVia ? "Trazado por las vías (OSRM)." : "Trazado aproximado en línea recta (OSRM no respondió)."} Ubicaciones fijas de las veredas; no hay rastreo de ubicación.
      </p>
    </div>
  );
}
