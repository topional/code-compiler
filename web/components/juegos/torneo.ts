/**
 * Torneo de Piedra, Papel o Tijera: Leo contra el robot Byte.
 * Reacciona a la respuesta del jugador (1, 2, 3), a la jugada que imprime el
 * programa para el rival y al resultado. Lleva un marcador entre partidas.
 */

import {
  Camara,
  Cola,
  Particulas,
  clamp,
  degradado,
  easeOutBack,
  globo,
  ojos,
  rect,
  sombra,
  texto,
  type Juego,
} from './motor';

type Jugada = 1 | 2 | 3 | 0;
type Resultado = 'gana' | 'pierde' | 'empate';
type Paso = { tipo: 'agitar' } | { tipo: 'revelar' } | { tipo: 'resultado'; r: Resultado } | { tipo: 'mensaje'; s: string };

const NOMBRES = ['', 'Piedra', 'Papel', 'Tijera'];

export function crearTorneo(): Juego {
  const cola = new Cola<Paso>();
  const fx = new Particulas();
  const cam = new Camara();
  let jugador: Jugada = 0;
  let rival: Jugada = 0;
  let mostrarJugadas = false;
  let resultado: Resultado | null = null;
  let tiempoRes = 0;
  const marcador = { leo: 0, byte: 0, empates: 0 }; // se conserva entre partidas
  let mensaje = '¡Bienvenido al torneo!';
  let mensajeT = 0;

  const decir = (s: string) => {
    mensaje = s;
    mensajeT = 0;
  };

  return {
    reiniciar() {
      cola.vaciar();
      jugador = rival = 0;
      mostrarJugadas = false;
      resultado = null;
      tiempoRes = 0;
      decir('¡Nueva ronda! Elige tu jugada');
    },
    alEvento(clase, s) {
      const txt = s.trim().toLowerCase();
      if (clase === 'respuesta') {
        const n = Number(txt);
        jugador = n === 1 || n === 2 || n === 3 ? (n as Jugada) : 0;
        if (jugador) cola.agregar({ tipo: 'agitar' }, 1.35);
        return;
      }
      if (clase !== 'salida' || txt.includes('|')) return;
      const indice = NOMBRES.findIndex((x) => x && x.toLowerCase() === txt);
      if (indice > 0) {
        rival = indice as Jugada;
        cola.agregar({ tipo: 'revelar' }, 0.9);
      } else if (/ganaste/.test(txt)) cola.agregar({ tipo: 'resultado', r: 'gana' }, 0.2);
      else if (/perdiste/.test(txt)) cola.agregar({ tipo: 'resultado', r: 'pierde' }, 0.2);
      else if (/empate/.test(txt)) cola.agregar({ tipo: 'resultado', r: 'empate' }, 0.2);
      else if (!/eligi/.test(txt)) cola.agregar({ tipo: 'mensaje', s }, 0.5);
    },

    dibujar(g, w, h, dt, t, info) {
      const paso = cola.avanzar(dt, info.reducido);
      if (paso?.tipo === 'agitar') {
        mostrarJugadas = false;
        decir('¡Piedra… papel… tijera!');
      } else if (paso?.tipo === 'revelar') {
        mostrarJugadas = true;
        cam.sacudir(0.3);
        decir(`Leo: ${NOMBRES[jugador] || '?'}  ·  Byte: ${NOMBRES[rival]}`);
      } else if (paso?.tipo === 'resultado') {
        resultado = paso.r;
        tiempoRes = 0;
        if (paso.r === 'gana') {
          marcador.leo += 1;
          decir('¡Leo gana la ronda!');
          fx.estallar(w * 0.27, h * 0.4, 50, ['#fde047', '#f472b6', '#38bdf8', '#4ade80'], { fuerza: 240 });
        } else if (paso.r === 'pierde') {
          marcador.byte += 1;
          decir('Byte gana esta vez… ¡revancha!');
          fx.estallar(w * 0.73, h * 0.4, 30, ['#94a3b8', '#38bdf8'], { fuerza: 180, forma: 'cuadro' });
        } else {
          marcador.empates += 1;
          decir('¡Empate! Mismas jugadas');
        }
      } else if (paso?.tipo === 'mensaje') decir(paso.s);
      if (resultado) tiempoRes += dt;
      mensajeT += dt;
      fx.actualizar(dt);

      g.save();
      cam.aplicar(g, dt, info.reducido);

      // ---------- Estadio
      g.fillStyle = degradado(g, 0, h, [[0, '#1e1b4b'], [0.55, '#312e81'], [1, '#0f172a']]);
      g.fillRect(-10, -10, w + 20, h + 20);
      // focos
      for (const [fx0, col] of [[0.2, 'rgba(244,114,182,0.16)'], [0.8, 'rgba(56,189,248,0.16)']] as const) {
        g.fillStyle = col;
        g.beginPath();
        g.moveTo(w * fx0 - 10, 0);
        g.lineTo(w * fx0 + 10, 0);
        g.lineTo(w * (fx0 < 0.5 ? 0.42 : 0.92), h * 0.85);
        g.lineTo(w * (fx0 < 0.5 ? 0.08 : 0.58), h * 0.85);
        g.closePath();
        g.fill();
      }
      // público
      for (let i = 0; i < 22; i += 1) {
        const px = (i + 0.5) * (w / 22);
        const salto = resultado === 'gana' ? Math.abs(Math.sin(t * 9 + i)) * 6 : Math.abs(Math.sin(t * 2 + i * 1.7)) * 2;
        g.fillStyle = ['#4338ca', '#6d28d9', '#1d4ed8'][i % 3];
        g.beginPath();
        g.arc(px, h * 0.5 - salto, 9, 0, Math.PI * 2);
        g.fill();
        rect(g, px - 10, h * 0.5 - salto + 6, 20, 18, 6);
        g.fill();
      }
      // escenario
      g.fillStyle = '#7c3aed';
      rect(g, -10, h * 0.62, w + 20, h * 0.45, 0);
      g.fill();
      g.fillStyle = '#a78bfa';
      g.fillRect(-10, h * 0.62, w + 20, 5);
      g.fillStyle = 'rgba(255,255,255,0.08)';
      for (let i = 0; i < 9; i += 1) g.fillRect(i * (w / 8) - 2, h * 0.62, 2, h);

      // ---------- Personajes
      const actual = cola.actual?.datos;
      const agitando = actual?.tipo === 'agitar';
      const golpe = agitando ? Math.abs(Math.sin(cola.progreso * Math.PI * 3)) : 0;
      const verJugadas = mostrarJugadas && !agitando;
      const reaccionLeo = resultado === 'gana' ? 1 : resultado === 'pierde' ? -1 : 0;
      dibujarLeo(g, w * 0.24, h * 0.86, t, reaccionLeo, tiempoRes);
      dibujarByte(g, w * 0.76, h * 0.86, t, -reaccionLeo, tiempoRes);
      const pop = verJugadas ? easeOutBack(clamp(cola.progreso * 3)) : 1;
      dibujarMano(g, w * 0.4, h * 0.58 - golpe * 22, verJugadas ? jugador : 1, false, pop * 1.5);
      dibujarMano(g, w * 0.6, h * 0.58 - golpe * 22, verJugadas ? rival : 1, true, pop * 1.5);
      if (verJugadas && jugador && rival) {
        texto(g, NOMBRES[jugador], w * 0.4, h * 0.58 + 44, 13, '#fde68a');
        texto(g, NOMBRES[rival], w * 0.6, h * 0.58 + 44, 13, '#bae6fd');
        texto(g, 'VS', w * 0.5, h * 0.56, 18, '#f472b6');
      }
      if (agitando) {
        const palabra = ['¡Piedra!', '¡Papel!', '¡Tijera!'][Math.min(2, Math.floor(cola.progreso * 3))];
        texto(g, palabra, w * 0.5, h * 0.32, 24 + golpe * 6, '#fde047');
      }
      fx.dibujar(g);
      g.restore();

      // ---------- Marcador
      g.fillStyle = 'rgba(2,6,23,0.85)';
      rect(g, w / 2 - 110, 8, 220, 36, 10);
      g.fill();
      g.strokeStyle = '#f472b6';
      g.lineWidth = 2;
      g.stroke();
      texto(g, 'LEO', w / 2 - 72, 26, 13, '#fde68a');
      texto(g, `${marcador.leo}  -  ${marcador.byte}`, w / 2, 26, 18, '#ffffff');
      texto(g, 'BYTE', w / 2 + 70, 26, 13, '#bae6fd');
      if (marcador.empates) texto(g, `empates: ${marcador.empates}`, w / 2, 54, 10, '#c4b5fd');

      const esTurno = info.pregunta !== null && cola.pendientes === 0;
      globo(g, esTurno ? '¿Piedra (1), papel (2) o tijera (3)?' : mensaje, w * 0.24, h * 0.52, w * 0.5, esTurno ? 1 : clamp(mensajeT * 5));

      if (resultado && cola.pendientes === 0) {
        const e = easeOutBack(clamp(tiempoRes * 2.2));
        g.save();
        g.translate(w / 2, h * 0.24);
        g.scale(e, e);
        const [s, c] = resultado === 'gana' ? ['¡GANASTE!', '#fde047'] : resultado === 'pierde' ? ['¡REVANCHA!', '#93c5fd'] : ['¡EMPATE!', '#f9a8d4'];
        texto(g, s, 0, 0, 32, c);
        g.restore();
      }
    },
  };
}

