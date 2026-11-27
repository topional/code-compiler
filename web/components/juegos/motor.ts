/**
 * Motor común de los juegos del escenario: tipos, cola de animaciones,
 * suavizado, partículas, sacudida de cámara y utilidades de dibujo.
 * Cada juego vive en su propio archivo y solo usa estas piezas.
 */

import type { VariableMemoria } from '../../engine/types';

export type EscenaJuego2D = 'rpg' | 'aventura' | 'torneo' | 'cohete' | 'boveda' | 'calculadora' | 'chispa';

/** Lo que el escenario sabe del programa en cada fotograma. */
export interface InfoPrograma {
  variables: VariableMemoria[];
  estado: 'inactivo' | 'corriendo' | 'pausado' | 'esperando_paso';
  pregunta: string | null;
  acento: string;
  /** true si el usuario pidió reducir el movimiento */
  reducido: boolean;
}

/** Contrato que cumple cada juego. */
export interface Juego {
  /** Una ejecución nueva empieza: vuelve al estado inicial. */
  reiniciar(): void;
  /**
   * Una línea nueva de la terminal: 'salida' (un `mostrar`), 'respuesta' (lo que
   * escribió el jugador), 'pregunta', 'aviso' o 'motivacion'.
   */
  alEvento(clase: string, texto: string, info: InfoPrograma): void;
  /** Avanza la animación `dt` segundos y dibuja el fotograma. */
  dibujar(g: CanvasRenderingContext2D, w: number, h: number, dt: number, t: number, info: InfoPrograma): void;
  /** Clic sobre el escenario en coordenadas 0..1 (opcional). */
  alClic?(x: number, y: number): void;
}

// ---------------------------------------------------------------- suavizado

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export const easeOutCubic = (p: number) => 1 - (1 - clamp(p)) ** 3;
export const easeInCubic = (p: number) => clamp(p) ** 3;
export const easeInOut = (p: number) => {
  const x = clamp(p);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};
export const easeOutBack = (p: number) => {
  const x = clamp(p) - 1;
  return 1 + 2.7 * x ** 3 + 1.7 * x ** 2;
};
/** Rebote amortiguado: 0 → sube y vuelve a 0. Ideal para "pop" y aplastar/estirar. */
export const rebote = (p: number) => (p >= 1 ? 0 : Math.sin(clamp(p) * Math.PI) * (1 - clamp(p)) * 1.6);
/** Acerca `actual` a `meta` de forma exponencial e independiente de los fps. */
export const seguir = (actual: number, meta: number, dt: number, rapidez = 8) =>
  meta + (actual - meta) * Math.exp(-rapidez * dt);

// ---------------------------------------------------------------- cola de pasos

/**
 * Cola de pasos animados. El intérprete puede imprimir todo en milisegundos;
 * la cola reproduce cada paso con su duración para que el niño lo vea.
 */
export class Cola<P> {
  private pasos: { datos: P; duracion: number }[] = [];
  actual: { datos: P; duracion: number } | null = null;
  tiempo = 0;

  agregar(datos: P, duracion: number) {
    this.pasos.push({ datos, duracion });
  }

  vaciar() {
    this.pasos = [];
    this.actual = null;
    this.tiempo = 0;
  }

  get pendientes() {
    return this.pasos.length + (this.actual ? 1 : 0);
  }

  /** Progreso 0..1 del paso actual. */
  get progreso() {
    return this.actual ? clamp(this.tiempo / Math.max(0.001, this.actual.duracion)) : 1;
  }

  /** Avanza; devuelve el paso que acaba de empezar (para dispararlo una vez). */
  avanzar(dt: number, reducido: boolean): P | null {
    if (this.actual) {
      // Si hay muchos pasos esperando, se acelera para no quedar atrasado.
      const prisa = this.pasos.length > 6 ? 3 : this.pasos.length > 3 ? 1.6 : 1;
      this.tiempo += reducido ? this.actual.duracion : dt * prisa;
      if (this.tiempo < this.actual.duracion) return null;
      this.actual = null;
    }
    const siguiente = this.pasos.shift();
    if (!siguiente) return null;
    this.actual = siguiente;
    this.tiempo = 0;
    return siguiente.datos;
  }
}

// ---------------------------------------------------------------- partículas

export interface Particula {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vida: number;
  maxVida: number;
  tam: number;
  color: string;
  gravedad: number;
  forma: 'circulo' | 'cuadro' | 'estrella' | 'chispa';
  giro: number;
}

export class Particulas {
  lista: Particula[] = [];

