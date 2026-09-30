import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { supabaseServidor } from "./supabase-servidor";
import { hashToken, tokenConFormatoValido } from "./tokens";

export type Permiso = "editar" | "leer";

export type Acceso = {
  coleccion: { id: string; nombre: string };
  permiso: Permiso;
};

// Busca la colección a la que pertenece el token del link. Se memoriza por
// petición para que layout y página no consulten la BD dos veces.
export const obtenerAcceso = cache(async (token: string): Promise<Acceso | null> => {
  if (!tokenConFormatoValido(token)) return null;
  const hash = hashToken(token);
  const { data, error } = await supabaseServidor()
    .from("colecciones")
    .select("id, nombre, token_edicion_hash")
    .or(`token_edicion_hash.eq.${hash},token_lectura_hash.eq.${hash}`)
    .maybeSingle();
  if (error) throw new Error(`Error al validar el link: ${error.message}`);
  if (!data) return null;
  return {
    coleccion: { id: data.id, nombre: data.nombre },
    permiso: data.token_edicion_hash === hash ? "editar" : "leer",
  };
});

// Para páginas: un link inválido responde 404, sin dar pistas.
export async function accesoOr404(token: string): Promise<Acceso> {
  const acceso = await obtenerAcceso(token);
  if (!acceso) notFound();
  return acceso;
}

// Para páginas de edición abiertas con el link de solo lectura.
export async function accesoEdicionOr404(token: string): Promise<Acceso> {
  const acceso = await accesoOr404(token);
  if (acceso.permiso !== "editar") notFound();
  return acceso;
}

// Para Server Actions: se pueden llamar con un POST directo, así que se
// valida el permiso en cada una.
export async function exigirEdicion(token: unknown): Promise<Acceso> {
  const acceso = typeof token === "string" ? await obtenerAcceso(token) : null;
  if (!acceso || acceso.permiso !== "editar") {
    throw new Error("Link inválido o sin permiso de edición.");
  }
  return acceso;
}
