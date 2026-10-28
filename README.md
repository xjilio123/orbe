# Orbe

**Tu día, tus notas y tus pendientes en un solo lugar.** App personal tipo Notion para iPhone, iPad, Android y web:
tareas, apuntes por bloques, recordatorios, agenda e IA, con diseño al estilo Apple en modo claro y oscuro.

> *Notion-style personal productivity PWA. Next.js 16 + Supabase, zero-cost hosting, security-first: strict
> nonce-based CSP, Row Level Security tested with pgTAP, and a CI pipeline with Gitleaks, Semgrep and OWASP ZAP.*

## Estado

| Fase | Contenido | Estado |
|---|---|---|
| 0 · Cimientos | Repo y pipeline, Supabase + RLS, login con Google, sistema de diseño | Lista |
| 1 · MVP | Inbox, tareas, apuntes por bloques, pantalla Hoy, control de espacio | Lista |
| 2 · Tiempo | Agenda (día, semana, mes), avisos push, tareas que se repiten, Google Calendar | Lista |
| 3 · Pulido | Modo sin conexión, búsqueda, plantillas, barra ⌘K, papelera e historial, invitados | Lista |
| 4 · IA | Captura inteligente, resúmenes, plan del día, preguntas a tus notas, topes de uso | Pendiente |
| 5 · Extras | Hábitos y metas, backlinks, modo estudio y más | Pendiente |

## Stack

- **Next.js 16** (App Router, Server Actions, `proxy.ts`) + **React 19** + **TypeScript** estricto.
- **Tailwind CSS 4** con tokens propios: un color de sistema de iOS por módulo, modo claro, oscuro o automático.
- **Supabase** (Postgres, Auth con Google, RLS) en el plan gratuito.
- **Vercel** (plan Hobby, región São Paulo) con despliegue automático desde `main`.
- **PWA** instalable desde el navegador, sin tiendas de apps.
- **Avisos push**: `pg_cron` revisa cada minuto y, solo si hay algo que avisar, llama con `pg_net` a la Edge Function
  `avisos` (Web Push con VAPID). El secreto entre ambos y las claves VAPID se generan dentro de Supabase y viven en Vault.
- **Google Calendar** de solo lectura con la dirección secreta iCal (`ical.js` en el servidor; solo se aceptan
  direcciones de `calendar.google.com`).

## Fluidez

Cada PR pasa por el check **Fluidez (rendimiento)** (`e2e/fluidez.spec.ts`): las pantallas reales, con datos
ficticios en una vitrina que nunca existe en Vercel, se abren como en un iPhone con la CPU 4× más lenta.

| Medida | Presupuesto | Medido (Fase 3) |
|---|---|---|
| Bloques que se corren al abrir ("tirón") | ≤ 1 px | 0 px |
| Primer contenido visible | ≤ 1.5 s | 0.14–0.36 s |
| Bloqueo del hilo principal | ≤ 600 ms | 100–275 ms |
| Cambio de pestaña | ≤ 0.8 s | 0.2–0.38 s |
| JavaScript de la primera pantalla | ≤ 260 KB | 186 KB |
| Tecla más lenta en el editor | ≤ 120 ms | 48 ms |
| Marcar una tarea | ≤ 150 ms | 16 ms |
| Elegir un día en la Agenda | ≤ 150 ms | 40 ms |
| Abrir la barra ⌘K | ≤ 300 ms | 24 ms |

Para medir en local: `npm run build && FLUIDEZ=1 npm run e2e`.

## Costo

US$0 al mes para uso personal (hasta 30 personas): Vercel Hobby, Supabase Free, GitHub Actions en repo público.

## Desarrollo

```bash
cp .env.example .env.local   # URL y clave publishable de Supabase
npm install
npm run dev
npm run verificar            # lint + tipos + pruebas
```

Seguridad y pruebas automáticas: ver [SECURITY.md](SECURITY.md).
