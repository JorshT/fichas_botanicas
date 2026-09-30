import { z } from "zod";

// Los campos vacíos de un formulario llegan como "": se tratan como ausentes.
const textoOpcional = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(max).nullable(),
  );

const numeroOpcional = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === null || v === undefined || (typeof v === "string" && v.trim() === "") ? null : Number(v)),
    z
      .number({ error: "Las coordenadas no son válidas." })
      .min(min, "Las coordenadas no son válidas.")
      .max(max, "Las coordenadas no son válidas.")
      .nullable(),
  );

export const esquemaFicha = z
  .object({
    nombre_cientifico: z
      .string({ error: "El nombre científico es obligatorio." })
      .trim()
      .min(1, "El nombre científico es obligatorio.")
      .max(200),
    nombre_comun: textoOpcional(200),
    lugar_texto: z
      .string({ error: "El lugar de recolección es obligatorio." })
      .trim()
      .min(1, "El lugar de recolección es obligatorio.")
      .max(300),
    lat: numeroOpcional(-90, 90),
    lng: numeroOpcional(-180, 180),
    fecha_recoleccion: z
      .string({ error: "La fecha es obligatoria." })
      .regex(/^\d{4}-\d{2}-\d{2}$/, "La fecha no es válida."),
    autor: textoOpcional(80),
    numero_semilla: textoOpcional(50),
    comentario: textoOpcional(1000),
  })
  .refine((d) => (d.lat === null) === (d.lng === null), {
    message: "Las coordenadas deben tener latitud y longitud.",
  });

export type DatosFicha = z.infer<typeof esquemaFicha>;

export function leerFicha(formData: FormData) {
  return esquemaFicha.safeParse({
    nombre_cientifico: formData.get("nombre_cientifico"),
    nombre_comun: formData.get("nombre_comun"),
    lugar_texto: formData.get("lugar_texto"),
    lat: formData.get("lat"),
    lng: formData.get("lng"),
    fecha_recoleccion: formData.get("fecha_recoleccion"),
    autor: formData.get("autor"),
    numero_semilla: formData.get("numero_semilla"),
    comentario: formData.get("comentario"),
  });
}

export const esUuid = (v: unknown): v is string =>
  typeof v === "string" && z.uuid().safeParse(v).success;
