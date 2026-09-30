// Uso: npm run crear-coleccion -- "Nombre de la colección"
import { generarToken, hashToken } from "../lib/tokens";
import { linkColeccion, supabaseAdmin } from "./_comun";

async function main() {
  const nombre = process.argv.slice(2).join(" ").trim();
  if (!nombre) {
    console.error('Uso: npm run crear-coleccion -- "Nombre de la colección"');
    process.exit(1);
  }

  const tokenEdicion = generarToken();
  const tokenLectura = generarToken();
  const { data, error } = await supabaseAdmin()
    .from("colecciones")
    .insert({
      nombre,
      token_edicion_hash: hashToken(tokenEdicion),
      token_lectura_hash: hashToken(tokenLectura),
    })
    .select("id")
    .single();
  if (error) {
    console.error("No se pudo crear la colección:", error.message);
    process.exit(1);
  }

  console.log(`\nColección creada: "${nombre}" (id: ${data.id})\n`);
  console.log(`Link de EDICIÓN (para quienes suben fichas):\n  ${linkColeccion(tokenEdicion)}\n`);
  console.log(`Link de SOLO LECTURA (para quienes solo miran):\n  ${linkColeccion(tokenLectura)}\n`);
  console.log("Guarda estos links: no se pueden recuperar, solo regenerar con rotar-links.\n");
}

main();
