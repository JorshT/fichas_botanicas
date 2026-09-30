// "2026-09-29" → "29 sept 2026". Se interpreta en UTC para que no cambie el día
// según la zona horaria del servidor o del navegador.
export function formatearFecha(fechaIso: string): string {
  const fecha = new Date(`${fechaIso.slice(0, 10)}T00:00:00Z`);
  return new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    fecha,
  );
}

export function urlMapa(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

export function formatearCoordenadas(lat: number, lng: number): string {
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