function dibujarMano(g: CanvasRenderingContext2D, x: number, y: number, jugada: Jugada, robot: boolean, escala: number) {
  const piel = robot ? '#94a3b8' : '#fcd34d';
  const borde = robot ? '#475569' : '#b45309';
  g.save();
  g.translate(x, y);
  g.scale(robot ? -escala : escala, escala);
  g.fillStyle = piel;
  g.strokeStyle = borde;
  g.lineWidth = 2.5;
  // puño base
  rect(g, -18, -16, 34, 30, 11);
  g.fill();
  g.stroke();
  if (jugada === 2) {
    // papel: cuatro dedos estirados
    for (let i = 0; i < 4; i += 1) {
      rect(g, 10, -15 + i * 7.5, 22, 7, 3.5);
      g.fill();
      g.stroke();
    }
  } else if (jugada === 3) {
    // tijera: dos dedos en V
    g.save();
    g.rotate(-0.3);
    rect(g, 10, -14, 26, 7, 3.5);
    g.fill();
    g.stroke();
    g.restore();
    g.save();
    g.rotate(0.3);
    rect(g, 10, -4, 26, 7, 3.5);
    g.fill();
    g.stroke();
    g.restore();
  } else {
    // piedra: nudillos
    for (let i = 0; i < 4; i += 1) {
      g.beginPath();
      g.arc(16, -10 + i * 7, 4, -Math.PI / 2, Math.PI / 2);
      g.stroke();
    }
  }
  // pulgar
  rect(g, -10, -22, 16, 9, 4.5);
  g.fill();
  g.stroke();
  g.restore();
}

