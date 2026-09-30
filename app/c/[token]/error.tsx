"use client";

import { useEffect } from "react";

export default function ErrorColeccion({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <h2 className="text-xl font-semibold">Algo salió mal</h2>
      <p className="mt-2 text-texto-suave">
        No se pudo cargar esta página. Revisa tu conexión e inténtalo de nuevo.
      </p>
      <button type="button" onClick={() => retry()} className="boton boton-principal mt-6">
        Reintentar
      </button>
    </div>
  );
}
