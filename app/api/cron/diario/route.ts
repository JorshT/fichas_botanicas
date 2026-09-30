import { BUCKET_FOTOS, supabaseServidor } from "@/lib/supabase-servidor";

const DIAS_EN_PAPELERA = 30;

// Vercel Cron llama a esta ruta una vez al día con el encabezado
// "Authorization: Bearer <CRON_SECRET>". Sirve para dos cosas:
//  1) mantener activo el proyecto gratuito de Supabase (se pausa tras 7 días sin uso);
//  2) borrar definitivamente las fichas con más de 30 días en la papelera.
export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return new Response("No autorizado", { status: 401 });
  }

  const supabase = supabaseServidor();
  const limite = new Date(Date.now() - DIAS_EN_PAPELERA * 24 * 60 * 60 * 1000).toISOString();

  const { data: vencidas, error } = await supabase
    .from("fichas")
    .select("id, fotos(ruta, ruta_miniatura)")
    .lt("eliminado_en", limite)
    .limit(200);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  const rutas = (vencidas ?? []).flatMap((f) => f.fotos.flatMap((foto) => [foto.ruta, foto.ruta_miniatura]));
  if (rutas.length > 0) {
    const { error: errorFotos } = await supabase.storage.from(BUCKET_FOTOS).remove(rutas);
    if (errorFotos) return Response.json({ ok: false, error: errorFotos.message }, { status: 500 });
  }

  const ids = (vencidas ?? []).map((f) => f.id);
  if (ids.length > 0) {
    const { error: errorBorrar } = await supabase.from("fichas").delete().in("id", ids);
    if (errorBorrar) return Response.json({ ok: false, error: errorBorrar.message }, { status: 500 });
  }

  return Response.json({ ok: true, fichasPurgadas: ids.length });
}
