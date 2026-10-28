# Seguridad

Orbe guarda notas, tareas y datos personales, así que la seguridad se diseña desde el inicio.

## Reportar una vulnerabilidad

No abras un issue público. Usa **Security → Report a vulnerability** en este repositorio
(reporte privado de GitHub). Respondo en cuanto pueda.

## Qué protege a la app

| Capa | Control |
|---|---|
| Base de datos | RLS en todas las tablas: cada fila solo la ve su dueño. Llaves compuestas `(id, user_id)`: una tarea no puede apuntar a la lista o tarea de otra persona. Topes por persona (50 listas, 5 000 tareas). Registro cerrado por lista de correos permitidos, con un máximo de 30 personas. Sin sesión no se puede leer nada. |
| Servidor | Las páginas verifican la sesión con `getClaims()` y las escrituras con `getUser()`. El `user_id` sale de la sesión, nunca del formulario. |
| Navegador | CSP estricta con nonce por request (`strict-dynamic`, sin `unsafe-eval` en producción), `frame-ancestors 'none'`, HSTS, `nosniff`, `Referrer-Policy` y `Permissions-Policy`. |
| Secretos | Solo la clave *publishable* (pública por diseño, limitada por RLS) llega al navegador. Ningún secreto se versiona. |
| Código | React escapa el texto; `dangerouslySetInnerHTML`, `eval` y `new Function` están prohibidos por ESLint. |

## Pruebas automáticas (GitHub Actions)

- **Calidad:** ESLint, TypeScript estricto y pruebas con Vitest.
- **Dependencias:** `npm audit` de producción en cada push; Dependabot semanal con 7 días de espera.
- **Secretos:** Gitleaks sobre todo el historial.
- **Análisis estático:** Semgrep (JavaScript, TypeScript, React, OWASP Top 10).
- **Base de datos:** pgTAP prueba las políticas RLS, el registro cerrado y el tope de 30 personas en un Supabase local.
- **Ataque simulado:** escaneo base de OWASP ZAP contra la app compilada.
- **E2E (Playwright):** ninguna ruta privada responde sin sesión, el callback de Google no permite redirecciones
  externas, CSP y cabeceras presentes, nonce distinto por request, cookie de tema validada.

## Otras medidas

- **Cadena de suministro:** las acciones de GitHub se fijan por SHA; Dependabot espera 7 días antes de proponer
  versiones nuevas.
- **Funciones con privilegios:** viven en el esquema `private`, que no se expone por la API.
- **Service worker:** guarda en el teléfono las últimas 40 pantallas visitadas para verlas sin conexión (siempre intenta
  primero la red). Nunca guarda `/login` ni `/auth/`, y borra todas las copias al cerrar sesión o al llegar al login.
  Las tareas capturadas sin conexión viven en `localStorage` hasta enviarse y también se borran al cerrar sesión.
- **Búsqueda:** `public.buscar` corre como `security definer` pero filtra siempre por `auth.uid()` (probado con pgTAP).
- **Invitados:** solo `private.administradores` puede listar, invitar o quitar; tope de 30 activos en la base.
- **Tema:** una cookie HttpOnly sin datos personales; cualquier valor desconocido vuelve a "automático".
- **IA (Fase 4):** Gemini en su nivel gratuito, solo desde el servidor, con topes diarios por persona y por función.
  En ese nivel Google puede usar lo enviado para mejorar sus modelos, por eso solo se envía lo que la persona elige.
