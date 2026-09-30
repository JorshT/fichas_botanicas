"use client";

import { useFormStatus } from "react-dom";

function Boton({ texto, className }: { texto: string; className: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? "…" : texto}
    </button>
  );
}

// Formulario de un solo botón que ejecuta una Server Action, con confirmación opcional.
export function BotonAccion({
  accion,
  texto,
  confirmar,
  className = "boton",
}: {
  accion: () => Promise<void>;
  texto: string;
  confirmar?: string;
  className?: string;
}) {
  return (
    <form
      action={accion}
      onSubmit={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
    >
      <Boton texto={texto} className={className} />
    </form>
  );
}
