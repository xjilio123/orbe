import { notFound } from "next/navigation";
import { VistaAgenda } from "@/components/vistas/VistaAgenda";
import { VistaAjustes } from "@/components/vistas/VistaAjustes";
import { VistaApuntes } from "@/components/vistas/VistaApuntes";
import { VistaHistorial } from "@/components/vistas/VistaHistorial";
import { VistaNuevaPagina } from "@/components/vistas/VistaNuevaPagina";
import { VistaPapelera } from "@/components/vistas/VistaPapelera";
import { VistaPreguntar } from "@/components/vistas/VistaPreguntar";
import { VistaPagina } from "@/components/vistas/VistaPagina";
import { VistaHoy } from "@/components/vistas/VistaHoy";
import { VistaLista } from "@/components/vistas/VistaLista";
import { VistaTarea } from "@/components/vistas/VistaTarea";
import { VistaTareas } from "@/components/vistas/VistaTareas";
import { itemsPorDia, leerParametros, rangoDeVista } from "@/lib/agenda";
import { agruparPorFecha, compararTareas, esInbox, resumenDelDia } from "@/lib/tareas";
import { vitrinaActiva } from "@/lib/vitrina";
import { PLAN_VITRINA } from "../ejemplosIa";
import { DETALLE, EVENTOS, HOY, LISTAS, PAGINA, PAGINAS, SUBTAREAS, TAREAS, URLS_PAGINA, PAPELERA, VERSIONES, accionesAjustesVitrina, accionesApuntesVitrina, accionesIaVitrina, accionesPapeleraVitrina, accionesVitrina } from "../datos";

