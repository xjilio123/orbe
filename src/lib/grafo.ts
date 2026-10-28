// Mapa de notas: ubica las páginas como puntos y sus conexiones como líneas (como el grafo de Obsidian).
// Se calcula en el servidor y siempre da el mismo dibujo para los mismos datos: el teléfono no hace cuentas.

export type Nodo = { id: string; titulo: string; icono: string };
export type Arista = { origen: string; destino: string; tipo: "enlace" | "dentro" };
export type NodoUbicado = Nodo & { x: number; y: number; grado: number };

export const MAX_NODOS = 250;

/** Elige qué páginas entran (las más conectadas primero, hasta MAX_NODOS) y quita aristas sueltas o repetidas. */
export function armarGrafo(nodos: Nodo[], aristas: Arista[]) {
  const ids = new Set(nodos.map((n) => n.id));
  const vistas = new Set<string>();
  const validas: Arista[] = [];
  for (const a of aristas) {
    if (a.origen === a.destino || !ids.has(a.origen) || !ids.has(a.destino)) continue;
    const clave = [a.origen, a.destino].sort().join("|");
    if (vistas.has(clave)) continue;
    vistas.add(clave);
    validas.push(a);
  }
  const grado = new Map<string, number>();
  for (const a of validas) {
    grado.set(a.origen, (grado.get(a.origen) ?? 0) + 1);
    grado.set(a.destino, (grado.get(a.destino) ?? 0) + 1);
  }
  const elegidos = [...nodos].sort((a, b) => (grado.get(b.id) ?? 0) - (grado.get(a.id) ?? 0) || a.id.localeCompare(b.id)).slice(0, MAX_NODOS);
  const quedan = new Set(elegidos.map((n) => n.id));
  return {
    nodos: elegidos,
    aristas: validas.filter((a) => quedan.has(a.origen) && quedan.has(a.destino)),
    grado,
  };
}

/**
 * Distribución por fuerzas (Fruchterman–Reingold): las conexiones atraen, todos se repelen.
 * Empieza en un círculo ordenado por id, así el resultado es siempre el mismo.
 */
export function distribuir(nodos: Nodo[], aristas: Arista[], ancho: number, alto: number, vueltas = 220): NodoUbicado[] {
  const n = nodos.length;
  if (n === 0) return [];
  const indice = new Map(nodos.map((x, i) => [x.id, i]));
  const orden = [...nodos].sort((a, b) => a.id.localeCompare(b.id));
  const x = new Float64Array(n);
  const y = new Float64Array(n);
  orden.forEach((nodo, k) => {
    const i = indice.get(nodo.id)!;
    const angulo = (2 * Math.PI * k) / n;
    const radio = Math.min(ancho, alto) * 0.35 * (0.6 + 0.4 * ((k * 7) % 10) / 10);
    x[i] = ancho / 2 + radio * Math.cos(angulo);
    y[i] = alto / 2 + radio * Math.sin(angulo);
  });
  if (n === 1) return [{ ...nodos[0], x: ancho / 2, y: alto / 2, grado: 0 }];

  const pares = aristas.map((a) => [indice.get(a.origen)!, indice.get(a.destino)!] as const);
  // Distancia ideal entre páginas: deja lugar para el nombre debajo de cada punto.
  const k = Math.max(110, Math.sqrt((ancho * alto) / n) * 0.55);
  const dx = new Float64Array(n);
  const dy = new Float64Array(n);
  let temperatura = ancho / 8;

  for (let v = 0; v < vueltas; v++) {
    dx.fill(0);
    dy.fill(0);
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        let ex = x[i] - x[j];
        let ey = y[i] - y[j];
        let d = Math.hypot(ex, ey);
        if (d < 0.01) {
          ex = 0.01 * (i - j);
          ey = 0.01;
          d = Math.hypot(ex, ey);
        }
        const f = (k * k) / d;
        dx[i] += (ex / d) * f;
        dy[i] += (ey / d) * f;
        dx[j] -= (ex / d) * f;
        dy[j] -= (ey / d) * f;
      }
    }
    for (const [a, b] of pares) {
      const ex = x[a] - x[b];
      const ey = y[a] - y[b];
      const d = Math.max(0.01, Math.hypot(ex, ey));
      const f = (d * d) / k;
      dx[a] -= (ex / d) * f;
      dy[a] -= (ey / d) * f;
      dx[b] += (ex / d) * f;
      dy[b] += (ey / d) * f;
    }
    for (let i = 0; i < n; i++) {
      // Un poco de gravedad hacia el centro para que las páginas sueltas no se vayan lejos.
      dx[i] += (ancho / 2 - x[i]) * 0.6;
      dy[i] += (alto / 2 - y[i]) * 0.6;
      const d = Math.max(0.01, Math.hypot(dx[i], dy[i]));
      const paso = Math.min(d, temperatura);
      x[i] += (dx[i] / d) * paso;
      y[i] += (dy[i] / d) * paso;
    }
    temperatura *= 0.97;
  }

  // Escala para que todo entre en el lienzo con margen (solo achica: con pocas páginas no las separa de más).
  const margen = 40;
  const minX = Math.min(...x);
  const maxX = Math.max(...x);
  const minY = Math.min(...y);
  const maxY = Math.max(...y);
  const escala = Math.min(1, (ancho - 2 * margen) / Math.max(1, maxX - minX), (alto - 2 * margen) / Math.max(1, maxY - minY));
  const grado = new Map<string, number>();
  for (const a of aristas) {
    grado.set(a.origen, (grado.get(a.origen) ?? 0) + 1);
    grado.set(a.destino, (grado.get(a.destino) ?? 0) + 1);
  }
  return nodos.map((nodo, i) => ({
    ...nodo,
    x: Math.round((margen + (x[i] - minX) * escala + (ancho - 2 * margen - (maxX - minX) * escala) / 2) * 10) / 10,
    y: Math.round((margen + (y[i] - minY) * escala + (alto - 2 * margen - (maxY - minY) * escala) / 2) * 10) / 10,
    grado: grado.get(nodo.id) ?? 0,
  }));
}
