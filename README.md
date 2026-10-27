# Orbe

**Tu día, tus notas y tus pendientes en un solo lugar.** App personal tipo Notion para iPhone, iPad, Android y web:
tareas, apuntes por bloques, recordatorios, agenda e IA, con diseño al estilo Apple en modo claro y oscuro.

> *Notion-style personal productivity PWA. Next.js 16 + Supabase, zero-cost hosting, security-first: strict
> nonce-based CSP, Row Level Security tested with pgTAP, and a CI pipeline with Gitleaks, Semgrep and OWASP ZAP.*

## Estado

| Fase | Contenido | Estado |
|---|---|---|
| 0 · Cimientos | Repo y pipeline, Supabase + RLS, login con Google, sistema de diseño | En curso |
| 1 · MVP | Inbox, tareas, apuntes por bloques, pantalla Hoy, control de espacio | Pendiente |
| 2 · Tiempo | Calendario, avisos push, repetición, Google Calendar | Pendiente |
| 3 · Pulido | Modo sin conexión, búsqueda, plantillas, barra ⌘K, papelera, invitados | Pendiente |
| 4 · IA | Captura inteligente, resúmenes, plan del día, preguntas a tus notas, topes de uso | Pendiente |
| 5 · Extras | Hábitos y metas, backlinks, modo estudio y más | Pendiente |

## Stack

- **Next.js 16** (App Router, Server Actions, `proxy.ts`) + **React 19** + **TypeScript** estricto.
- **Tailwind CSS 4** con tokens propios: un color de sistema de iOS por módulo, modo claro, oscuro o automático.
- **Supabase** (Postgres, Auth con Google, RLS) en el plan gratuito.
- **Vercel** (plan Hobby, región São Paulo) con despliegue automático desde `main`.
- **PWA** instalable desde el navegador, sin tiendas de apps.

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
