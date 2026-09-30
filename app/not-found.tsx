export default function NoEncontrado() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">Página no encontrada</h1>
        <p className="mt-3 text-texto-suave">
          El link no es válido, fue regenerado o la ficha ya no existe. Pide el link actualizado a
          quien administra la colección.
        </p>
      </div>
    </main>
  );
}
