import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const BUCKET_FOTOS = "fotos";

let cliente: SupabaseClient | null = null;

// Cliente con la clave secreta (service_role / sb_secret_...). Salta RLS, por eso
// solo existe en el servidor y cada uso debe ir precedido de validarAcceso().
export function supabaseServidor(): SupabaseClient {
  if (cliente) return cliente;
  const url = process.env.SUPABASE_URL;
  const clave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !clave) {
    throw new Error(
      "Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en las variables de entorno.",
    );
  }
  cliente = createClient(url, clave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cliente;
}
