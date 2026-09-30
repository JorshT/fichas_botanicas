"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { crearFicha, editarFicha } from "@/lib/acciones";
import { formatearCoordenadas, urlMapa } from "@/lib/formato";
import { hoyIso, leerExif } from "@/lib/imagenes";
import { TIPOS_FOTO, type FichaVista, type TipoFoto } from "@/lib/tipos";
import { AutocompletarEspecie } from "./AutocompletarEspecie";
import { SubidorFoto, type CambioFoto } from "./SubidorFoto";

const CLAVE_AUTOR = "fichas:autor";

type Coordenadas = { lat: number; lng: number } | null;

export function FormularioFicha({ token, ficha }: { token: string; ficha?: FichaVista }) {
  const router = useRouter();
  const [enviando, iniciarEnvio] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [procesandoFotos, setProcesandoFotos] = useState(0);
  const [coords, setCoords] = useState<Coordenadas>(
    ficha?.lat != null && ficha?.lng != null ? { lat: ficha.lat, lng: ficha.lng } : null,
  );
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  const [numeroSemilla, setNumeroSemilla] = useState(ficha?.numeroSemilla ?? "");
  const [comentario, setComentario] = useState(ficha?.comentario ?? "");
  const cambios = useRef<Record<TipoFoto, CambioFoto>>({
    planta: { accion: "sin-cambios" },
    flor: { accion: "sin-cambios" },
    fruto: { accion: "sin-cambios" },
  });
  const campoFecha = useRef<HTMLInputElement>(null);
  const campoAutor = useRef<HTMLInputElement>(null);

  // Valores que dependen del navegador (fecha local, nombre recordado): se
  // completan al montar para no descuadrar el HTML generado en el servidor.
  useEffect(() => {
    if (campoFecha.current && !campoFecha.current.value) campoFecha.current.value = hoyIso();
    if (campoAutor.current && !campoAutor.current.value) {
      try {
        campoAutor.current.value = localStorage.getItem(CLAVE_AUTOR) ?? "";
      } catch {
        // localStorage no disponible (modo privado): no pasa nada.
      }
    }
  }, []);

  // Si la foto de la planta trae fecha/GPS en sus metadatos, se usan para
  // autocompletar (solo al crear, y sin pisar coordenadas ya puestas).
  async function alElegirOriginalPlanta(archivo: File) {
    if (ficha) return;
    const exif = await leerExif(archivo);
    if (exif.fecha && campoFecha.current) campoFecha.current.value = exif.fecha;
    if (exif.lat !== null && exif.lng !== null) {
      setCoords((actual) => actual ?? { lat: exif.lat!, lng: exif.lng! });
    }
  }

  function usarMiUbicacion() {
    if (!navigator.geolocation) {
      setError("Este navegador no permite obtener la ubicación.");
      return;
    }
    setBuscandoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setBuscandoUbicacion(false);
      },
      () => {
        setError("No se pudo obtener la ubicación. Revisa los permisos del navegador.");
        setBuscandoUbicacion(false);
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  function alEnviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const tieneFotoPlanta = Boolean(ficha?.fotos.planta) || cambios.current.planta.accion === "nueva";
    if (!tieneFotoPlanta) {
      setError("La foto de la planta completa es obligatoria.");
      return;
    }

    const datos = new FormData(e.currentTarget);
    datos.set("lat", coords ? String(coords.lat) : "");
    datos.set("lng", coords ? String(coords.lng) : "");
    for (const tipo of TIPOS_FOTO) {
      const cambio = cambios.current[tipo];
      if (cambio.accion === "nueva") {
        datos.set(`foto_${tipo}`, cambio.foto.completa);
        datos.set(`foto_${tipo}_min`, cambio.foto.miniatura);
      } else if (cambio.accion === "quitar") {
        datos.set(`quitar_${tipo}`, "1");
      }
    }
    try {
      localStorage.setItem(CLAVE_AUTOR, String(datos.get("autor") ?? "").trim());
    } catch {}

    iniciarEnvio(async () => {
      try {
        const r = ficha ? await editarFicha(token, ficha.id, datos) : await crearFicha(token, datos);
        if (!r.ok) {
          setError(r.error);
          return;
        }
        router.push(`/c/${token}/f/${r.id}`);
      } catch {
        setError("No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.");
      }
    });
  }

  const ocupado = enviando || procesandoFotos > 0;
  // Si se anotó una semilla, se sugiere indicar el sobre donde quedó guardada
  // (hasta que el comentario lo mencione).
  const sugerirSobre = numeroSemilla.trim() !== "" && !/sobre/i.test(comentario);
  const volver = ficha ? `/c/${token}/f/${ficha.id}` : `/c/${token}`;

  return (
    <form onSubmit={alEnviar} className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">{ficha ? "Editar ficha" : "Nueva ficha"}</h1>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="nombre_cientifico" className="mb-1 block text-sm font-medium">
            Nombre científico (especie) <span className="text-peligro">*</span>
          </label>
          <AutocompletarEspecie valorInicial={ficha?.nombreCientifico} />
        </div>

        <div>
          <label htmlFor="nombre_comun" className="mb-1 block text-sm font-medium">
            Nombre común
          </label>
          <input
            id="nombre_comun"
            name="nombre_comun"
            maxLength={200}
            placeholder="Ej: Pimiento, molle"
            defaultValue={ficha?.nombreComun ?? ""}
            className="campo"
          />
        </div>

        <div>
          <label htmlFor="fecha_recoleccion" className="mb-1 block text-sm font-medium">
            Fecha de recolección <span className="text-peligro">*</span>
          </label>
          <input
            ref={campoFecha}
            id="fecha_recoleccion"
            name="fecha_recoleccion"
            type="date"
            required
            defaultValue={ficha?.fechaRecoleccion ?? ""}
            className="campo"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="lugar_texto" className="mb-1 block text-sm font-medium">
            Lugar de recolección <span className="text-peligro">*</span>
          </label>
          <input
            id="lugar_texto"
            name="lugar_texto"
            required
            maxLength={300}
            placeholder="Ej: Cerro San Cristóbal, sendero norte"
            defaultValue={ficha?.lugarTexto ?? ""}
            className="campo"
          />
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <button type="button" className="boton" onClick={usarMiUbicacion} disabled={buscandoUbicacion}>
              📍 {buscandoUbicacion ? "Buscando…" : "Usar mi ubicación"}
            </button>
            {coords ? (
              <>
                <a href={urlMapa(coords.lat, coords.lng)} target="_blank" rel="noreferrer" className="text-marca underline">
                  {formatearCoordenadas(coords.lat, coords.lng)}
                </a>
                <button type="button" className="text-texto-suave underline" onClick={() => setCoords(null)}>
                  quitar coordenadas
                </button>
              </>
            ) : (
              <span className="text-texto-suave">Coordenadas opcionales.</span>
            )}
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium">Fotos</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {TIPOS_FOTO.map((tipo) => (
            <SubidorFoto
              key={tipo}
              tipo={tipo}
              obligatorio={tipo === "planta"}
              urlExistente={ficha?.fotos[tipo]?.urlMiniatura}
              onCambio={(c) => {
                cambios.current[tipo] = c;
              }}
              onOriginal={tipo === "planta" ? alElegirOriginalPlanta : undefined}
              onProcesando={(p) => setProcesandoFotos((n) => n + (p ? 1 : -1))}
            />
          ))}
        </div>
        <p className="mt-2 text-xs text-texto-suave">
          Las fotos se reducen en tu dispositivo antes de subirlas (máx. 1600 px).
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="numero_semilla" className="mb-1 block text-sm font-medium">
            Número de semilla <span className="font-normal text-texto-suave">(opcional)</span>
          </label>
          <input
            id="numero_semilla"
            name="numero_semilla"
            maxLength={50}
            placeholder="Ej: Dejar en el sobre 12"
            value={numeroSemilla}
            onChange={(e) => setNumeroSemilla(e.target.value)}
            className="campo"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="comentario" className="mb-1 block text-sm font-medium">
            Comentario <span className="font-normal text-texto-suave">(opcional)</span>
          </label>
          <textarea
            id="comentario"
            name="comentario"
            rows={3}
            maxLength={1000}
            placeholder={numeroSemilla.trim() ? "Ej: Semilla guardada en el sobre 12" : "Opcional"}
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            aria-describedby={sugerirSobre ? "sugerencia_sobre" : undefined}
            className="campo"
          />
          {sugerirSobre && (
            <p id="sugerencia_sobre" className="mt-1 text-sm text-marca">
              💡 Anotaste un número de semilla: te sugerimos escribir aquí el número o nombre del sobre donde
              dejaste la semilla.
            </p>
          )}
        </div>
      </section>

      <div className="max-w-xs">
        <label htmlFor="autor" className="mb-1 block text-sm font-medium">
          Tu nombre
        </label>
        <input
          ref={campoAutor}
          id="autor"
          name="autor"
          maxLength={80}
          placeholder="Para saber quién la registró"
          defaultValue={ficha?.autor ?? ""}
          className="campo"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-peligro p-3 text-sm text-peligro">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button type="submit" className="boton boton-principal" disabled={ocupado}>
          {enviando ? "Guardando…" : procesandoFotos > 0 ? "Procesando fotos…" : "Guardar ficha"}
        </button>
        <Link href={volver} className="boton">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
