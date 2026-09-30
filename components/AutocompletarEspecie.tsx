"use client";

import { useEffect, useRef, useState } from "react";

type Sugerencia = { nombre: string; autor: string; familia: string | null; sinonimo: boolean };

type RespuestaGbif = {
  canonicalName?: string;
  scientificName: string;
  family?: string;
  synonym?: boolean;
}[];

const REINO_PLANTAE = 6;

// Autocompletado del nombre científico con la API pública de GBIF (sin clave).
export function AutocompletarEspecie({ valorInicial = "" }: { valorInicial?: string }) {
  const [valor, setValor] = useState(valorInicial);
  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(-1);
  const consultaAnterior = useRef(valorInicial);

  useEffect(() => {
    const q = valor.trim();
    if (q.length < 3 || q === consultaAnterior.current) return;
    const control = new AbortController();
    const espera = setTimeout(async () => {
      try {
        const url = `https://api.gbif.org/v1/species/suggest?limit=8&higherTaxonKey=${REINO_PLANTAE}&q=${encodeURIComponent(q)}`;
        const r = await fetch(url, { signal: control.signal });
        if (!r.ok) return;
        const datos = (await r.json()) as RespuestaGbif;
        const vistos = new Set<string>();
        const lista: Sugerencia[] = [];
        for (const d of datos) {
          const nombre = d.canonicalName ?? d.scientificName;
          if (vistos.has(nombre)) continue;
          vistos.add(nombre);
          lista.push({
            nombre,
            autor: d.scientificName.slice(nombre.length).trim(),
            familia: d.family ?? null,
            sinonimo: Boolean(d.synonym),
          });
        }
        setSugerencias(lista);
        setActiva(-1);
        setAbierto(lista.length > 0);
      } catch {
        // Sin conexión o GBIF caído: se puede escribir el nombre a mano.
      }
    }, 300);
    return () => {
      clearTimeout(espera);
      control.abort();
    };
  }, [valor]);

  function elegir(s: Sugerencia) {
    consultaAnterior.current = s.nombre;
    setValor(s.nombre);
    setAbierto(false);
  }

  function alTeclear(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!abierto) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiva((i) => Math.min(i + 1, sugerencias.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiva((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activa >= 0) {
      e.preventDefault();
      elegir(sugerencias[activa]);
    } else if (e.key === "Escape") {
      setAbierto(false);
    }
  }

  return (
    <div className="relative">
      <input
        id="nombre_cientifico"
        name="nombre_cientifico"
        required
        maxLength={200}
        autoComplete="off"
        placeholder="Ej: Schinus molle"
        className="campo italic"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onKeyDown={alTeclear}
        onFocus={() => sugerencias.length > 0 && setAbierto(true)}
        onBlur={() => setTimeout(() => setAbierto(false), 150)}
        role="combobox"
        aria-expanded={abierto}
        aria-controls="sugerencias-especie"
      />
      {abierto && (
        <ul
          id="sugerencias-especie"
          role="listbox"
          className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-borde bg-superficie shadow-lg"
        >
          {sugerencias.map((s, i) => (
            <li key={s.nombre} role="option" aria-selected={i === activa}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => elegir(s)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-marca-suave ${i === activa ? "bg-marca-suave" : ""}`}
              >
                <span className="italic">{s.nombre}</span> <span className="text-texto-suave">{s.autor}</span>
                <span className="block text-xs text-texto-suave">
                  {s.familia}
                  {s.sinonimo && " · sinónimo"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-1 text-xs text-texto-suave">Sugerencias de GBIF (Global Biodiversity Information Facility).</p>
    </div>
  );
}
