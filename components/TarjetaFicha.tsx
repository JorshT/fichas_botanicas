import Link from "next/link";
import { formatearFecha } from "@/lib/formato";
import type { FichaVista } from "@/lib/tipos";

export function TarjetaFicha({ ficha, href, children }: { ficha: FichaVista; href?: string; children?: React.ReactNode }) {
  const foto = ficha.fotos.planta;
  const contenido = (
    <>
      <div className="aspect-[4/3] bg-marca-suave">
        {foto ? (
          // Las URLs firmadas de Supabase cambian en cada carga; <img> simple evita el optimizador de Next.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto.urlMiniatura} alt={ficha.nombreCientifico} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl" aria-hidden>
            🌱
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="truncate font-semibold italic">{ficha.nombreCientifico}</p>
        <p className="truncate text-sm text-texto-suave">{ficha.nombreComun ?? " "}</p>
        <p className="mt-2 truncate text-xs text-texto-suave">
          {formatearFecha(ficha.fechaRecoleccion)} · {ficha.lugarTexto}
        </p>
      </div>
    </>
  );

  return (
    <article className="overflow-hidden rounded-xl border border-borde bg-superficie transition hover:border-marca">
      {href ? <Link href={href}>{contenido}</Link> : contenido}
      {children}
    </article>
  );
}
