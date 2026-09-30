import { notFound } from "next/navigation";
import { accesoEdicionOr404 } from "@/lib/acceso";
import { obtenerFicha } from "@/lib/datos";
import { esUuid } from "@/lib/validacion";
import { FormularioFicha } from "@/components/FormularioFicha";

export default async function EditarFicha({ params }: PageProps<"/c/[token]/f/[id]/editar">) {
  const { token, id } = await params;
  const { coleccion } = await accesoEdicionOr404(token);
  if (!esUuid(id)) notFound();
  const ficha = await obtenerFicha(coleccion.id, id);
  if (!ficha || ficha.eliminadoEn) notFound();
  return <FormularioFicha token={token} ficha={ficha} />;
}
