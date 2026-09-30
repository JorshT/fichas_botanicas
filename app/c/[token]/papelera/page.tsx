import Link from "next/link";
import { accesoEdicionOr404 } from "@/lib/acceso";
import { restaurarFicha } from "@/lib/acciones";
import { listarFichas } from "@/lib/datos";
import { formatearFecha } from "@/lib/formato";
import { BotonAccion } from "@/components/BotonAccion";
import { TarjetaFicha } from "@/components/TarjetaFicha";

export default async function Papelera({ params }: PageProps<"/c/[token]/papelera">) {
  const { token } = await params;
  const { coleccion } = await accesoEdicionOr404(token);
  // Se muestran las 24 borradas más recientes; las demás se purgan solas.
  const { fichas, total } = await listarFichas(coleccion.id, { enPapelera: true });
  const base = `/c/${token}`;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-baseline gap-3">
        <h1 className="mr-auto text-2xl font-semibold">Papelera</h1>
        <Link href={base} className="boton">
          ← Volver a la galería
        </Link>
      </div>
      <p className="mb-4 text-sm text-texto-suave">
        Las fichas borradas se eliminan definitivamente, con sus fotos, 30 días después de enviarlas a la papelera.
        {total > fichas.length && ` Mostrando las ${fichas.length} más recientes de ${total}.`}
      </p>

      {fichas.length === 0 ? (
        <div className="rounded-xl border border-dashed border-borde p-10 text-center text-texto-suave">
          La papelera está vacía.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {fichas.map((f) => (
            <TarjetaFicha key={f.id} ficha={f} href={`${base}/f/${f.id}`}>
              <div className="flex items-center justify-between gap-2 border-t border-borde p-3">
                <span className="text-xs text-texto-suave">Borrada {formatearFecha(f.eliminadoEn!)}</span>
                <BotonAccion accion={restaurarFicha.bind(null, token, f.id)} texto="Restaurar" />
              </div>
            </TarjetaFicha>
          ))}
        </div>
      )}
    </>
  );
}
