import { accesoEdicionOr404 } from "@/lib/acceso";
import { FormularioFicha } from "@/components/FormularioFicha";

export default async function NuevaFicha({ params }: PageProps<"/c/[token]/nueva">) {
  const { token } = await params;
  await accesoEdicionOr404(token);
  return <FormularioFicha token={token} />;
}
