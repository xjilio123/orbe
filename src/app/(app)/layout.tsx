import { buscar } from "@/app/acciones/buscar";
import { capturarTarea } from "@/app/acciones/tareas";
import { BarraPestanas } from "@/components/BarraPestanas";
import { AbrirBarra } from "@/components/buscar/AbrirBarra";
import { ModoSinConexion } from "@/components/pwa/ModoSinConexion";

export default function LayoutApp({ children }: LayoutProps<"/">) {
  return (
    <>
      {children}
      <BarraPestanas />
      <AbrirBarra buscar={buscar} base="" />
      <ModoSinConexion base="" capturar={capturarTarea} />
    </>
  );
}
