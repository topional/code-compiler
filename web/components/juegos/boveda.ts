/**
 * Adivina el número: el búho detective Lupa frente a la bóveda.
 * Cada respuesta lanza una ficha a la recta 1..10; cada pista tacha los
 * números descartados; al acertar se abre la bóveda.
 */

import {
  Camara,
  Cola,
  Particulas,
  clamp,
  degradado,
  easeInOut,
  easeOutBack,
  easeOutCubic,
  elipse,
  globo,
  ojos,
  rect,
  seguir,
  soloNumero,
  sombra,
  texto,
  type Juego,
} from './motor';

type Paso =
  | { tipo: 'intento'; n: number }
  | { tipo: 'pista'; mayor: boolean }
  | { tipo: 'abrir' }
  | { tipo: 'total'; n: number }
  | { tipo: 'mensaje'; s: string };

const MIN = 1;
const MAX = 10;

export function crearBoveda(): Juego {
  const cola = new Cola<Paso>();
  const fx = new Particulas();
  const cam = new Camara();
  let bajo = MIN;
  let alto = MAX;
  let ultimo: number | null = null;
  let intentos = 0;
  let abierta = 0; // 0..1 apertura animada
  let abriendo = false;
  let dial = 0;
  let dialMeta = 0;
  let mensaje = '¡Hola! Soy Lupa. Adivina el número secreto';
  let mensajeT = 0;
  let total: number | null = null;
  const descartadoT = new Map<number, number>(); // número → tiempo desde que se tachó

  const decir = (s: string) => {
    mensaje = s;
    mensajeT = 0;
  };

  return {
    reiniciar() {
      cola.vaciar();
      fx.lista = [];
      bajo = MIN;
      alto = MAX;
      ultimo = null;
      intentos = 0;
      abierta = 0;
      abriendo = false;
      dial = dialMeta = 0;
      total = null;
      descartadoT.clear();
      decir('Elige un número del 1 al 10');
    },
    alEvento(clase, s) {
      const txt = s.toLowerCase();
      if (clase === 'respuesta') {
        const n = soloNumero(s);
        if (n !== null) cola.agregar({ tipo: 'intento', n }, 0.8);
        return;
      }
      if (clase !== 'salida') return;
      const n = soloNumero(s);
      if (n !== null) {
        cola.agregar({ tipo: 'total', n }, 0.3);
        return;
      }
      if (/m[aá]s grande|mayor/.test(txt)) cola.agregar({ tipo: 'pista', mayor: true }, 0.9);
      else if (/m[aá]s peque|menor/.test(txt)) cola.agregar({ tipo: 'pista', mayor: false }, 0.9);
      else if (/adivinaste|correcto|acertaste/.test(txt)) cola.agregar({ tipo: 'abrir' }, 0.4);
      else cola.agregar({ tipo: 'mensaje', s }, 0.5);
    },

    dibujar(g, w, h, dt, t, info) {
      const paso = cola.avanzar(dt, info.reducido);
      if (paso?.tipo === 'intento') {
        ultimo = paso.n;
        intentos += 1;
        dialMeta += Math.PI * 0.6;
        decir(`Probemos con el ${paso.n}…`);
      } else if (paso?.tipo === 'pista' && ultimo !== null) {
        if (paso.mayor) bajo = Math.max(bajo, ultimo + 1);
        else alto = Math.min(alto, ultimo - 1);
        for (let k = MIN; k <= MAX; k += 1) if ((k < bajo || k > alto) && !descartadoT.has(k)) descartadoT.set(k, 0);
        cam.sacudir(0.15);
        decir(paso.mayor ? `Es MÁS GRANDE que ${ultimo}` : `Es MÁS PEQUEÑO que ${ultimo}`);
      } else if (paso?.tipo === 'abrir') {
        abriendo = true;
        dialMeta += Math.PI * 4;
        if (ultimo !== null) {
          bajo = alto = ultimo;
        }
        decir('¡Adivinaste! ¡La bóveda se abre!');
        cam.sacudir(0.4);
      } else if (paso?.tipo === 'total') {
        total = paso.n;
      } else if (paso?.tipo === 'mensaje') decir(paso.s);

      mensajeT += dt;
      dial = seguir(dial, dialMeta, dt, 4);
      if (abriendo && Math.abs(dial - dialMeta) < 0.4) {
        const antes = abierta;
        abierta = Math.min(1, abierta + dt * 0.9);
        if (antes < 0.5 && abierta >= 0.5) fx.estallar(w * 0.5, h * 0.45, 46, ['#facc15', '#fde047', '#f59e0b', '#ffffff'], { fuerza: 230, forma: 'circulo', tam: 5 });
      }
      for (const [k, v] of descartadoT) descartadoT.set(k, v + dt);
      fx.actualizar(dt);

      g.save();
      cam.aplicar(g, dt, info.reducido);

      // ---------- Sala de la bóveda
      g.fillStyle = degradado(g, 0, h, [[0, '#164e63'], [0.7, '#0e7490'], [1, '#083344']]);
      g.fillRect(-10, -10, w + 20, h + 20);
      g.strokeStyle = 'rgba(255,255,255,0.06)';
      g.lineWidth = 1;
      for (let y = 18; y < h * 0.72; y += 22) {
        for (let x = (y / 22) % 2 ? 0 : 22; x < w; x += 44) {
          g.strokeRect(x, y, 44, 22);
        }
      }
      g.fillStyle = '#0c4a6e';
      g.fillRect(-10, h * 0.72, w + 20, h);

      // ---------- Puerta de la bóveda
      const vx = w * 0.5;
      const vy = h * 0.4;
      const vr = Math.min(h * 0.3, 70);
      // interior con tesoro
      g.fillStyle = '#1c1917';
      g.beginPath();
      g.arc(vx, vy, vr, 0, Math.PI * 2);
      g.fill();
      if (abierta > 0) {
        for (let i = 0; i < 9; i += 1) {
          g.fillStyle = i % 2 ? '#facc15' : '#f59e0b';
          elipse(g, vx - 30 + (i % 5) * 15, vy + 20 - Math.floor(i / 5) * 10, 9, 5);
          g.fill();
        }
        g.fillStyle = '#a855f7';
        g.beginPath();
        g.moveTo(vx, vy - 18);
        g.lineTo(vx + 12, vy - 4);
        g.lineTo(vx, vy + 8);
        g.lineTo(vx - 12, vy - 4);
        g.closePath();
        g.fill();
      }
      // puerta (gira sobre la bisagra izquierda)
      g.save();
      g.translate(vx - vr, vy);
      g.scale(1 - easeInOut(abierta) * 0.85, 1);
      g.translate(vr, 0);
      const metal = g.createRadialGradient(-vr * 0.3, -vr * 0.3, 4, 0, 0, vr);
      metal.addColorStop(0, '#e2e8f0');
      metal.addColorStop(1, '#64748b');
      g.fillStyle = metal;
      g.beginPath();
      g.arc(0, 0, vr, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#334155';
      g.lineWidth = 4;
      g.stroke();
      for (let i = 0; i < 8; i += 1) {
        const a = (i / 8) * Math.PI * 2;
        g.fillStyle = '#475569';
        g.beginPath();
        g.arc(Math.cos(a) * vr * 0.82, Math.sin(a) * vr * 0.82, 4, 0, Math.PI * 2);
        g.fill();
      }
      // rueda/dial
      g.save();
      g.rotate(dial);
      g.strokeStyle = '#1e293b';
      g.lineWidth = 5;
      g.beginPath();
      g.arc(0, 0, vr * 0.42, 0, Math.PI * 2);
      g.stroke();
      for (let i = 0; i < 4; i += 1) {
        g.rotate(Math.PI / 2);
        rect(g, -3, -vr * 0.42, 6, vr * 0.42, 3);
        g.fillStyle = '#1e293b';
        g.fill();
      }
      g.restore();
      g.fillStyle = abriendo ? '#4ade80' : '#f87171';
      g.beginPath();
      g.arc(0, 0, 8, 0, Math.PI * 2);
      g.fill();
      g.restore();

      // ---------- Recta numérica 1..10
      const ancho = Math.min(w - 40, 420);
      const celda = ancho / 10;
      const x0 = (w - ancho) / 2;
      const yr = h * 0.78;
      for (let k = MIN; k <= MAX; k += 1) {
        const cx = x0 + (k - 1) * celda + celda / 2;
        const tachado = descartadoT.get(k);
        const esAcierto = abriendo && k === ultimo;
        const posible = k >= bajo && k <= alto;
        const pop = tachado !== undefined ? easeOutBack(clamp(tachado * 3)) : 0;
        g.fillStyle = esAcierto ? '#facc15' : posible ? '#f0f9ff' : '#334155';
        rect(g, cx - celda / 2 + 2, yr - 14, celda - 4, 28, 7);
        g.fill();
        if (esAcierto) {
          g.strokeStyle = '#fde047';
          g.lineWidth = 3;
          g.stroke();
        }
        texto(g, String(k), cx, yr, 14, posible || esAcierto ? '#0f172a' : '#64748b', 'center', 'rgba(0,0,0,0)');
        if (tachado !== undefined) {
          g.strokeStyle = '#f87171';
          g.lineWidth = 3;
          g.lineCap = 'round';
          const s = 7 * pop;
          g.beginPath();
          g.moveTo(cx - s, yr - s);
          g.lineTo(cx + s, yr + s);
          g.moveTo(cx + s, yr - s);
          g.lineTo(cx - s, yr + s);
          g.stroke();
        }
      }
      // ficha del intento volando hacia su casilla
      const actual = cola.actual?.datos;
      if (ultimo !== null) {
        const destino = x0 + (clamp(ultimo, MIN, MAX) - 1) * celda + celda / 2;
        const p = actual?.tipo === 'intento' ? easeOutCubic(cola.progreso) : 1;
        const fx0 = w * 0.14;
        const fy0 = h * 0.5;
        const bx = fx0 + (destino - fx0) * p;
        const by = fy0 + (yr - 32 - fy0) * p - Math.sin(p * Math.PI) * 40;
        g.fillStyle = '#f472b6';
        g.beginPath();
        g.arc(bx, by, 11, 0, Math.PI * 2);
        g.fill();
        texto(g, String(ultimo), bx, by, 12, '#ffffff', 'center', 'rgba(0,0,0,0)');
      }

      // ---------- Lupa, el búho detective
      const pista = actual?.tipo === 'pista' ? actual : null;
      dibujarBuho(g, w * 0.13, h * 0.66, t, pista ? (pista.mayor ? 1 : -1) : 0, abriendo);
      fx.dibujar(g);
      g.restore();

      // ---------- HUD
      g.fillStyle = 'rgba(2,6,23,0.6)';
      rect(g, w - 118, 10, 108, 38, 8);
      g.fill();
      texto(g, 'INTENTOS', w - 64, 21, 9, '#94a3b8', 'center', 'rgba(0,0,0,0)');
      texto(g, String(total ?? intentos), w - 64, 37, 16, '#fde047', 'center', 'rgba(0,0,0,0)');
      texto(g, `Rango: ${bajo} a ${alto}`, 14, 22, 12, '#a5f3fc', 'left');
      const esTurno = info.pregunta !== null && cola.pendientes === 0;
      globo(g, esTurno ? '¿Qué número probamos ahora?' : mensaje, w * 0.16, h * 0.43, w * 0.46, esTurno ? 1 : clamp(mensajeT * 5));
    },
  };
}

function dibujarBuho(g: CanvasRenderingContext2D, x: number, y: number, t: number, senal: number, feliz: boolean) {
  const salto = feliz ? Math.abs(Math.sin(t * 7)) * 8 : 0;
  g.save();
  g.translate(x, y - salto + Math.sin(t * 2.5) * 1.5);
  sombra(g, 0, 22 + salto, 22);
  // cuerpo
  g.fillStyle = '#92400e';
  elipse(g, 0, 0, 24, 28);
  g.fill();
  g.fillStyle = '#fde68a';
  elipse(g, 0, 6, 15, 18);
  g.fill();
  // alas (una señala arriba o abajo según la pista)
  g.fillStyle = '#78350f';
  g.save();
  g.translate(-20, -2);
  g.rotate(senal !== 0 ? -senal * 1.1 : Math.sin(t * 2) * 0.08);
  elipse(g, 0, 10, 7, 15);
  g.fill();
  g.restore();
  elipse(g, 20, 8, 7, 15);
  g.fill();
  if (senal !== 0) texto(g, senal > 0 ? '▲' : '▼', -34, senal > 0 ? -30 : 34, 18, senal > 0 ? '#4ade80' : '#f87171');
  // orejas
  g.fillStyle = '#92400e';
  for (const l of [-1, 1]) {
    g.beginPath();
    g.moveTo(l * 18, -18);
    g.lineTo(l * 22, -34);
    g.lineTo(l * 8, -24);
    g.fill();
  }
  // gafas de detective
  g.strokeStyle = '#1e293b';
  g.lineWidth = 2.5;
  for (const l of [-1, 1]) {
    g.beginPath();
    g.arc(l * 9, -12, 9, 0, Math.PI * 2);
    g.stroke();
  }
  ojos(g, 0, -12, 9, 5, t, 0.4, false);
  g.fillStyle = '#f59e0b';
  g.beginPath();
  g.moveTo(-4, -4);
  g.lineTo(4, -4);
  g.lineTo(0, 3);
  g.fill();
  // lupa
  g.strokeStyle = '#a16207';
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(24, 16);
  g.lineTo(34, 28);
  g.stroke();
  g.strokeStyle = '#e2e8f0';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(20, 10, 8, 0, Math.PI * 2);
  g.stroke();
  g.restore();
}
