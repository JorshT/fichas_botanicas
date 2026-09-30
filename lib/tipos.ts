// Tipos compartidos entre servidor y componentes de cliente.

export const TIPOS_FOTO = ["planta", "flor", "fruto"] as const;
export type TipoFoto = (typeof TIPOS_FOTO)[number];

export const NOMBRE_TIPO_FOTO: Record<TipoFoto, string> = {
  planta: "Planta completa",
  flor: "Flor",
  fruto: "Fruto",
};

// Límites de tamaño que el servidor acepta (el navegador comprime por debajo).
export const MAX_BYTES_FOTO = 1024 * 1024;
export const MAX_BYTES_MINIATURA = 200 * 1024;

export type FotoVista = {
  tipo: TipoFoto;
  url: string;
  urlMiniatura: string;
};

export type FichaVista = {
  id: string;
  nombreCientifico: string;
  nombreComun: string | null;
  lugarTexto: string;
  lat: number | null;
  lng: number | null;
  fechaRecoleccion: string; // YYYY-MM-DD
  autor: string | null;
  numeroSemilla: string | null;
  comentario: string | null;
  creadoEn: string;
  actualizadoEn: string;
  eliminadoEn: string | null;
  fotos: Partial<Record<TipoFoto, FotoVista>>;
};

export type ResultadoGuardar = { ok: true; id: string } | { ok: false; error: string };
