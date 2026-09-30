// Regenera los links de una colección; los anteriores dejan de funcionar.
// Uso: npm run rotar-links -- <id-coleccion> [edicion|lectura|ambos]
// Sin argumentos, lista las colecciones existentes.
import { generarToken, hashToken } from "../lib/tokens";
import { linkColeccion, supabaseAdmin } from "./_comun";

async function main() {
  const [id, cual = "ambos"] = process.argv.slice(2);
  const supabase = supabaseAdmin();

  if (!id) {
    const { data, error } = await supabase.from("colecciones").select("id, nombre, creado_en").order("creado_en");
    if (error) throw new Error(error.message);
    console.log("Uso: npm run rotar-links -- <id-coleccion> [edicion|lectura|ambos]\n\nColecciones:");
    for (const c of data) console.log(`  ${c.id}  ${c.nombre}`);
    return;
  }
  if (!["edicion", "lectura", "ambos"].includes(cual)) {
    console.error('El segundo argumento debe ser "edicion", "lectura" o "ambos".');
    process.exit(1);
  }

  const cambios: Record<string, string> = {};
  const nuevos: [string, string][] = [];
  if (cual !== "lectura") {
    const t = generarToken();
    cambios.token_edicion_hash = hashToken(t);
    nuevos.push(["EDICIÓN", t]);
  }
  if (cual !== "edicion") {
    const t = generarToken();
    cambios.token_lectura_hash = hashToken(t);
    nuevos.push(["SOLO LECTURA", t]);
  }

  const { data, error } = await supabase.from("colecciones").update(cambios).eq("id", id).select("nombre").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) {
    console.error("No existe una colección con ese id.");
    process.exit(1);
  }

  console.log(`\nLinks regenerados para "${data.nombre}". Los anteriores ya no funcionan.\n`);
  for (const [etiqueta, t] of nuevos) console.log(`Link de ${etiqueta}:\n  ${linkColeccion(t)}\n`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
