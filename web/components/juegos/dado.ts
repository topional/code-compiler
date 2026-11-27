/**
 * Aventura del Dado Mágico: la rana Saltín recorre un tablero de 6 casillas.
 * Reacciona a "Lanzando…", al número del dado que imprime el programa,
 * al nombre del jugador y al resultado (estrella o volver a lanzar).
 * Las estrellas se acumulan entre partidas.
 */

import {
  Camara,
  Cola,
  Particulas,
  clamp,
  degradado,
  easeOutBack,
  easeOutCubic,
  elipse,
  estrella,
  globo,
  numVar,
  ojos,
  rect,
  soloNumero,
  sombra,
  texto,
  textoVar,
  type Juego,
} from './motor';

type Paso =
  | { tipo: 'lanzar' }
  | { tipo: 'cae'; n: number }
  | { tipo: 'avanzar'; n: number }
  | { tipo: 'estrella' }
  | { tipo: 'otra' }
  | { tipo: 'mensaje'; s: string };

const SALTO = 0.38;

export function crearDado(): Juego {
  const cola = new Cola<Paso>();
  const fx = new Particulas();
  const cam = new Camara();
  let casilla = 0; // 0 = salida, 1..6 casillas
  let destino: number | null = null; // casilla final del último avance
  let caraDado = 1;
  let lanzando = false;
  let dadoVisible = false;
  let nombre = 'Explorador';
  let estrellas = 0; // se conserva entre partidas
  let cofreAbierto = 0;
  let estrellaVuela = -1;
  let tristeza = 0;
  let final: 'estrella' | 'otra' | null = null; // resultado del último lanzamiento
  let mensaje = '¡Hola! Soy Saltín. ¿Lanzamos el dado?';
  let mensajeT = 0;

  const decir = (s: string) => {
    mensaje = s;
    mensajeT = 0;
  };

  return {
    reiniciar() {
      cola.vaciar();
      fx.lista = [];
      casilla = 0;
      destino = null;
      lanzando = false;
      dadoVisible = false;
      cofreAbierto = 0;
      estrellaVuela = -1;
      tristeza = 0;
      final = null;
      decir('¡A jugar!');
    },
    alEvento(clase, s, info) {
      if (clase !== 'salida') return;
      const txt = s.toLowerCase();
      const n = soloNumero(s);
      if (n !== null) {
        const v = Math.max(1, Math.min(6, Math.round(n)));
        cola.agregar({ tipo: 'cae', n: v }, 0.6);
        cola.agregar({ tipo: 'avanzar', n: v }, 0.2 + v * SALTO);
      }
      // "Vuelve a lanzar" también contiene "lanz": se revisa antes que el lanzamiento.
      else if (/vuelve a lanzar|buen intento|otra vez/.test(txt)) cola.agregar({ tipo: 'otra' }, 1.0);
      else if (/estrella|s[uú]per/.test(txt)) cola.agregar({ tipo: 'estrella' }, 1.4);
      else if (/lanzando|lanza el dado|tirando/.test(txt)) cola.agregar({ tipo: 'lanzar' }, 1.0);
      else {
        const nom = textoVar(info.variables, ['nombre', 'jugador_nombre'], '\u0000');
        if (s.trim() === nom) nombre = nom;
        cola.agregar({ tipo: 'mensaje', s }, 0.55);
      }
    },

    dibujar(g, w, h, dt, t, info) {
      const paso = cola.avanzar(dt, info.reducido);
      // Al terminar un avance, Saltín queda exactamente en la casilla del dado.
      if (cola.actual?.datos.tipo !== 'avanzar' && destino !== null) casilla = destino;
      if (paso?.tipo === 'avanzar') destino = paso.n;
      if (paso?.tipo === 'lanzar') {
        lanzando = true;
        dadoVisible = true;
        decir('¡Lanzando el dado mágico!');
      } else if (paso?.tipo === 'cae') {
        lanzando = false;
        caraDado = paso.n;
        cam.sacudir(0.3);
        fx.estallar(w * 0.5, h * 0.3, 14, ['#ffffff', '#fde047'], { fuerza: 120, forma: 'chispa' });
        decir(`¡Salió ${paso.n}!`);
      } else if (paso?.tipo === 'avanzar') {
        decir(`Saltín avanza ${paso.n} casilla${paso.n > 1 ? 's' : ''}`);
      } else if (paso?.tipo === 'estrella') {
        estrellaVuela = 0;
        final = 'estrella';
        decir('¡Súper tirada! ¡Ganaste una estrella!');
        fx.estallar(posCasilla(w, h, casilla).x, posCasilla(w, h, casilla).y - 30, 40, ['#fde047', '#facc15', '#f472b6', '#ffffff'], { fuerza: 220 });
      } else if (paso?.tipo === 'otra') {
        tristeza = 1;
        final = 'otra';
        decir('¡Casi! Para ganar la estrella necesitas 4 o más');
      } else if (paso?.tipo === 'mensaje') decir(paso.s);

      // Si el programa terminó sin imprimir el número, el dado no se queda girando.
      if (lanzando && cola.pendientes === 0 && info.estado === 'inactivo') {
        lanzando = false;
        caraDado = Math.max(1, Math.min(6, Math.round(numVar(info.variables, ['dado'], caraDado))));
      }

      // movimiento casilla por casilla
      const actual = cola.actual?.datos;
      let saltoP = 0;
      let desde = casilla;
      let hacia = casilla;
      if (actual?.tipo === 'avanzar') {
        const pasado = Math.max(0, cola.tiempo - 0.2);
        const hechos = Math.min(actual.n, Math.floor(pasado / SALTO));
        desde = hechos;
        hacia = Math.min(actual.n, hechos + 1);
        saltoP = clamp((pasado - hechos * SALTO) / SALTO);
        if (hechos >= actual.n) saltoP = 0;
        casilla = hechos;
      }
      if (estrellaVuela >= 0) {
        estrellaVuela += dt;
        cofreAbierto = Math.min(1, cofreAbierto + dt * 3);
        if (estrellaVuela > 1.1 && estrellaVuela - dt <= 1.1) estrellas += 1;
      }
      tristeza = Math.max(0, tristeza - dt * 0.3);
      mensajeT += dt;
      fx.actualizar(dt);

      g.save();
      cam.aplicar(g, dt, info.reducido);

      // ---------- Mar e isla
      g.fillStyle = degradado(g, 0, h, [[0, '#7dd3fc'], [0.45, '#38bdf8'], [1, '#0284c7']]);
      g.fillRect(-10, -10, w + 20, h + 20);
      g.strokeStyle = 'rgba(255,255,255,0.35)';
      g.lineWidth = 2;
      for (let i = 0; i < 6; i += 1) {
        const yy = h * 0.2 + i * 30;
        g.beginPath();
        for (let x = -10; x < w + 10; x += 8) g.lineTo(x, yy + Math.sin(x * 0.05 + t * 2 + i) * 3);
        g.stroke();
      }
      g.fillStyle = '#fde68a';
      elipse(g, w * 0.5, h * 0.7, w * 0.48, h * 0.3);
      g.fill();
      g.fillStyle = '#86efac';
      elipse(g, w * 0.5, h * 0.66, w * 0.44, h * 0.25);
      g.fill();
      // palmeras
      for (const [px, l] of [[0.1, 1], [0.92, -1]] as const) palmera(g, w * px, h * 0.66, t, l);

      // ---------- Camino de casillas
      g.strokeStyle = '#a16207';
      g.lineWidth = 6;
      g.setLineDash([2, 10]);
      g.beginPath();
      for (let k = 0; k <= 6; k += 1) {
        const p = posCasilla(w, h, k);
        if (k === 0) g.moveTo(p.x, p.y);
        else g.lineTo(p.x, p.y);
      }
      g.stroke();
      g.setLineDash([]);
      for (let k = 0; k <= 6; k += 1) {
        const p = posCasilla(w, h, k);
        const premio = k >= 4;
        const activa = k === casilla && k > 0;
        g.fillStyle = k === 0 ? '#e2e8f0' : premio ? '#fbbf24' : '#f8fafc';
        elipse(g, p.x, p.y, 20 + (activa ? 3 : 0), 11 + (activa ? 2 : 0));
        g.fill();
        g.strokeStyle = activa ? '#f97316' : 'rgba(15,23,42,0.25)';
        g.lineWidth = activa ? 3 : 1.5;
        g.stroke();
        texto(g, k === 0 ? 'SALIDA' : String(k), p.x, p.y, k === 0 ? 8 : 11, '#0f172a', 'center', 'rgba(0,0,0,0)');
        if (premio) {
          g.fillStyle = '#fde047';
          estrella(g, p.x, p.y - 22, 6, 2.6, t);
          g.fill();
        }
      }
      // cofre en la meta
      const meta = posCasilla(w, h, 6);
      cofre(g, meta.x + 34, meta.y - 4, cofreAbierto);

      // ---------- Saltín
      const pa = posCasilla(w, h, desde);
      const pb = posCasilla(w, h, hacia);
      const e = easeOutCubic(saltoP);
      const fx0 = pa.x + (pb.x - pa.x) * e;
      const fy0 = pa.y + (pb.y - pa.y) * e - Math.sin(saltoP * Math.PI) * 26;
      rana(g, fx0, fy0 - 6, t, saltoP, tristeza > 0.2, estrellaVuela >= 0 && estrellaVuela < 1.6);

      // estrella que vuela al contador
      if (estrellaVuela >= 0 && estrellaVuela < 1.1) {
        const p = easeOutCubic(estrellaVuela / 1.1);
        const sx = meta.x + 34 + (w - 60 - meta.x - 34) * p;
        const sy = meta.y - 20 + (28 - meta.y + 20) * p - Math.sin(p * Math.PI) * 60;
        g.fillStyle = '#fde047';
        estrella(g, sx, sy, 14, 6, t * 6);
        g.fill();
      }

      // ---------- Dado
      if (dadoVisible) {
        const p = actual?.tipo === 'cae' ? easeOutBack(cola.progreso) : 1;
        const giro = lanzando ? t * 14 : 0;
        const cara = lanzando ? 1 + (Math.floor(t * 14) % 6) : caraDado;
        const dy = lanzando ? -Math.abs(Math.sin(t * 7)) * 22 : 0;
        dado(g, w * 0.5, h * 0.24 + dy, 22 * (lanzando ? 1 : 0.8 + 0.2 * p), cara, giro);
      }
      fx.dibujar(g);
      g.restore();

      // ---------- HUD
      g.fillStyle = 'rgba(255,255,255,0.88)';
      rect(g, w - 84, 10, 74, 34, 17);
      g.fill();
      g.fillStyle = '#facc15';
      estrella(g, w - 64, 27, 10, 4.5, 0);
      g.fill();
      texto(g, `× ${estrellas}`, w - 40, 27, 15, '#78350f', 'center', 'rgba(0,0,0,0)');
      // bandera con el nombre del jugador
      g.fillStyle = '#ffffff';
      rect(g, 10, 10, 20 + Math.min(110, nombre.length * 8), 26, 8);
      g.fill();
      texto(g, `🚩 ${nombre}`, 18, 23, 12, '#0f172a', 'left', 'rgba(0,0,0,0)');
      // Meta del juego, siempre visible
      const anchoMeta = Math.min(w - 20, 230);
      g.fillStyle = 'rgba(255,255,255,0.9)';
      rect(g, w / 2 - anchoMeta / 2, h - 30, anchoMeta, 22, 11);
      g.fill();
      texto(g, 'Meta: llega al 4, 5 o 6 y gana ⭐', w / 2, h - 19, 11.5, '#78350f', 'center', 'rgba(0,0,0,0)');

      // Al terminar, el globo dice qué botón pulsar (el mismo nombre que tiene el botón).
      const terminado = final !== null && cola.pendientes === 0 && info.estado === 'inactivo' && mensajeT > 1.6;
      const turno = info.pregunta !== null && cola.pendientes === 0;
      const dice = turno
        ? '¡Te toca responder!'
        : terminado
          ? final === 'estrella'
            ? '¡Bien! Pulsa «Lanzar otra vez» ⭐'
            : 'Pulsa «Lanzar otra vez» 🎲'
          : mensaje;
      globo(g, dice, fx0, fy0 - 40, w * 0.92, turno || terminado ? 1 : clamp(mensajeT * 5), terminado ? '#fef9c3' : '#ffffff');
    },
  };
}