// Pantallas reales con datos FICTICIOS. Solo existe con ORBE_VITRINA=1 fuera de Vercel (ver lib/vitrina.ts).
// Rutas: /vitrina/hoy, /vitrina/tareas, /vitrina/tareas/<id>, /vitrina/tareas/lista/<id>[?vista=tablero], …
export default async function Pantalla({ params, searchParams }: PageProps<"/vitrina/[...ruta]">) {
  if (!vitrinaActiva()) notFound();
  const [{ ruta }, { vista, dia }] = await Promise.all([params, searchParams]);
  const camino = ruta.join("/");
  const base = "/vitrina";
  const subtareas = { [DETALLE.id]: { hechas: 1, total: 3 } };

  if (camino === "hoy") {
    return (
      <VistaHoy
        fecha="martes 27 oct"
        saludo="Buenas tardes"
        nombre="Ana"
        hoy={HOY}
        base={base}
        resumen={resumenDelDia(TAREAS, HOY, (t) => t.hecha_en?.startsWith(HOY) ?? false)}
        inbox={TAREAS.filter(esInbox).length}
        listas={LISTAS}
        acciones={accionesVitrina} ia={accionesIaVitrina}
        iaGuardado={{ plan: PLAN_VITRINA, semana: null }}
      />
    );
  }
  if (camino === "tareas") {
    return (
      <VistaTareas
        hoy={HOY}
        base={base}
        inbox={TAREAS.filter(esInbox).sort(compararTareas)}
        grupos={agruparPorFecha(TAREAS, HOY)}
        listas={LISTAS.map((l) => ({ ...l, pendientes: TAREAS.filter((t) => t.lista_id === l.id && t.estado !== "hecha").length }))}
        subtareas={subtareas}
        acciones={accionesVitrina} ia={accionesIaVitrina}
      />
    );
  }
  if (camino.startsWith("tareas/lista/")) {
    const lista = LISTAS.find((l) => l.id === ruta[2]) ?? LISTAS[1];
    return (
      <VistaLista
        lista={lista}
        tareas={TAREAS.filter((t) => t.lista_id === lista.id)}
        vista={vista === "tablero" ? "tablero" : "lista"}
        hoy={HOY}
        base={base}
        subtareas={subtareas}
        acciones={accionesVitrina} ia={accionesIaVitrina}
      />
    );
  }
  if (ruta[0] === "tareas" && ruta.length === 2) {
    const tarea = [...TAREAS, ...SUBTAREAS].find((t) => t.id === ruta[1]) ?? DETALLE;
    return (
      <VistaTarea
        tarea={tarea}
        subtareas={tarea.id === DETALLE.id ? SUBTAREAS : []}
        listas={LISTAS}
        hoy={HOY}
        base={base}
        acciones={accionesVitrina} ia={accionesIaVitrina}
      />
    );
  }
  if (camino === "apuntes") {
    const hijas = new Map<string, number>();
    for (const p of PAGINAS) if (p.padre_id) hijas.set(p.padre_id, (hijas.get(p.padre_id) ?? 0) + 1);
    return <VistaApuntes paginas={PAGINAS.map((p) => ({ ...p, hijas: hijas.get(p.id) ?? 0 }))} hoy={HOY} base={base} />;
  }
  if (camino === "apuntes/nueva") {
    return <VistaNuevaPagina padreId={null} propias={[{ id: PAGINAS[2].id, titulo: "Ideas para Orbe", icono: "💡" }]} base={base} acciones={accionesApuntesVitrina} />;
  }
  if (ruta[0] === "apuntes" && ruta[2] === "historial") {
    return <VistaHistorial pagina={PAGINA} versiones={VERSIONES} base={base} acciones={accionesApuntesVitrina} />;
  }
  if (camino === "preguntar") {
    return <VistaPreguntar base={base} preguntar={accionesIaVitrina.preguntar} />;
  }
  if (camino === "papelera") {
    return <VistaPapelera tareas={PAPELERA.tareas} paginas={PAPELERA.paginas} base={base} ahora={`${HOY}T20:00:00Z`} acciones={accionesPapeleraVitrina} />;
  }
  if (ruta[0] === "apuntes" && ruta.length === 2) {
    return (
      <VistaPagina
        pagina={PAGINA}
        camino={[]}
        hijas={PAGINAS.filter((p) => p.padre_id === PAGINA.id)}
        urls={URLS_PAGINA}
        tamanos={{}}
        base={base}
        acciones={accionesApuntesVitrina}
        ia={accionesIaVitrina}
      />
    );
  }
  if (camino === "agenda") {
    const p = leerParametros(vista, dia, HOY);
    const [desde, hasta] = rangoDeVista(p.vista, p.dia);
    return (
      <VistaAgenda
        vista={p.vista}
        dia={p.dia}
        hoy={HOY}
        ahora={15 * 60 + 20}
        porDia={itemsPorDia(TAREAS, EVENTOS, desde, hasta)}
        google={{ conectado: true, error: false }}
        base={base}
        acciones={accionesVitrina} ia={accionesIaVitrina}
      />
    );
  }
  if (camino === "ajustes") {
    const uso = { archivos: 12.4 * 1024 * 1024, archivosMax: 30 * 1024 * 1024, texto: 410 * 1024, textoMax: 8 * 1024 * 1024 };
    return (
      <VistaAjustes
        nombre="Ana Prueba"
        email="ana@ejemplo.com"
        tema="auto"
        uso={uso}
        avisos={{ clavePublica: "BPruebaDeClavePublicaVapidQueNoSeUsaParaNadaEnLaVitrina0000000000000000000000000000000", dispositivos: 1 }}
        calendarioConectado={false}
        acciones={accionesAjustesVitrina}
        base={base}
        ia={{
          configurada: true,
          uso: {
            usados: 4,
            tope: 15,
            funciones: [
              { funcion: "captura", usados: 2, tope: 8, periodo: "dia" },
              { funcion: "etiquetas", usados: 0, tope: 5, periodo: "dia" },
              { funcion: "dividir", usados: 1, tope: 3, periodo: "dia" },
              { funcion: "audio", usados: 0, tope: 2, periodo: "dia" },
              { funcion: "plan", usados: 1, tope: 1, periodo: "dia" },
              { funcion: "resumen_semanal", usados: 0, tope: 1, periodo: "semana" },
              { funcion: "preguntar", usados: 0, tope: 5, periodo: "dia" },
              { funcion: "mejorar", usados: 0, tope: 5, periodo: "dia" },
              { funcion: "resumir", usados: 0, tope: 3, periodo: "dia" },
              { funcion: "tarjetas", usados: 0, tope: 2, periodo: "dia" },
              { funcion: "foto", usados: 0, tope: 2, periodo: "dia" },
            ],
          },
        }}
        invitados={[
          { email: "ana@ejemplo.com", activo: true, registrado: true },
          { email: "diana@ejemplo.com", activo: true, registrado: false },
          { email: "luis@ejemplo.com", activo: false, registrado: false },
        ]}
      />
    );
  }
  notFound();
}
