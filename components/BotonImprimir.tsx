"use client";

export function BotonImprimir() {
  return (
    <button type="button" onClick={() => window.print()} className="boton">
      Imprimir / PDF
    </button>
  );
}
