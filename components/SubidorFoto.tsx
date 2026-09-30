"use client";

import { useRef, useState } from "react";
import { prepararFoto, type FotoPreparada } from "@/lib/imagenes";
import { NOMBRE_TIPO_FOTO, type TipoFoto } from "@/lib/tipos";

export type CambioFoto = { accion: "nueva"; foto: FotoPreparada } | { accion: "quitar" } | { accion: "sin-cambios" };

export function SubidorFoto({
  tipo,
  obligatorio,
  urlExistente,
  onCambio,
  onOriginal,
  onProcesando,
}: {
  tipo: TipoFoto;
  obligatorio: boolean;
  urlExistente?: string;
  onCambio: (cambio: CambioFoto) => void;
  onOriginal?: (archivo: File) => void;
  onProcesando: (procesando: boolean) => void;
}) {
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(urlExistente ?? null);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const camara = useRef<HTMLInputElement>(null);
  const galeria = useRef<HTMLInputElement>(null);

  async function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const original = e.target.files?.[0];
    e.target.value = ""; // permite volver a elegir el mismo archivo
    if (!original) return;
    setError(null);
    setProcesando(true);
    onProcesando(true);
    try {
      onOriginal?.(original);
      const foto = await prepararFoto(original);
      if (vistaPrevia?.startsWith("blob:")) URL.revokeObjectURL(vistaPrevia);
      setVistaPrevia(foto.vistaPrevia);
      onCambio({ accion: "nueva", foto });
    } catch {
      setError("No se pudo procesar la imagen. Prueba con una foto JPG o PNG.");
    } finally {
      setProcesando(false);
      onProcesando(false);
    }
  }

  function quitar() {
    if (vistaPrevia?.startsWith("blob:")) URL.revokeObjectURL(vistaPrevia);
    setVistaPrevia(null);
    onCambio(urlExistente ? { accion: "quitar" } : { accion: "sin-cambios" });
  }

  return (
    <div className="rounded-xl border border-borde bg-superficie p-3">
      <p className="text-sm font-medium">
        {NOMBRE_TIPO_FOTO[tipo]}
        {obligatorio ? <span className="text-peligro"> *</span> : <span className="text-texto-suave"> (opcional)</span>}
      </p>

      <div className="mt-2 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-lg bg-marca-suave">
        {procesando ? (
          <span className="text-sm text-texto-suave">Procesando…</span>
        ) : vistaPrevia ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={vistaPrevia} alt={`Vista previa: ${NOMBRE_TIPO_FOTO[tipo]}`} className="h-full w-full object-cover" />
        ) : (
          <span className="text-3xl" aria-hidden>
            {tipo === "planta" ? "🌿" : tipo === "flor" ? "🌸" : "🍒"}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className="boton flex-1" disabled={procesando} onClick={() => camara.current?.click()}>
          📷 Cámara
        </button>
        <button type="button" className="boton flex-1" disabled={procesando} onClick={() => galeria.current?.click()}>
          🖼️ Galería
        </button>
        {vistaPrevia && !obligatorio && (
          <button type="button" className="boton text-peligro" disabled={procesando} onClick={quitar}>
            Quitar
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-peligro">{error}</p>}

      <input ref={camara} type="file" accept="image/*" capture="environment" hidden onChange={alElegir} />
      <input ref={galeria} type="file" accept="image/*" hidden onChange={alElegir} />
    </div>
  );
}
