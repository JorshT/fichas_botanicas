import Link from "next/link";
import { accesoOr404 } from "@/lib/acceso";
import { FICHAS_POR_PAGINA, listarFichas } from "@/lib/datos";
import { TarjetaFicha } from "@/components/TarjetaFicha";

export default async function Galeria({ params, searchParams }: PageProps<"/c/[token]">) {
  const { token } = await params;
  const { q, p } = await searchParams;
  const { coleccion, permiso } = await accesoOr404(token);

  const busqueda = typeof q === "string" ? q : "";
  const pagina = Math.max(1, Number.parseInt(typeof p === "string" ? p : "1", 10) || 1);
  const { fichas, total } = await listarFichas(coleccion.id, { busqueda, pagina });
  const totalPaginas = Math.max(1, Math.ceil(total / FICHAS_POR_PAGINA));

  const base = `/c/${token}`;
  const enlacePagina = (n: number) => {
    const qs = new URLSearchParams();
    if (busqueda) qs.set("q", busqueda);
    if (n > 1) qs.set("p", String(n));
    const s = qs.toString();
    return s ? `${base}?${s}` : base;
  };

  return (
    <>
      <form action={base} className="mb-6 flex gap-2" role="search">
        <input
          type="search"
          name="q"
          defaultValue={busqueda}
          placeholder="Buscar por nombre científico, común o lugar…"
          className="campo"
        />
        <button type="submit" className="boton">
          Buscar
        </button>
      </form>

      <p className="mb-4 text-sm text-texto-suave">
        {total === 1 ? "1 ficha" : `${total} fichas`}
        {busqueda && (
          <>
            {" "}
            para «{busqueda}» ·{" "}
            <Link href={base} className="underline">
              ver todas
            </Link>
          </>
        )}
      </p>

      {fichas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-borde p-10 text-center text-texto-suave">
          {busqueda ? (
            "No hay fichas que coincidan con la búsqueda."
          ) : permiso === "editar" ? (
            <>
              Todavía no hay fichas.{" "}
              <Link href={`${base}/nueva`} className="font-medium text-marca underline">
                Crea la primera
              </Link>
              .
            </>
          ) : (
            "Todavía no hay fichas."
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {fichas.map((f) => (
            <TarjetaFicha key={f.id} ficha={f} href={`${base}/f/${f.id}`} />
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3 text-sm" aria-label="Paginación">
          {pagina > 1 && (
            <Link href={enlacePagina(pagina - 1)} className="boton">
              ← Anterior
            </Link>
          )}
          <span className="text-texto-suave">
            Página {pagina} de {totalPaginas}
          </span>
          {pagina < totalPaginas && (
            <Link href={enlacePagina(pagina + 1)} className="boton">
              Siguiente →
            </Link>
          )}
        </nav>
      )}
    </>
  );
}
