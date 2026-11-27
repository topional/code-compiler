/**
 * Despegue espacial: la piloto Nova en el cohete Chispa-1.
 * Reacciona a "listo", al nombre del piloto, a cada número de la cuenta
 * regresiva y a "despegue". Tras despegar entra en órbita y nunca se congela.
 */

import {
  Camara,
  Cola,
  Particulas,
  cieloEstrellado,
  clamp,
  easeInCubic,
  easeOutBack,
  elipse,
  globo,
  lerp,
  ojos,
  rect,
  soloNumero,
  texto,
  textoVar,
  type Juego,
} from './motor';

type Paso = { tipo: 'listo' } | { tipo: 'piloto'; s: string } | { tipo: 'cuenta'; n: number } | { tipo: 'despegue' } | { tipo: 'mensaje'; s: string };
type Fase = 'plataforma' | 'cuenta' | 'despegue' | 'orbita';

const ESTRELLAS = cieloEstrellado(90, 7);
const DURACION_ASCENSO = 4.2;

export function crearCohete(): Juego {
  const cola = new Cola<Paso>();
  const fx = new Particulas();
  const cam = new Camara();
  let fase: Fase = 'plataforma';
  let piloto = 'Nova';
  let numero: number | null = null;
  let numeroT = 0;
  let tDespegue = 0;
  let altitud = 0; // km mostrados
  let angOrbita = 0;
  let mensaje = 'Cohete Chispa-1 en la plataforma';
  let mensajeT = 0;
  let vibracion = 0;

  return {
    reiniciar() {
      cola.vaciar();
      fx.lista = [];
      fase = 'plataforma';
      numero = null;
      tDespegue = 0;
      altitud = 0;
      angOrbita = 0;
      vibracion = 0;
      mensaje = 'Preparando la plataforma…';
      mensajeT = 0;
    },
    alEvento(clase, s, info) {
      if (clase !== 'salida') return;
      const txt = s.toLowerCase();
      const n = soloNumero(s);
      if (n !== null) cola.agregar({ tipo: 'cuenta', n }, 0.85);
      else if (/despeg|al espacio/.test(txt)) cola.agregar({ tipo: 'despegue' }, 0.4);
      else if (/listo|plataforma/.test(txt)) cola.agregar({ tipo: 'listo' }, 0.9);
      else if (s.trim() === textoVar(info.variables, ['piloto'], '\u0000')) cola.agregar({ tipo: 'piloto', s: s.trim() }, 0.8);
      else cola.agregar({ tipo: 'mensaje', s }, 0.6);
    },

    dibujar(g, w, h, dt, t, info) {
      const paso = cola.avanzar(dt, info.reducido);
      if (paso) {
        mensajeT = 0;
        if (paso.tipo === 'listo') mensaje = '¡Cohete listo en la plataforma!';
        else if (paso.tipo === 'piloto') {
          piloto = paso.s;
          mensaje = `Piloto a bordo: ${paso.s}`;
        } else if (paso.tipo === 'cuenta') {
          fase = 'cuenta';
          numero = paso.n;
          numeroT = 0;
          vibracion = clamp(1 - paso.n / 6, 0.15, 1);
          cam.sacudir(0.12 + vibracion * 0.18);
          mensaje = `T-menos ${paso.n}`;
        } else if (paso.tipo === 'despegue') {
          fase = 'despegue';
          tDespegue = 0;
          numero = null;
          cam.sacudir(0.9);
          mensaje = '¡DESPEGUE AL ESPACIO!';
        } else mensaje = paso.s;
      }
      mensajeT += dt;
      numeroT += dt;

      // ---- progreso del vuelo
      if (fase === 'despegue') {
        tDespegue += info.reducido ? DURACION_ASCENSO : dt;
        if (tDespegue >= DURACION_ASCENSO) fase = 'orbita';
      }
      const subida = fase === 'despegue' ? easeInCubic(tDespegue / DURACION_ASCENSO) : fase === 'orbita' ? 1 : 0;
      if (fase === 'despegue') altitud = subida * 120;
      if (fase === 'orbita') {
        altitud += dt * 3.5; // el altímetro sigue vivo
        angOrbita += dt * 0.55;
      }
      fx.actualizar(dt);

      g.save();
      cam.aplicar(g, dt, info.reducido);

      if (fase !== 'orbita') {
        // ---------- Cielo que se oscurece al subir
        const cielo = g.createLinearGradient(0, 0, 0, h);
        cielo.addColorStop(0, mezcla('#7dd3fc', '#0b1026', subida));
        cielo.addColorStop(1, mezcla('#e0f2fe', '#3b1d6e', subida));
        g.fillStyle = cielo;
        g.fillRect(-10, -10, w + 20, h + 20);
        g.globalAlpha = subida;
        for (const e of ESTRELLAS) {
          g.fillStyle = '#ffffff';
          g.fillRect(e.x * w, ((e.y + subida * 0.5) % 1) * h, e.r, e.r);
        }
        g.globalAlpha = 1;

        // Mundo que baja cuando el cohete sube
        const desplaz = subida * h * 2.4;
        g.save();
        g.translate(0, desplaz);
        // nubes
        g.fillStyle = 'rgba(255,255,255,0.85)';
        for (let i = 0; i < 5; i += 1) {
          const cx = ((i * 0.27 + t * 0.01) % 1.2) * w - 20;
          const cy = h * 0.2 + i * 24 - h * 0.9 * (i % 2);
          elipse(g, cx, cy, 30, 10);
          g.fill();
          elipse(g, cx + 18, cy - 5, 20, 9);
          g.fill();
        }
        // ciudad lejana y suelo
        g.fillStyle = '#94a3b8';
        for (let i = 0; i < 12; i += 1) {
          const bw = w / 12;
          const bh = 18 + ((i * 37) % 30);
          g.fillRect(i * bw, h * 0.78 - bh, bw - 3, bh);
        }
        g.fillStyle = '#65a30d';
        g.fillRect(-10, h * 0.78, w + 20, h);
        g.fillStyle = '#525252';
        rect(g, w * 0.5 - 60, h * 0.78 - 8, 120, 12, 3);
        g.fill();
        // torre de lanzamiento
        const tx = w * 0.5 + 46;
        g.strokeStyle = '#dc2626';
        g.lineWidth = 4;
        g.beginPath();
        g.moveTo(tx, h * 0.78);
        g.lineTo(tx, h * 0.2);
        g.stroke();
        g.lineWidth = 1.5;
        for (let y = h * 0.22; y < h * 0.78; y += 14) {
          g.beginPath();
          g.moveTo(tx - 8, y);
          g.lineTo(tx + 8, y + 14);
          g.moveTo(tx + 8, y);
          g.lineTo(tx - 8, y + 14);
          g.stroke();
        }
        // luz de la torre: roja en cuenta, verde al despegar
        g.fillStyle = fase === 'cuenta' ? (Math.sin(t * 10) > 0 ? '#ef4444' : '#7f1d1d') : fase === 'despegue' ? '#22c55e' : '#fbbf24';
        g.beginPath();
        g.arc(tx, h * 0.2, 5, 0, Math.PI * 2);
        g.fill();
        g.restore();

        // ---------- Cohete
        const vib = fase === 'cuenta' ? vibracion : fase === 'despegue' ? 1 - subida * 0.7 : 0;
        const rx = w * 0.5 + (Math.random() - 0.5) * vib * 3 * (info.reducido ? 0 : 1);
        const ry = h * 0.7 - subida * h * 0.42;
        const potencia = fase === 'despegue' ? 1 : fase === 'cuenta' ? vibracion * 0.45 : 0;
        if (potencia > 0) {
          for (let i = 0; i < (fase === 'despegue' ? 6 : 2); i += 1) {
            fx.emitir(rx + (Math.random() - 0.5) * 14, ry + 30, (Math.random() - 0.5) * 90, 80 + Math.random() * 120, i % 2 ? 'rgba(226,232,240,0.85)' : 'rgba(203,213,225,0.7)', 8 + Math.random() * 10, 1.4, -20);
          }
        }
        fx.dibujar(g);
        dibujarCohete(g, rx, ry, t, potencia, piloto, fase !== 'plataforma');
      } else {
        // ---------- Órbita: el cohete gira alrededor del planeta sin detenerse
        g.fillStyle = '#060a1f';
        g.fillRect(-10, -10, w + 20, h + 20);
        for (const e of ESTRELLAS) {
          const x = ((e.x - angOrbita * 0.05 * e.r) % 1 + 1) % 1;
          g.globalAlpha = 0.5 + Math.sin(t * 2 + e.fase) * 0.4;
          g.fillStyle = '#ffffff';
          g.fillRect(x * w, e.y * h, e.r, e.r);
        }
        g.globalAlpha = 1;
        // luna
        g.fillStyle = '#e2e8f0';
        g.beginPath();
        g.arc(w * 0.86, h * 0.2, 16, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = '#cbd5e1';
        g.beginPath();
        g.arc(w * 0.86 + 5, h * 0.2 - 4, 4, 0, Math.PI * 2);
        g.fill();
        // órbita inclinada alrededor del planeta: por detrás en la mitad superior
        const px = w * 0.5;
        const py = h * 0.58;
        const pr = h * 0.2;
        const orx = Math.min(w * 0.4, pr * 3.4);
        const ory = pr * 0.85;
        const cx = px + Math.cos(angOrbita) * orx;
        const cy = py + Math.sin(angOrbita) * ory;
        const dx = -Math.sin(angOrbita) * orx;
        const dy = Math.cos(angOrbita) * ory;
        const detras = Math.sin(angOrbita) < 0;
        const naveEscala = 0.42 + (detras ? 0 : 0.1);
        const dibujarNave = () => {
          fx.emitir(cx - dx * 0.06, cy - dy * 0.06, -dx * 0.25, -dy * 0.25, '#fb923c', 2.5, 0.45, 0, 'chispa');
          fx.dibujar(g);
          g.save();
          g.translate(cx, cy);
          g.rotate(Math.atan2(dy, dx) + Math.PI / 2);
          g.scale(naveEscala, naveEscala);
          dibujarCohete(g, 0, 0, t, 0.6, piloto, true);
          g.restore();
        };
        g.strokeStyle = 'rgba(148,163,184,0.35)';
        g.setLineDash([4, 6]);
        g.lineWidth = 1.5;
        elipse(g, px, py, orx, ory);
        g.stroke();
        g.setLineDash([]);
        if (detras) dibujarNave();
        const atm = g.createRadialGradient(px, py, pr * 0.9, px, py, pr * 1.3);
        atm.addColorStop(0, 'rgba(56,189,248,0.5)');
        atm.addColorStop(1, 'rgba(56,189,248,0)');
        g.fillStyle = atm;
        g.beginPath();
        g.arc(px, py, pr * 1.3, 0, Math.PI * 2);
        g.fill();
        g.save();
        g.beginPath();
        g.arc(px, py, pr, 0, Math.PI * 2);
        g.fillStyle = '#1d4ed8';
        g.fill();
        g.clip();
        g.fillStyle = '#16a34a';
        for (let i = 0; i < 4; i += 1) {
          // continentes que giran con el planeta
          const cxp = px + ((((angOrbita * 0.3 + i * 0.55) % 2.2) + 2.2) % 2.2 - 1.1) * pr * 1.9;
          elipse(g, cxp, py - pr * 0.3 + (i % 2) * pr * 0.5, pr * 0.32, pr * 0.16);
          g.fill();
        }
        g.fillStyle = 'rgba(2,6,23,0.35)';
        g.beginPath();
        g.arc(px + pr * 0.45, py + pr * 0.3, pr, 0, Math.PI * 2);
        g.fill();
        g.restore();
        if (!detras) dibujarNave();
        texto(g, '¡Misión cumplida!', w / 2, 28, 20, '#fde047');
      }
      g.restore();

      // ---------- HUD
      if (numero !== null && fase === 'cuenta') {
        const e = easeOutBack(clamp(numeroT * 3.2));
        g.save();
        g.translate(w * 0.22, h * 0.42);
        g.scale(e, e);
        texto(g, String(numero), 0, 0, 64, numero <= 1 ? '#f87171' : '#fde047');
        g.restore();
      }
      g.fillStyle = 'rgba(2,6,23,0.7)';
      rect(g, w - 132, 10, 122, 40, 8);
      g.fill();
      texto(g, 'ALTITUD', w - 71, 22, 10, '#94a3b8', 'center', 'rgba(0,0,0,0)');
      texto(g, `${altitud.toFixed(altitud < 10 ? 1 : 0)} km`, w - 71, 39, 15, '#4ade80', 'center', 'rgba(0,0,0,0)');
      if (fase !== 'orbita') globo(g, mensaje, w * 0.5 - 70, h * 0.36, w * 0.55, clamp(mensajeT * 5));
    },
  };
}

function dibujarCohete(g: CanvasRenderingContext2D, x: number, y: number, t: number, potencia: number, piloto: string, encendido: boolean) {
  g.save();
  g.translate(x, y);
  // llama
  if (potencia > 0.05) {
    const largo = 18 + potencia * 34 + Math.sin(t * 40) * 5;
    const llama = g.createLinearGradient(0, 30, 0, 30 + largo);
    llama.addColorStop(0, '#fff7ed');
    llama.addColorStop(0.35, '#fbbf24');
    llama.addColorStop(1, 'rgba(239,68,68,0)');
    g.fillStyle = llama;
    g.beginPath();
    g.moveTo(-11, 28);
    g.quadraticCurveTo(0, 30 + largo * 1.2, 11, 28);
    g.closePath();
    g.fill();
  }
  // aletas
  g.fillStyle = '#dc2626';
  g.beginPath();
  g.moveTo(-15, 8);
  g.lineTo(-28, 32);
  g.lineTo(-13, 28);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(15, 8);
  g.lineTo(28, 32);
  g.lineTo(13, 28);
  g.closePath();
  g.fill();
  // cuerpo
  const cuerpo = g.createLinearGradient(-16, 0, 16, 0);
  cuerpo.addColorStop(0, '#cbd5e1');
  cuerpo.addColorStop(0.45, '#ffffff');
  cuerpo.addColorStop(1, '#94a3b8');
  g.fillStyle = cuerpo;
  g.beginPath();
  g.moveTo(0, -52);
  g.bezierCurveTo(22, -34, 17, 0, 15, 30);
  g.lineTo(-15, 30);
  g.bezierCurveTo(-17, 0, -22, -34, 0, -52);
  g.fill();
  // punta
  g.fillStyle = '#dc2626';
  g.beginPath();
  g.moveTo(0, -52);
  g.bezierCurveTo(10, -44, 13, -38, 14, -34);
  g.lineTo(-14, -34);
  g.bezierCurveTo(-13, -38, -10, -44, 0, -52);
  g.fill();
  // ventanilla con la piloto
  g.fillStyle = '#1e293b';
  g.beginPath();
  g.arc(0, -14, 11, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#7dd3fc';
  g.beginPath();
  g.arc(0, -14, 8.5, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#fde68a';
  g.beginPath();
  g.arc(0, -13, 5.5, 0, Math.PI * 2);
  g.fill();
  ojos(g, 0, -14, 2.2, 1.2, t, 0, false);
  // saludo de la piloto antes de despegar
  if (!encendido) {
    g.strokeStyle = '#fde68a';
    g.lineWidth = 2;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(5, -11);
    g.lineTo(9 + Math.sin(t * 8) * 2, -19);
    g.stroke();
  }
  // nombre
  g.fillStyle = '#1e3a8a';
  rect(g, -13, 4, 26, 11, 3);
  g.fill();
  texto(g, piloto.slice(0, 6).toUpperCase(), 0, 10, 7, '#ffffff', 'center', 'rgba(0,0,0,0)');
  g.restore();
}

/** Mezcla dos colores hex según p (0..1). */
function mezcla(a: string, b: string, p: number) {
  const ca = parseInt(a.slice(1), 16);
  const cb = parseInt(b.slice(1), 16);
  const c = [16, 8, 0].map((s) => Math.round(lerp((ca >> s) & 255, (cb >> s) & 255, clamp(p))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