function dibujarLeo(g: CanvasRenderingContext2D, x: number, y: number, t: number, animo: number, tr: number) {
  const salto = animo > 0 ? Math.abs(Math.sin(tr * 8)) * 14 * clamp(2 - tr * 0.5) : 0;
  const triste = animo < 0;
  g.save();
  g.translate(x, y - salto + Math.sin(t * 3) * 1.5);
  sombra(g, 0, salto + 2, 24);
  // cuerpo
  g.fillStyle = '#f97316';
  rect(g, -17, -40, 34, 36, 12);
  g.fill();
  g.fillStyle = '#1e3a8a';
  rect(g, -14, -8, 11, 10, 3);
  g.fill();
  rect(g, 3, -8, 11, 10, 3);
  g.fill();
  // brazos (arriba si gana)
  g.strokeStyle = '#fcd34d';
  g.lineWidth = 6;
  g.lineCap = 'round';
  for (const lado of [-1, 1]) {
    g.beginPath();
    g.moveTo(lado * 15, -32);
    g.lineTo(lado * (animo > 0 ? 24 : 22), animo > 0 ? -58 : -14);
    g.stroke();
  }
  // cabeza
  g.fillStyle = '#fcd34d';
  g.beginPath();
  g.arc(0, -56, 18, 0, Math.PI * 2);
  g.fill();
  // gorra
  g.fillStyle = '#dc2626';
  g.beginPath();
  g.arc(0, -60, 18, Math.PI, 0);
  g.fill();
  rect(g, 0, -64, 24, 6, 3);
  g.fill();
  ojos(g, 2, -54, 7, 3.2, t, 0.6, false);
  g.strokeStyle = '#7c2d12';
  g.lineWidth = 2;
  g.beginPath();
  if (triste) g.arc(2, -40, 6, 1.15 * Math.PI, 1.85 * Math.PI);
  else g.arc(2, -48, 6, 0.15 * Math.PI, 0.85 * Math.PI);
  g.stroke();
  g.restore();
}

