// Tipos de las respuestas del backend (servicios rutas, ia y auditoria)

export type Rol = "coordinador" | "equipo_salud" | "auditor";

export interface Puntaje {
  vereda_id: string;
  prioridad: number;
  vulnerabilidad: number;
  accesibilidad: number;
  equidad: number;
  dias_sin_visita: number | null;
  lluvia_fuerte: boolean;
  penalizada_por_lluvia: boolean;
  en_descanso: boolean;
}

export interface Parada {
  posicion: number;
  vereda_id: string;
  nombre: string;
  corregimiento: string;
  tramo_km: number;
  tramo_min: number;
  llegada: string;
  salida: string;
  puntaje: Puntaje;
}

export interface ClimaVereda {
  prob_lluvia_max: number;
  precipitacion_mm: number;
  por_hora: Record<string, { prob: number; mm: number }>;
  tipo_via?: string;
}

export interface Explicacion {
  resumen: string;
  por_parada: { vereda: string; razon: string }[];
  advertencias?: string[];
  revision_etica: {
    metodo: string;
    aprobado_revisor_ia: boolean | null;
    aprobado_reglas: boolean;
    observaciones: string[];
    version_prompts: string;
  };
  modelo: string | null;
  aviso: string;
}

export interface Ruta {
  ruta_id: string;
  codigo: string;
  fecha_jornada: string;
  estado: "propuesta" | "ejecutada";
  creado_por: string;
  creado_en: string;
  orden: Parada[];
  regreso: { km: number; min: number; hora: string };
  distancia_total_km: number;
  tiempo_viaje_min: number;
  tiempo_total_min: number;
  optimizacion: { algoritmo: string; costo_heuristico_min: number; costo_optimo_min: number; brecha_vs_optimo_pct: number };
  descartadas: { vereda_id: string; prioridad: number; motivo: string }[];
  ranking: Puntaje[];
  parametros: Record<string, unknown>;
  fuente_distancias: string;
  clima_disponible: boolean;
  clima_por_vereda: Record<string, ClimaVereda> | null;
  version_datos: string;
  huellas: { entradas: string; resultado: string };
  explicacion: Explicacion | null;
}

export interface RutaResumen {
  id: string;
  codigo: string;
  fecha_jornada: string;
  creado_en: string;
  creado_por: string;
  estado: string;
  orden: string[];
  distancia_total_km: number;
  hora_regreso: string;
}

export interface Vereda {
  id: string;
  nombre: string;
  corregimiento: string;
  lat: number;
  lon: number;
  vulnerabilidad: { indice: number; componentes: Record<string, number> };
  via_acceso: { tipo: string };
  acceso_hospital: { km_via: number; min_via: number };
}

export interface CatalogoVeredas {
  version_datos: string;
  hospital: { id: string; nombre: string; lat: number; lon: number };
  veredas: Vereda[];
}

export interface Simulacion {
  jornadas: { fecha: string; veredas: string[]; distancia_km: number; hora_regreso: string }[];
  metricas: {
    n_jornadas: number;
    cobertura_pct: number;
    veredas_nunca_visitadas: string[];
    visitas_por_corregimiento: Record<string, { veredas: number; visitas: number }>;
    espera_maxima_dias: Record<string, number>;
    distancia_total_km: number;
  };
  supuestos: string[];
}

export interface EventoAuditoria {
  seq: number;
  ts: string;
  accion: string;
  actor: string;
  actor_tipo: string;
  roles: string[];
  recurso: string;
  ip: string;
  servicio_origen: string;
  hash: string;
  hash_anterior: string;
}

export interface Verificacion {
  integra: boolean;
  eventos_verificados: number;
  primer_seq_invalido: number | null;
  motivo: string | null;
  hash_final: string;
}

export interface Reproduccion {
  codigo: string;
  integridad_entradas: boolean;
  resultado_coincide: boolean;
  orden_original: string[];
  orden_reproducido: string[];
  distancia_original_km: number;
  distancia_reproducida_km: number;
  huella_resultado_original: string;
  huella_resultado_reproducido: string;
}

export interface RespuestaConsulta {
  ruta_id: string;
  respuesta: string;
  datos_personales_ocultados: number;
  bloqueada_por_revision: boolean;
  aviso: string;
}
