import type { MetadataRoute } from "next";
import { obtenerAcceso } from "@/lib/acceso";

// Manifest por colección: al instalar la app desde el link de una colección,
// el ícono abre directo esa colección (con el mismo permiso del link), y cada
// colección se instala como una app distinta.
export async function GET(_request: Request, { params }: RouteContext<"/c/[token]/manifest.webmanifest">) {
  const { token } = await params;
  const acceso = await obtenerAcceso(token);
  if (!acceso) return new Response("Not found", { status: 404 });

  const base = `/c/${token}`;
  const manifest: MetadataRoute.Manifest = {
    id: base,
    name: `${acceso.coleccion.nombre} · Fichas de plantas`,
    short_name: acceso.coleccion.nombre,
    description: "Registro compartido de fichas técnicas de plantas.",
    lang: "es",
    start_url: base,
    scope: base,
    display: "standalone",
    background_color: "#f6f5ef",
    theme_color: "#2f6b3a",
    icons: [
      { src: "/icono-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icono-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icono-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icono.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "private, no-cache",
    },
  });
}
