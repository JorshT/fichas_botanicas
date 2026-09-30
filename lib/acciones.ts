"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { exigirEdicion } from "./acceso";
import { BUCKET_FOTOS, supabaseServidor } from "./supabase-servidor";
import {
  MAX_BYTES_FOTO,
  MAX_BYTES_MINIATURA,
  NOMBRE_TIPO_FOTO,
  TIPOS_FOTO,
  type ResultadoGuardar,
  type TipoFoto,
} from "./tipos";
import { esUuid, leerFicha } from "./validacion";

type ArchivoImagen = { archivo: File; extension: "jpg" | "webp"; tipoMime: string };

// Revisa los primeros bytes del archivo: no basta con confiar en el tipo que
// declara el navegador.
async function validarImagen(valor: FormDataEntryValue | null, maxBytes: number): Promise<ArchivoImagen | null> {
  if (!(valor instanceof File) || valor.size === 0) return null;
  if (valor.size > maxBytes) throw new Error("Una de las fotos es demasiado grande.");
  const b = new Uint8Array(await valor.slice(0, 12).arrayBuffer());
  const esJpeg = b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;
  const esWebp =
    String.fromCharCode(b[0], b[1], b[2], b[3]) === "RIFF" &&
    String.fromCharCode(b[8], b[9], b[10], b[11]) === "WEBP";
  if (esJpeg) return { archivo: valor, extension: "jpg", tipoMime: "image/jpeg" };
  if (esWebp) return { archivo: valor, extension: "webp", tipoMime: "image/webp" };
  throw new Error("Las fotos deben ser JPEG o WebP.");
}

type FotoNueva = { tipo: TipoFoto; completa: ArchivoImagen; miniatura: ArchivoImagen };

async function leerFotosNuevas(formData: FormData): Promise<FotoNueva[]> {
  const nuevas: FotoNueva[] = [];
  for (const tipo of TIPOS_FOTO) {
    const completa = await validarImagen(formData.get(`foto_${tipo}`), MAX_BYTES_FOTO);
    if (!completa) continue;
    const miniatura = await validarImagen(formData.get(`foto_${tipo}_min`), MAX_BYTES_MINIATURA);
    if (!miniatura) throw new Error(`Falta la miniatura de la foto "${NOMBRE_TIPO_FOTO[tipo]}".`);
    nuevas.push({ tipo, completa, miniatura });
  }
  return nuevas;
}

async function borrarArchivos(rutas: string[]) {
  if (rutas.length === 0) return;
  const { error } = await supabaseServidor().storage.from(BUCKET_FOTOS).remove(rutas);
  if (error) console.error("No se pudieron borrar archivos de fotos:", error.message);
}

// Sube las fotos nuevas y registra/reemplaza sus filas. Devuelve las rutas de
// archivos antiguos que quedaron sin uso y las rutas recién subidas.
async function guardarFotos(coleccionId: string, fichaId: string, fotos: FotoNueva[]) {
  const supabase = supabaseServidor();
  const subidas: string[] = [];
  const obsoletas: string[] = [];
  try {
    for (const { tipo, completa, miniatura } of fotos) {
      // Nombre único por versión: evita que el navegador o la CDN muestren la foto anterior.
      const base = `${coleccionId}/${fichaId}/${tipo}-${randomUUID()}`;
      const ruta = `${base}.${completa.extension}`;
      const rutaMiniatura = `${base}-min.${miniatura.extension}`;
      for (const [r, img] of [
        [ruta, completa],
        [rutaMiniatura, miniatura],
      ] as const) {
        const { error } = await supabase.storage
          .from(BUCKET_FOTOS)
          .upload(r, img.archivo, { contentType: img.tipoMime, upsert: false });
        if (error) throw new Error(`No se pudo subir la foto: ${error.message}`);
        subidas.push(r);
      }

      const { data: anterior } = await supabase
        .from("fotos")
        .select("ruta, ruta_miniatura")
        .eq("ficha_id", fichaId)
        .eq("tipo", tipo)
        .maybeSingle();

      const { error } = await supabase
        .from("fotos")
        .upsert({ ficha_id: fichaId, tipo, ruta, ruta_miniatura: rutaMiniatura }, { onConflict: "ficha_id,tipo" });
      if (error) throw new Error(`No se pudo registrar la foto: ${error.message}`);
      if (anterior) obsoletas.push(anterior.ruta, anterior.ruta_miniatura);
    }
  } catch (e) {
    await borrarArchivos(subidas);
    throw e;
  }
  return obsoletas;
}

