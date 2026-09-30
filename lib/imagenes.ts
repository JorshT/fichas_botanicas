// Procesamiento de fotos en el navegador (solo se importa desde componentes cliente).
import imageCompression from "browser-image-compression";
import exifr from "exifr";

export type FotoPreparada = { completa: File; miniatura: File; vistaPrevia: string };

// JPEG porque todos los navegadores (incluido Safari en iPhone) lo generan bien.
export async function prepararFoto(original: File): Promise<FotoPreparada> {
  const completa = await imageCompression(original, {
    maxSizeMB: 0.8,
    maxWidthOrHeight: 1600,
    fileType: "image/jpeg",
    initialQuality: 0.82,
    useWebWorker: true,
  });
  const miniatura = await imageCompression(original, {
    maxSizeMB: 0.1,
    maxWidthOrHeight: 480,
    fileType: "image/jpeg",
    initialQuality: 0.75,
    useWebWorker: true,
  });
  return {
    completa: new File([completa], "foto.jpg", { type: "image/jpeg" }),
    miniatura: new File([miniatura], "miniatura.jpg", { type: "image/jpeg" }),
    vistaPrevia: URL.createObjectURL(miniatura),
  };
}

export type DatosExif = { fecha: string | null; lat: number | null; lng: number | null };

function aFechaIso(d: Date): string {
  const dd = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${dd(d.getMonth() + 1)}-${dd(d.getDate())}`;
}

// Lee fecha y GPS de la foto original (la compresión borra estos datos).
// Muchos celulares quitan el GPS al subir desde el navegador: por eso es opcional.
export async function leerExif(original: File): Promise<DatosExif> {
  try {
    const [datos, gps] = await Promise.all([
      exifr.parse(original, ["DateTimeOriginal", "CreateDate"]).catch(() => null),
      exifr.gps(original).catch(() => null),
    ]);
    const fecha: unknown = datos?.DateTimeOriginal ?? datos?.CreateDate;
    const hayGps = Number.isFinite(gps?.latitude) && Number.isFinite(gps?.longitude);
    return {
      fecha: fecha instanceof Date && !Number.isNaN(fecha.getTime()) ? aFechaIso(fecha) : null,
      lat: hayGps ? gps!.latitude : null,
      lng: hayGps ? gps!.longitude : null,
    };
  } catch {
    return { fecha: null, lat: null, lng: null };
  }
}

export function hoyIso(): string {
  return aFechaIso(new Date());
}