function dibujarByte(g: CanvasRenderingContext2D, x: number, y: number, t: number, animo: number, tr: number) {
  const salto = animo > 0 ? Math.abs(Math.sin(tr * 8)) * 12 * clamp(2 - tr * 0.5) : 0;
  g.save();
  g.translate(x, y - salto + Math.sin(t * 3 + 1) * 1.5);
  sombra(g, 0, salto + 2, 24);
  // ruedas / patas
  g.fillStyle = '#334155';
  rect(g, -16, -8, 12, 10, 4);
  g.fill();
  rect(g, 4, -8, 12, 10, 4);
  g.fill();
  // cuerpo
  g.fillStyle = '#cbd5e1';
  rect(g, -20, -44, 40, 38, 8);
  g.fill();
  g.fillStyle = '#0ea5e9';
  rect(g, -12, -36, 24, 12, 4);
  g.fill();
  for (let i = 0; i < 3; i += 1) {
    g.fillStyle = (Math.floor(t * 4) + i) % 3 === 0 ? '#4ade80' : '#1e293b';
    g.beginPath();
    g.arc(-8 + i * 8, -30, 2.5, 0, Math.PI * 2);
    g.fill();
  }
  // cabeza
  g.fillStyle = '#e2e8f0';
  rect(g, -18, -76, 36, 28, 8);
  g.fill();
  g.fillStyle = '#0f172a';
  rect(g, -13, -70, 26, 15, 5);
  g.fill();
  // ojos LED
  const ojosColor = animo > 0 ? '#4ade80' : animo < 0 ? '#f87171' : '#38bdf8';
  g.fillStyle = ojosColor;
  for (const lado of [-1, 1]) {
    if (animo < 0) rect(g, lado * 6 - 4, -63, 8, 2.5, 1);
    else {
      g.beginPath();
      g.arc(lado * 6, -62.5, 3.2, 0, Math.PI * 2);
    }
    g.fill();
  }
  // antena
  g.strokeStyle = '#64748b';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, -76);
  g.lineTo(0, -86);
  g.stroke();
  g.fillStyle = Math.sin(t * 6) > 0 ? '#f472b6' : '#fda4af';
  g.beginPath();
  g.arc(0, -88, 3.5, 0, Math.PI * 2);
  g.fill();
  g.restore();
}
