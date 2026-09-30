import { formatearCoordenadas, formatearFecha, urlMapa } from "@/lib/formato";
import { NOMBRE_TIPO_FOTO, type FichaVista, type TipoFoto } from "@/lib/tipos";

function Casilla({ etiqueta, children, className = "" }: { etiqueta: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-borde bg-superficie p-3 break-inside-avoid ${className}`}>
      <p className="text-[0.7rem] font-semibold tracking-wide text-texto-suave uppercase">{etiqueta}</p>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function Foto({ ficha, tipo, alto }: { ficha: FichaVista; tipo: TipoFoto; alto: string }) {
  const foto = ficha.fotos[tipo];
  return (
    <Casilla etiqueta={`Imagen ${NOMBRE_TIPO_FOTO[tipo].toLowerCase()}`}>
      {foto ? (
        <a href={foto.url} target="_blank" rel="noreferrer" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={foto.url}
            alt={`${NOMBRE_TIPO_FOTO[tipo]} de ${ficha.nombreCientifico}`}
            className={`w-full rounded-md object-contain bg-marca-suave print:bg-transparent ${alto}`}
          />
        </a>
      ) : (
        <div className={`flex items-center justify-center rounded-md border border-dashed border-borde text-sm text-texto-suave ${alto}`}>
          Sin foto
        </div>
      )}
    </Casilla>
  );
}

// Vista de la ficha inspirada en la plantilla "Ficha técnica de planta".
export function FichaTecnica({ ficha }: { ficha: FichaVista }) {
  return (
    <article className="mx-auto max-w-3xl space-y-3 print:max-w-none print:text-sm">
      <h1 className="rounded-lg border border-borde bg-superficie py-3 text-center text-xl font-bold tracking-wide uppercase sm:text-2xl">
        Ficha técnica de planta
      </h1>

      <div className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">
        <Casilla etiqueta="Nombre científico">
          <p className="text-lg font-semibold italic">{ficha.nombreCientifico}</p>
        </Casilla>
        <Casilla etiqueta="Nombre común">
          <p className="text-lg">{ficha.nombreComun ?? "—"}</p>
        </Casilla>
        <Casilla etiqueta="Fecha de recolección">
          <p>{formatearFecha(ficha.fechaRecoleccion)}</p>
        </Casilla>
        <Casilla etiqueta="Lugar de recolección">
          <p>{ficha.lugarTexto}</p>
          {ficha.lat !== null && ficha.lng !== null && (
            <a
              href={urlMapa(ficha.lat, ficha.lng)}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-marca underline"
            >
              📍 {formatearCoordenadas(ficha.lat, ficha.lng)}
            </a>
          )}
        </Casilla>
      </div>

      <Foto ficha={ficha} tipo="planta" alto="max-h-[32rem] print:max-h-[11cm]" />

      <div className="grid gap-3 sm:grid-cols-2 print:grid-cols-2">
        <Foto ficha={ficha} tipo="flor" alto="h-64 print:h-[6.5cm]" />
        <Foto ficha={ficha} tipo="fruto" alto="h-64 print:h-[6.5cm]" />
      </div>

      {(ficha.numeroSemilla || ficha.comentario) && (
        <div className="grid gap-3 sm:grid-cols-3 print:grid-cols-3">
          {ficha.numeroSemilla && (
            <Casilla etiqueta="Número de semilla">
              <p className="text-lg">{ficha.numeroSemilla}</p>
            </Casilla>
          )}
          {ficha.comentario && (
            <Casilla etiqueta="Comentario" className={ficha.numeroSemilla ? "sm:col-span-2 print:col-span-2" : "sm:col-span-3 print:col-span-3"}>
              <p className="whitespace-pre-line">{ficha.comentario}</p>
            </Casilla>
          )}
        </div>
      )}

      <p className="text-right text-xs text-texto-suave">
        {ficha.autor ? `Registrada por ${ficha.autor} · ` : ""}
        Última edición: {formatearFecha(ficha.actualizadoEn)}
      </p>
    </article>
  );
}