/** Las 7 posiciones del tablero (0 = salida) sobre un camino en S. */
function posCasilla(w: number, h: number, k: number) {
  const p = k / 6;
  return { x: w * (0.14 + p * 0.68), y: h * (0.72 - Math.sin(p * Math.PI * 1.5) * 0.1 - p * 0.06) };
}

function dado(g: CanvasRenderingContext2D, x: number, y: number, r: number, cara: number, giro: number) {
  g.save();
  g.translate(x, y);
  g.rotate(Math.sin(giro) * 0.5);
  sombra(g, 0, r * 2.2, r * 0.8, 0.2);
  g.fillStyle = '#ffffff';
  rect(g, -r, -r, r * 2, r * 2, r * 0.35);
  g.fill();
  g.strokeStyle = '#cbd5e1';
  g.lineWidth = 2;
  g.stroke();
  const puntos: Record<number, [number, number][]> = {
    1: [[0, 0]],
    2: [[-1, -1], [1, 1]],
    3: [[-1, -1], [0, 0], [1, 1]],
    4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
    6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
  };
  g.fillStyle = cara >= 4 ? '#dc2626' : '#1e293b';
  for (const [px, py] of puntos[cara] ?? puntos[1]) {
    g.beginPath();
    g.arc(px * r * 0.5, py * r * 0.5, r * 0.16, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}

function rana(g: CanvasRenderingContext2D, x: number, y: number, t: number, salto: number, triste: boolean, feliz: boolean) {
  const estirar = salto > 0 ? 1 + Math.sin(salto * Math.PI) * 0.2 : 1 + Math.sin(t * 3) * 0.03;
  const alegre = feliz ? Math.abs(Math.sin(t * 9)) * 6 : 0;
  g.save();
  g.translate(x, y - alegre);
  sombra(g, 0, 8 + alegre, 16, 0.2);
  g.scale(1 / estirar, estirar);
  g.fillStyle = '#22c55e';
  elipse(g, 0, -6, 18, 14);
  g.fill();
  g.fillStyle = '#bbf7d0';
  elipse(g, 0, -2, 11, 8);
  g.fill();
  // patas
  g.fillStyle = '#16a34a';
  elipse(g, -14, 4, 7, 4);
  g.fill();
  elipse(g, 14, 4, 7, 4);
  g.fill();
  // ojos saltones
  g.fillStyle = '#22c55e';
  g.beginPath();
  g.arc(-8, -19, 7, 0, Math.PI * 2);
  g.arc(8, -19, 7, 0, Math.PI * 2);
  g.fill();
  ojos(g, 0, -19, 8, 4.2, t + 0.7, 0.3, false);
  g.strokeStyle = '#14532d';
  g.lineWidth = 2;
  g.lineCap = 'round';
  g.beginPath();
  if (triste) g.arc(0, 0, 6, 1.2 * Math.PI, 1.8 * Math.PI);
  else g.arc(0, -8, 7, 0.15 * Math.PI, 0.85 * Math.PI);
  g.stroke();
  // corona de hojas
  g.fillStyle = '#facc15';
  estrella(g, 0, -27, 5, 2.2, 0);
  g.fill();
  g.restore();
}

function cofre(g: CanvasRenderingContext2D, x: number, y: number, abierto: number) {
  g.save();
  g.translate(x, y);
  g.fillStyle = '#92400e';
  rect(g, -16, -12, 32, 18, 3);
  g.fill();
  g.fillStyle = '#facc15';
  g.fillRect(-2, -10, 4, 8);
  // tapa
  g.save();
  g.translate(-16, -12);
  g.rotate(-abierto * 1.1);
  g.fillStyle = '#b45309';
  rect(g, 0, -10, 32, 11, 4);
  g.fill();
  g.restore();
  if (abierto > 0.3) {
    g.globalAlpha = abierto;
    g.fillStyle = 'rgba(253,224,71,0.5)';
    elipse(g, 0, -16, 18, 12);
    g.fill();
    g.globalAlpha = 1;
  }
  g.restore();
}

function palmera(g: CanvasRenderingContext2D, x: number, y: number, t: number, lado: number) {
  g.strokeStyle = '#92400e';
  g.lineWidth = 6;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(x, y);
  g.quadraticCurveTo(x + lado * 8, y - 30, x + lado * 4, y - 58);
  g.stroke();
  g.fillStyle = '#16a34a';
  for (let i = 0; i < 5; i += 1) {
    const a = -Math.PI / 2 + (i - 2) * 0.6 + Math.sin(t * 1.5 + i) * 0.06;
    g.save();
    g.translate(x + lado * 4, y - 58);
    g.rotate(a);
    elipse(g, 18, 0, 20, 5);
    g.fill();
    g.restore();
  }
}