  /** Explosión radial en coordenadas de píxeles. */
  estallar(x: number, y: number, cantidad: number, colores: string[], opciones: Partial<Particula> & { fuerza?: number } = {}) {
    const fuerza = opciones.fuerza ?? 160;
    for (let i = 0; i < cantidad; i += 1) {
      const ang = Math.random() * Math.PI * 2;
      const vel = fuerza * (0.35 + Math.random() * 0.75);
      this.lista.push({
        x,
        y,
        vx: Math.cos(ang) * vel,
        vy: Math.sin(ang) * vel - fuerza * 0.35,
        vida: 0,
        maxVida: opciones.maxVida ?? 0.9 + Math.random() * 0.6,
        tam: opciones.tam ?? 3 + Math.random() * 4,
        color: colores[i % colores.length],
        gravedad: opciones.gravedad ?? 320,
        forma: opciones.forma ?? (i % 3 === 0 ? 'estrella' : i % 3 === 1 ? 'cuadro' : 'circulo'),
        giro: Math.random() * Math.PI,
      });
    }
  }

  /** Emisión continua hacia una dirección (humo, fuego, burbujas). */
  emitir(x: number, y: number, vx: number, vy: number, color: string, tam: number, maxVida: number, gravedad = 0, forma: Particula['forma'] = 'circulo') {
    this.lista.push({ x, y, vx, vy, vida: 0, maxVida, tam, color, gravedad, forma, giro: Math.random() * 6 });
  }

  actualizar(dt: number) {
    for (const p of this.lista) {
      p.vida += dt;
      p.vy += p.gravedad * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.giro += dt * 4;
    }
    this.lista = this.lista.filter((p) => p.vida < p.maxVida);
    if (this.lista.length > 600) this.lista.splice(0, this.lista.length - 600);
  }

  dibujar(g: CanvasRenderingContext2D) {
    for (const p of this.lista) {
      const a = 1 - p.vida / p.maxVida;
      g.globalAlpha = clamp(a * 1.4);
      g.fillStyle = p.color;
      const s = p.tam * (p.forma === 'chispa' ? a : 1);
      if (p.forma === 'circulo' || p.forma === 'chispa') {
        g.beginPath();
        g.arc(p.x, p.y, Math.max(0.3, s), 0, Math.PI * 2);
        g.fill();
      } else if (p.forma === 'cuadro') {
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.giro);
        g.fillRect(-s / 2, -s / 2, s, s * 0.6);
        g.restore();
      } else {
        estrella(g, p.x, p.y, s * 1.3, s * 0.55, p.giro);
        g.fill();
      }
    }
    g.globalAlpha = 1;
  }
}

// ---------------------------------------------------------------- cámara

/** Sacudida de cámara con decaimiento ("trauma" al cuadrado, como en Vlambeer). */
export class Camara {
  trauma = 0;
  sacudir(cantidad: number) {
    this.trauma = clamp(this.trauma + cantidad);
  }
  aplicar(g: CanvasRenderingContext2D, dt: number, reducido: boolean) {
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
    if (reducido || this.trauma <= 0) return;
    const fuerza = this.trauma * this.trauma * 9;
    g.translate((Math.random() * 2 - 1) * fuerza, (Math.random() * 2 - 1) * fuerza);
  }
}

// ---------------------------------------------------------------- dibujo

export function rect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + rr, y);
  g.arcTo(x + w, y, x + w, y + h, rr);
  g.arcTo(x + w, y + h, x, y + h, rr);
  g.arcTo(x, y + h, x, y, rr);
  g.arcTo(x, y, x + w, y, rr);
  g.closePath();
}

