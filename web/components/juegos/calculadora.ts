/**
 * Calculadora Mágica: el robot-máquina Calcu.
 * Reacciona a las respuestas (operación, primer y segundo número), al
 * resultado que imprime el programa y al aviso de división entre cero.
 */

import {
  Camara,
  Cola,
  Particulas,
  clamp,
  degradado,
  easeInCubic,
  easeOutBack,
  elipse,
  globo,
  ojos,
  rect,
  soloNumero,
  sombra,
  texto,
  type Juego,
} from './motor';

type Paso =
  | { tipo: 'operacion'; op: number }
  | { tipo: 'numero'; cual: 0 | 1; n: string }
  | { tipo: 'procesar' }
  | { tipo: 'resultado'; s: string }
  | { tipo: 'error'; s: string }
  | { tipo: 'mensaje'; s: string };

const SIMBOLOS = ['', '+', '−', '×', '÷'];
const NOMBRES_OP = ['', 'Suma', 'Resta', 'Multiplicar', 'Dividir'];
const COLORES = ['', '#22c55e', '#f97316', '#3b82f6', '#a855f7'];

export function crearCalculadora(): Juego {
  const cola = new Cola<Paso>();
  const fx = new Particulas();
  const cam = new Camara();
  let respuestas = 0;
  let op = 0;
  let a: string | null = null;
  let b: string | null = null;
  let resultado: string | null = null;
  let error = false;
  let engranaje = 0;
  let pensando = 0;
  let tiempoRes = 0;
  let mensaje = '¡Hola! Soy Calcu. Elige una operación';
  let mensajeT = 0;

  const decir = (s: string) => {
    mensaje = s;
    mensajeT = 0;
  };

  return {
    reiniciar() {
      cola.vaciar();
      fx.lista = [];
      respuestas = 0;
      op = 0;
      a = b = resultado = null;
      error = false;
      pensando = 0;
      tiempoRes = 0;
      decir('Elige una operación del 1 al 4');
    },
    alEvento(clase, s) {
      const txt = s.toLowerCase();
      if (clase === 'respuesta') {
        respuestas += 1;
        if (respuestas === 1) cola.agregar({ tipo: 'operacion', op: Number(s.trim()) }, 0.6);
        else if (respuestas <= 3) cola.agregar({ tipo: 'numero', cual: respuestas === 2 ? 0 : 1, n: s.trim() }, 0.6);
        return;
      }
      if (clase !== 'salida' || txt.includes('|')) return;
      if (/resultado/.test(txt)) cola.agregar({ tipo: 'procesar' }, 1.3);
      else if (/cero|no se puede/.test(txt)) cola.agregar({ tipo: 'error', s }, 0.2);
      else if (soloNumero(s) !== null) cola.agregar({ tipo: 'resultado', s: s.trim() }, 0.2);
      else cola.agregar({ tipo: 'mensaje', s }, 0.5);
    },

    dibujar(g, w, h, dt, t, info) {
      const paso = cola.avanzar(dt, info.reducido);
      if (paso?.tipo === 'operacion') {
        op = paso.op >= 1 && paso.op <= 4 ? paso.op : 0;
        decir(op ? `Operación: ${NOMBRES_OP[op]}` : 'Esa operación no existe: elige 1, 2, 3 o 4');
      } else if (paso?.tipo === 'numero') {
        if (paso.cual === 0) a = paso.n;
        else b = paso.n;
        decir(paso.cual === 0 ? `Primer número: ${paso.n}` : `Segundo número: ${paso.n}`);
      } else if (paso?.tipo === 'procesar') {
        decir('Calcu está calculando…');
      } else if (paso?.tipo === 'resultado') {
        resultado = paso.s;
        tiempoRes = 0;
        cam.sacudir(0.25);
        fx.estallar(w * 0.72, h * 0.5, 36, ['#fde047', COLORES[op] || '#38bdf8', '#ffffff', '#f472b6'], { fuerza: 210 });
        decir(`¡Resultado: ${paso.s}!`);
      } else if (paso?.tipo === 'error') {
        error = true;
        tiempoRes = 0;
        cam.sacudir(0.8);
        decir('¡No se puede dividir entre cero!');
      } else if (paso?.tipo === 'mensaje') decir(paso.s);

      const actual = cola.actual?.datos;
      pensando = actual?.tipo === 'procesar' ? 1 : Math.max(0, pensando - dt * 2);
      engranaje += dt * (0.4 + pensando * 7);
      if (resultado || error) tiempoRes += dt;
      if (error && Math.random() < 0.5) fx.emitir(w * 0.5 + (Math.random() - 0.5) * 40, h * 0.18, (Math.random() - 0.5) * 30, -40 - Math.random() * 30, 'rgba(100,116,139,0.7)', 6 + Math.random() * 8, 1.2, -10);
      if (pensando > 0.5 && Math.random() < 0.3) fx.emitir(w * 0.5 + (Math.random() - 0.5) * 30, h * 0.2, (Math.random() - 0.5) * 20, -50, 'rgba(255,255,255,0.7)', 4 + Math.random() * 4, 0.8, -5);
      mensajeT += dt;
      fx.actualizar(dt);

      g.save();
      cam.aplicar(g, dt, info.reducido);

      // ---------- Taller
      g.fillStyle = degradado(g, 0, h, [[0, '#fef3c7'], [0.6, '#fde68a'], [1, '#d97706']]);
      g.fillRect(-10, -10, w + 20, h + 20);
      g.fillStyle = 'rgba(180,83,9,0.12)';
      for (let x = 0; x < w; x += 36) g.fillRect(x, 0, 18, h * 0.72);
      g.fillStyle = '#78350f';
      g.fillRect(-10, h * 0.82, w + 20, h);
      // cinta transportadora
      g.fillStyle = '#334155';
      rect(g, w * 0.6, h * 0.74, w * 0.38, 12, 6);
      g.fill();
      g.fillStyle = '#64748b';
      for (let i = 0; i < 8; i += 1) {
        const xx = w * 0.6 + ((i * 18 + engranaje * 14) % (w * 0.38));
        g.fillRect(xx, h * 0.745, 6, 4);
      }

      // ---------- Bolas de entrada
      const bolaA = a !== null ? { x: w * 0.16, y: h * 0.55 } : null;
      const bolaB = b !== null ? { x: w * 0.28, y: h * 0.55 } : null;
      const tragar = actual?.tipo === 'procesar' ? easeInCubic(cola.progreso * 1.6) : resultado || error ? 1 : 0;
      for (const [bola, valor, color] of [[bolaA, a, '#38bdf8'], [bolaB, b, '#f472b6']] as const) {
        if (!bola || valor === null || tragar >= 1) continue;
        const x = bola.x + (w * 0.5 - bola.x) * tragar;
        const y = bola.y + (h * 0.12 - bola.y) * tragar - Math.sin(tragar * Math.PI) * 50;
        sombra(g, bola.x, h * 0.66, 14 * (1 - tragar), 0.18);
        g.fillStyle = color;
        g.beginPath();
        g.arc(x, y, 18 * (1 - tragar * 0.5), 0, Math.PI * 2);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,0.35)';
        g.beginPath();
        g.arc(x - 5, y - 6, 5, 0, Math.PI * 2);
        g.fill();
        texto(g, valor.length > 5 ? `${valor.slice(0, 5)}…` : valor, x, y, 13, '#ffffff');
      }

      // ---------- Calcu
      const mx = w * 0.5;
      const my = h * 0.5;
      const temblor = error ? Math.sin(t * 40) * 3 * clamp(1.5 - tiempoRes) : pensando > 0 ? Math.sin(t * 30) * 1.2 : 0;
      g.save();
      g.translate(mx + temblor, my + Math.sin(t * 2) * 1.5);
      sombra(g, 0, h * 0.27, 70);
      // tolva
      g.fillStyle = '#94a3b8';
      g.beginPath();
      g.moveTo(-28, -h * 0.4);
      g.lineTo(28, -h * 0.4);
      g.lineTo(12, -h * 0.3);
      g.lineTo(-12, -h * 0.3);
      g.closePath();
      g.fill();
      // cuerpo
      g.fillStyle = '#0ea5e9';
      rect(g, -62, -h * 0.3, 124, h * 0.56, 18);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.18)';
      rect(g, -56, -h * 0.28, 20, h * 0.5, 10);
      g.fill();
      // pantalla-cara
      g.fillStyle = error ? '#450a0a' : '#052e16';
      rect(g, -48, -h * 0.25, 96, 50, 10);
      g.fill();
      if (error) {
        g.strokeStyle = '#f87171';
        g.lineWidth = 3;
        for (const l of [-1, 1]) {
          const ex = l * 16;
          const ey = -h * 0.25 + 18;
          g.beginPath();
          g.moveTo(ex - 6, ey - 6);
          g.lineTo(ex + 6, ey + 6);
          g.moveTo(ex + 6, ey - 6);
          g.lineTo(ex - 6, ey + 6);
          g.stroke();
        }
        texto(g, '¡ERROR!', 0, -h * 0.25 + 38, 12, '#fca5a5', 'center', 'rgba(0,0,0,0)');
      } else {
        ojos(g, 0, -h * 0.25 + 17, 16, 6, t + 2.1, pensando > 0 ? Math.sin(t * 8) : 0, false);
        const expr = op ? `${a ?? '?'} ${SIMBOLOS[op]} ${b ?? '?'}${resultado ? ` = ${resultado}` : ''}` : '¿ ? ?';
        g.font = '700 12px "JetBrains Mono", monospace';
        texto(g, expr.length > 16 ? `${expr.slice(0, 15)}…` : expr, 0, -h * 0.25 + 38, 12, '#4ade80', 'center', 'rgba(0,0,0,0)');
      }
      // botones de operación
      for (let i = 1; i <= 4; i += 1) {
        const bx = -45 + (i - 1) * 30;
        const by = h * 0.06;
        const activo = op === i;
        const brillo = activo ? 0.6 + Math.sin(t * 6) * 0.4 : 0;
        g.fillStyle = activo ? COLORES[i] : '#e0f2fe';
        rect(g, bx - 12, by - 2 + (activo ? 2 : 0), 24, 22, 6);
        g.fill();
        if (activo) {
          g.globalAlpha = brillo * 0.5;
          g.fillStyle = COLORES[i];
          rect(g, bx - 16, by - 6, 32, 30, 9);
          g.fill();
          g.globalAlpha = 1;
        }
        texto(g, SIMBOLOS[i], bx, by + 10 + (activo ? 2 : 0), 15, activo ? '#ffffff' : '#0369a1', 'center', 'rgba(0,0,0,0)');
      }
      // engranajes
      for (const [gx, gy, r, s] of [[-40, h * 0.2, 12, 1], [-18, h * 0.2, 8, -1.5]] as const) {
        g.save();
        g.translate(gx, gy);
        g.rotate(engranaje * s);
        g.fillStyle = '#fbbf24';
        for (let i = 0; i < 8; i += 1) {
          g.rotate(Math.PI / 4);
          g.fillRect(-2.5, -r - 3, 5, 5);
        }
        g.beginPath();
        g.arc(0, 0, r, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#92400e';
        g.beginPath();
        g.arc(0, 0, r * 0.35, 0, Math.PI * 2);
        g.fill();
        g.restore();
      }
      // luces
      for (let i = 0; i < 3; i += 1) {
        g.fillStyle = pensando > 0 && (Math.floor(t * 8) + i) % 3 === 0 ? '#fde047' : '#075985';
        g.beginPath();
        g.arc(14 + i * 14, h * 0.2, 4.5, 0, Math.PI * 2);
        g.fill();
      }
      // rampa de salida
      g.fillStyle = '#64748b';
      g.beginPath();
      g.moveTo(62, h * 0.12);
      g.lineTo(98, h * 0.24);
      g.lineTo(98, h * 0.28);
      g.lineTo(62, h * 0.18);
      g.closePath();
      g.fill();
      g.restore();

      // ---------- Globo del resultado
      if (resultado && !error) {
        const e = easeOutBack(clamp(tiempoRes * 1.8));
        const flota = Math.sin(t * 2) * 4;
        const rx = w * 0.8;
        const ry = h * 0.42 + flota - e * 10;
        g.strokeStyle = '#64748b';
        g.lineWidth = 1.5;
        g.beginPath();
        g.moveTo(rx, ry + 26 * e);
        g.quadraticCurveTo(rx - 10, ry + 50, rx - 4, h * 0.72);
        g.stroke();
        g.fillStyle = COLORES[op] || '#38bdf8';
        elipse(g, rx, ry, 30 * e, 34 * e);
        g.fill();
        g.fillStyle = 'rgba(255,255,255,0.35)';
        elipse(g, rx - 9 * e, ry - 12 * e, 7 * e, 10 * e);
        g.fill();
        texto(g, resultado.length > 7 ? `${resultado.slice(0, 7)}…` : resultado, rx, ry, 17 * e + 0.1, '#ffffff');
      }
      fx.dibujar(g);
      g.restore();

      // ---------- Leyenda de operaciones sobre el piso
      const paso4 = Math.min(118, (w - 24) / 4);
      for (let i = 1; i <= 4; i += 1) {
        const lx = 12 + (i - 1) * paso4;
        g.fillStyle = op === i ? COLORES[i] : 'rgba(255,255,255,0.88)';
        rect(g, lx, h - 30, paso4 - 6, 22, 11);
        g.fill();
        texto(g, `${i}: ${SIMBOLOS[i]} ${NOMBRES_OP[i]}`, lx + (paso4 - 6) / 2, h - 19, 11, op === i ? '#ffffff' : '#78350f', 'center', 'rgba(0,0,0,0)');
      }
      const turno = info.pregunta !== null && cola.pendientes === 0;
      const pide = respuestas === 0 ? '¿Qué operación? (1 a 4)' : respuestas === 1 ? '¿Primer número?' : '¿Segundo número?';
      globo(g, turno ? pide : mensaje, w * 0.22, h * 0.42, w * 0.42, turno ? 1 : clamp(mensajeT * 5));
    },
  };
}
