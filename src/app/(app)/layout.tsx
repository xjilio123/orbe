import { buscar } from "@/app/acciones/buscar";
import { BarraPestanas } from "@/components/BarraPestanas";
import { AbrirBarra } from "@/components/buscar/AbrirBarra";

export default function LayoutApp({ children }: LayoutProps<"/">) {
  return (
    <>
      {children}
      <BarraPestanas />
      <AbrirBarra buscar={buscar} base="" />
    </>
  );
}
