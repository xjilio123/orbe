import { notFound } from "next/navigation";
import { BarraPestanas } from "@/components/BarraPestanas";
import { vitrinaActiva } from "@/lib/vitrina";

export const metadata = { title: "Vitrina · Orbe", robots: { index: false, follow: false } };

// Misma estructura que (app)/layout.tsx, con las pestañas apuntando a la vitrina.
export default function LayoutVitrina({ children }: LayoutProps<"/vitrina">) {
  if (!vitrinaActiva()) notFound();
  return (
    <>
      {children}
      <BarraPestanas prefijo="/vitrina" />
    </>
  );
}
