import Link from "next/link";
import { notFound } from "next/navigation";
import { accesoOr404 } from "@/lib/acceso";
import { enviarAPapelera, restaurarFicha } from "@/lib/acciones";
import { obtenerFicha } from "@/lib/datos";
import { esUuid } from "@/lib/validacion";
import { BotonAccion } from "@/components/BotonAccion";
import { BotonImprimir } from "@/components/BotonImprimir";
import { FichaTecnica } from "@/components/FichaTecnica";

export default async function PaginaFicha({ params }: PageProps<"/c/[token]/f/[id]">) {
  const { token, id } = await params;
  const { coleccion, permiso } = await accesoOr404(token);
  if (!esUuid(id)) notFound();
  const ficha = await obtenerFicha(coleccion.id, id);
  if (!ficha) notFound();

  const puedeEditar = permiso === "editar";
  const enPapelera = ficha.eliminadoEn !== null;
  if (enPapelera && !puedeEditar) notFound();

  const base = `/c/${token}`;

  return (
    <>
      <div className="no-imprimir mb-4 flex flex-wrap items-center gap-2">
        <Link href={enPapelera ? `${base}/papelera` : base} className="boton mr-auto">
          ← Volver
        </Link>
        <BotonImprimir />
        {puedeEditar && !enPapelera && (
          <>
            <Link href={`${base}/f/${id}/editar`} className="boton">
              Editar
            </Link>
            <BotonAccion
              accion={enviarAPapelera.bind(null, token, id)}
              texto="Borrar"
              confirmar="¿Enviar esta ficha a la papelera? Se podrá restaurar durante 30 días."
              className="boton text-peligro"
            />
          </>
        )}
        {puedeEditar && enPapelera && (
          <BotonAccion accion={restaurarFicha.bind(null, token, id)} texto="Restaurar" className="boton boton-principal" />
        )}
      </div>

      {enPapelera && (
        <p className="no-imprimir mb-4 rounded-lg bg-marca-suave p-3 text-sm">
          Esta ficha está en la papelera y se borrará definitivamente 30 días después de haber sido eliminada.
        </p>
      )}

      <FichaTecnica ficha={ficha} />
    </>
  );
}
