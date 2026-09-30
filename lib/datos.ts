import "server-only";
import { BUCKET_FOTOS, supabaseServidor } from "./supabase-servidor";
import type { FichaVista, FotoVista, TipoFoto } from "./tipos";

export const FICHAS_POR_PAGINA = 24;
const DURACION_URL_FOTO = 60 * 60; // 1 hora

type FilaFoto = { tipo: TipoFoto; ruta: string; ruta_miniatura: string };
type FilaFicha = {
  id: string;
  nombre_cientifico: string;
  nombre_comun: string | null;
  lugar_texto: string;
  lat: number | null;
  lng: number | null;
  fecha_recoleccion: string;
  autor: string | null;
  numero_semilla: string | null;
  comentario: string | null;
  creado_en: string;
  actualizado_en: string;
  eliminado_en: string | null;
  fotos: FilaFoto[];
};

const COLUMNAS =
  "id, nombre_cientifico, nombre_comun, lugar_texto, lat, lng, fecha_recoleccion, autor, numero_semilla, comentario, creado_en, actualizado_en, eliminado_en, fotos(tipo, ruta, ruta_miniatura)";

// Convierte filas de la BD en fichas con URLs firmadas (temporales) para las fotos.
async function aVista(filas: FilaFicha[], soloMiniaturas: boolean): Promise<FichaVista[]> {
  const rutas = filas.flatMap((f) =>
    f.fotos.flatMap((foto) => (soloMiniaturas ? [foto.ruta_miniatura] : [foto.ruta, foto.ruta_miniatura])),
  );
  const urls = new Map<string, string>();
  if (rutas.length > 0) {
    const { data, error } = await supabaseServidor()
      .storage.from(BUCKET_FOTOS)
      .createSignedUrls(rutas, DURACION_URL_FOTO);
    if (error) throw new Error(`Error al firmar URLs de fotos: ${error.message}`);
    for (const item of data) {
      if (item.path && item.signedUrl) urls.set(item.path, item.signedUrl);
    }
  }

  return filas.map((f) => {
    const fotos: Partial<Record<TipoFoto, FotoVista>> = {};
    for (const foto of f.fotos) {
      const urlMiniatura = urls.get(foto.ruta_miniatura) ?? "";
      fotos[foto.tipo] = {
        tipo: foto.tipo,
        urlMiniatura,
        url: soloMiniaturas ? urlMiniatura : (urls.get(foto.ruta) ?? ""),
      };
    }
    return {
      id: f.id,
      nombreCientifico: f.nombre_cientifico,
      nombreComun: f.nombre_comun,
      lugarTexto: f.lugar_texto,
      lat: f.lat,
      lng: f.lng,
      fechaRecoleccion: f.fecha_recoleccion,
      autor: f.autor,
      numeroSemilla: f.numero_semilla,
      comentario: f.comentario,
      creadoEn: f.creado_en,
      actualizadoEn: f.actualizado_en,
      eliminadoEn: f.eliminado_en,
      fotos,
    };
  });
}

// Deja solo letras, números, espacios, puntos y guiones: evita romper el filtro
// de PostgREST con comas, paréntesis o comodines.
function limpiarBusqueda(q: string): string {
  return q.replace(/[^\p{L}\p{N} .-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export async function listarFichas(
  coleccionId: string,
  opciones: { busqueda?: string; pagina?: number; enPapelera?: boolean } = {},
): Promise<{ fichas: FichaVista[]; total: number }> {
  const pagina = Math.max(1, opciones.pagina ?? 1);
  const desde = (pagina - 1) * FICHAS_POR_PAGINA;

  let consulta = supabaseServidor()
    .from("fichas")
    .select(COLUMNAS, { count: "exact" })
    .eq("coleccion_id", coleccionId);

  consulta = opciones.enPapelera
    ? consulta.not("eliminado_en", "is", null).order("eliminado_en", { ascending: false })
    : consulta
        .is("eliminado_en", null)
        .order("fecha_recoleccion", { ascending: false })
        .order("creado_en", { ascending: false });

  const busqueda = limpiarBusqueda(opciones.busqueda ?? "");
  if (busqueda) {
    consulta = consulta.or(
      `nombre_cientifico.ilike.%${busqueda}%,nombre_comun.ilike.%${busqueda}%,lugar_texto.ilike.%${busqueda}%,numero_semilla.ilike.%${busqueda}%`,
    );
  }

  const { data, error, count } = await consulta.range(desde, desde + FICHAS_POR_PAGINA - 1);
  if (error) throw new Error(`Error al listar fichas: ${error.message}`);
  return {
    fichas: await aVista((data ?? []) as FilaFicha[], true),
    total: count ?? 0,
  };
}

export async function obtenerFicha(coleccionId: string, id: string): Promise<FichaVista | null> {
  const { data, error } = await supabaseServidor()
    .from("fichas")
    .select(COLUMNAS)
    .eq("coleccion_id", coleccionId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Error al obtener la ficha: ${error.message}`);
  if (!data) return null;
  const [ficha] = await aVista([data as FilaFicha], false);
  return ficha;
}