export function estrella(g: CanvasRenderingContext2D, cx: number, cy: number, r1: number, r2: number, giro = 0, puntas = 5) {
  g.beginPath();
  for (let i = 0; i < puntas * 2; i += 1) {
    const r = i % 2 === 0 ? r1 : r2;
    const a = giro - Math.PI / 2 + (i * Math.PI) / puntas;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.closePath();
}

export function elipse(g: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  g.beginPath();
  g.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
}

export function sombra(g: CanvasRenderingContext2D, x: number, y: number, rx: number, alfa = 0.25) {
  g.fillStyle = `rgba(0,0,0,${alfa})`;
  elipse(g, x, y, rx, rx * 0.28);
  g.fill();
}

export function degradado(g: CanvasRenderingContext2D, y0: number, y1: number, paradas: [number, string][]) {
  const d = g.createLinearGradient(0, y0, 0, y1);
  for (const [p, c] of paradas) d.addColorStop(p, c);
  return d;
}

export const FUENTE = '"Fredoka", "Plus Jakarta Sans", system-ui, sans-serif';

/** Texto con contorno grueso, legible sobre cualquier fondo. */
export function texto(
  g: CanvasRenderingContext2D,
  contenido: string,
  x: number,
  y: number,
  tam: number,
  color = '#ffffff',
  alinear: CanvasTextAlign = 'center',
  contorno = 'rgba(15,23,42,0.85)',
) {
  g.font = `700 ${Math.round(tam)}px ${FUENTE}`;
  g.textAlign = alinear;
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineWidth = Math.max(2, tam * 0.22);
  g.strokeStyle = contorno;
  g.strokeText(contenido, x, y);
  g.fillStyle = color;
  g.fillText(contenido, x, y);
}

/** Recorta un texto para que quepa en `ancho` píxeles. */
export function ajustar(g: CanvasRenderingContext2D, contenido: string, ancho: number) {
  if (g.measureText(contenido).width <= ancho) return contenido;
  let s = contenido;
  while (s.length > 1 && g.measureText(`${s}…`).width > ancho) s = s.slice(0, -1);
  return `${s}…`;
}

/** Globo de diálogo con piquito; `px` es la x de la punta. Muestra lo que imprime `mostrar`. */
export function globo(
  g: CanvasRenderingContext2D,
  contenido: string,
  px: number,
  py: number,
  anchoMax: number,
  escala = 1,
  fondo = '#ffffff',
  tinta = '#1e293b',
) {
  if (!contenido || escala <= 0.01) return;
  const tam = 13;
  g.font = `600 ${tam}px ${FUENTE}`;
  const linea = ajustar(g, contenido, anchoMax - 20);
  const ancho = Math.min(anchoMax, g.measureText(linea).width + 22);
  const alto = 28;
  const dpr = typeof window === 'undefined' ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  const x = clamp(px - ancho / 2, 6, Math.max(6, g.canvas.width / dpr - ancho - 6));
  const y = py - alto - 10;
  g.save();
  g.translate(px, py);
  g.scale(escala, escala);
  g.translate(-px, -py);
  g.fillStyle = 'rgba(15,23,42,0.18)';
  rect(g, x + 2, y + 3, ancho, alto, 12);
  g.fill();
  g.fillStyle = fondo;
  rect(g, x, y, ancho, alto, 12);
  g.fill();
  g.beginPath();
  g.moveTo(px - 7, y + alto - 1);
  g.lineTo(px, py);
  g.lineTo(px + 7, y + alto - 1);
  g.closePath();
  g.fill();
  g.fillStyle = tinta;
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillText(linea, x + 11, y + alto / 2 + 1);
  g.restore();
}

/** Barra de vida/progreso con valor animado. */
export function barra(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, p: number, color: string, fondo = 'rgba(15,23,42,0.55)') {
  g.fillStyle = fondo;
  rect(g, x, y, w, h, h / 2);
  g.fill();
  if (p > 0.001) {
    g.fillStyle = color;
    rect(g, x + 2, y + 2, Math.max(h - 4, (w - 4) * clamp(p)), h - 4, (h - 4) / 2);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.28)';
    rect(g, x + 4, y + 3, Math.max(0, (w - 8) * clamp(p)), (h - 4) / 3, 2);
    g.fill();
  }
}

/** Ojos simpáticos que parpadean y miran hacia `mirar` (-1..1). */
export function ojos(g: CanvasRenderingContext2D, x: number, y: number, sep: number, r: number, t: number, mirar = 0, cerrados = false) {
  const parpadeo = cerrados || (t % 3.7) < 0.12;
  for (const lado of [-1, 1]) {
    const ox = x + lado * sep;
    if (parpadeo) {
      g.strokeStyle = '#0f172a';
      g.lineWidth = Math.max(1.5, r * 0.45);
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(ox - r * 0.8, y);
      g.lineTo(ox + r * 0.8, y);
      g.stroke();
      continue;
    }
    g.fillStyle = '#ffffff';
    elipse(g, ox, y, r, r * 1.15);
    g.fill();
    g.fillStyle = '#0f172a';
    elipse(g, ox + mirar * r * 0.35, y + r * 0.1, r * 0.55, r * 0.65);
    g.fill();
    g.fillStyle = '#ffffff';
    elipse(g, ox + mirar * r * 0.35 - r * 0.2, y - r * 0.2, r * 0.18, r * 0.18);
    g.fill();
  }
}

// ---------------------------------------------------------------- variables

export function numVar(vars: VariableMemoria[], nombres: string[], defecto: number): number {
  for (const n of nombres) {
    const v = vars.find((x) => x.nombre.toLowerCase() === n);
    if (v && v.valor !== '') {
      const num = Number(v.valor);
      if (Number.isFinite(num)) return num;
    }
  }
  return defecto;
}

export function textoVar(vars: VariableMemoria[], nombres: string[], defecto: string): string {
  for (const n of nombres) {
    const v = vars.find((x) => x.nombre.toLowerCase() === n);
    if (v && v.valor !== '') return String(v.valor).replace(/^"|"$/g, '');
  }
  return defecto;
}

/** Número entero si el texto es solo un número (p. ej. lo que imprime `mostrar dano`). */
export function soloNumero(s: string): number | null {
  const limpio = s.trim();
  return /^-?\d+(\.\d+)?$/.test(limpio) ? Number(limpio) : null;
}

/** Estrellas de fondo estables (misma semilla → mismo cielo). */
export function cieloEstrellado(cantidad: number, semilla: number) {
  let s = semilla;
  const azar = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  return Array.from({ length: cantidad }, () => ({ x: azar(), y: azar(), r: 0.6 + azar() * 1.6, fase: azar() * 6 }));
}