function mensajeError(e: unknown): string {
  return e instanceof Error ? e.message : "Ocurrió un error inesperado.";
}

export async function crearFicha(token: string, formData: FormData): Promise<ResultadoGuardar> {
  const { coleccion } = await exigirEdicion(token);
  const datos = leerFicha(formData);
  if (!datos.success) return { ok: false, error: datos.error.issues[0].message };

  let fotos: FotoNueva[];
  try {
    fotos = await leerFotosNuevas(formData);
  } catch (e) {
    return { ok: false, error: mensajeError(e) };
  }
  if (!fotos.some((f) => f.tipo === "planta")) {
    return { ok: false, error: "La foto de la planta completa es obligatoria." };
  }

  const supabase = supabaseServidor();
  const { data: ficha, error } = await supabase
    .from("fichas")
    .insert({ ...datos.data, coleccion_id: coleccion.id })
    .select("id")
    .single();
  if (error) return { ok: false, error: `No se pudo guardar la ficha: ${error.message}` };

  try {
    await guardarFotos(coleccion.id, ficha.id, fotos);
  } catch (e) {
    await supabase.from("fichas").delete().eq("id", ficha.id);
    return { ok: false, error: mensajeError(e) };
  }
  return { ok: true, id: ficha.id };
}

export async function editarFicha(token: string, fichaId: string, formData: FormData): Promise<ResultadoGuardar> {
  const { coleccion } = await exigirEdicion(token);
  if (!esUuid(fichaId)) return { ok: false, error: "Ficha no encontrada." };
  const datos = leerFicha(formData);
  if (!datos.success) return { ok: false, error: datos.error.issues[0].message };

  let fotos: FotoNueva[];
  try {
    fotos = await leerFotosNuevas(formData);
  } catch (e) {
    return { ok: false, error: mensajeError(e) };
  }

  const supabase = supabaseServidor();
  const { data: actualizada, error } = await supabase
    .from("fichas")
    .update(datos.data)
    .eq("id", fichaId)
    .eq("coleccion_id", coleccion.id)
    .is("eliminado_en", null)
    .select("id")
    .maybeSingle();
  if (error) return { ok: false, error: `No se pudo guardar la ficha: ${error.message}` };
  if (!actualizada) return { ok: false, error: "Ficha no encontrada." };

  try {
    const obsoletas = await guardarFotos(coleccion.id, fichaId, fotos);

    // Flor y fruto se pueden quitar; la foto de la planta no.
    const aQuitar = (["flor", "fruto"] as const).filter(
      (tipo) => formData.get(`quitar_${tipo}`) === "1" && !fotos.some((f) => f.tipo === tipo),
    );
    if (aQuitar.length > 0) {
      const { data: quitadas, error: errorQuitar } = await supabase
        .from("fotos")
        .delete()
        .eq("ficha_id", fichaId)
        .in("tipo", aQuitar)
        .select("ruta, ruta_miniatura");
      if (errorQuitar) throw new Error(`No se pudo quitar la foto: ${errorQuitar.message}`);
      for (const q of quitadas ?? []) obsoletas.push(q.ruta, q.ruta_miniatura);
    }
    await borrarArchivos(obsoletas);
  } catch (e) {
    return { ok: false, error: mensajeError(e) };
  }
  return { ok: true, id: fichaId };
}

export async function enviarAPapelera(token: string, fichaId: string) {
  const { coleccion } = await exigirEdicion(token);
  if (!esUuid(fichaId)) throw new Error("Ficha no encontrada.");
  const { error } = await supabaseServidor()
    .from("fichas")
    .update({ eliminado_en: new Date().toISOString() })
    .eq("id", fichaId)
    .eq("coleccion_id", coleccion.id);
  if (error) throw new Error(`No se pudo borrar la ficha: ${error.message}`);
  redirect(`/c/${token}`);
}

export async function restaurarFicha(token: string, fichaId: string) {
  const { coleccion } = await exigirEdicion(token);
  if (!esUuid(fichaId)) throw new Error("Ficha no encontrada.");
  const { error } = await supabaseServidor()
    .from("fichas")
    .update({ eliminado_en: null })
    .eq("id", fichaId)
    .eq("coleccion_id", coleccion.id);
  if (error) throw new Error(`No se pudo restaurar la ficha: ${error.message}`);
  refresh();
}
