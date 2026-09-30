import type { Metadata } from "next";
import Link from "next/link";
import { accesoOr404, obtenerAcceso } from "@/lib/acceso";

// Hace la colección instalable en el celular ("Instalar app" en Android,
// "Agregar a pantalla de inicio" en iPhone).
export async function generateMetadata({ params }: LayoutProps<"/c/[token]">): Promise<Metadata> {
  const { token } = await params;
  const acceso = await obtenerAcceso(token);
  if (!acceso) return {};
  return {
    manifest: `/c/${token}/manifest.webmanifest`,
    appleWebApp: { capable: true, title: acceso.coleccion.nombre, statusBarStyle: "default" },
  };
}

export default async function LayoutColeccion({ children, params }: LayoutProps<"/c/[token]">) {
  const { token } = await params;
  const { coleccion, permiso } = await accesoOr404(token);
  const base = `/c/${token}`;

  return (
    <>
      <header className="no-imprimir border-b border-borde bg-superficie">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link href={base} className="mr-auto flex items-center gap-2 font-semibold">
            <span aria-hidden>🌿</span>
            {coleccion.nombre}
          </Link>
          {permiso === "editar" ? (
            <nav className="flex items-center gap-2 text-sm">
              <Link href={`${base}/papelera`} className="boton">
                Papelera
              </Link>
              <Link href={`${base}/nueva`} className="boton boton-principal">
                + Nueva ficha
              </Link>
            </nav>
          ) : (
            <span className="rounded-full bg-marca-suave px-3 py-1 text-xs font-medium text-marca-oscura">
              Solo lectura
            </span>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      <footer className="pb-4 text-center text-xs text-texto-suave opacity-60 select-none">
        Creada por Victoria Nitor &amp; Jorsh
      </footer>
    </>
  );
}
