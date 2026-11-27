/**
 * Duelo RPG: la caballera Kira contra el Slime Rey, por turnos.
 * Reacciona a: "apareció", "Rayo Chispa", "Llamarada", "Poción", "contraataca",
 * los números de daño que imprime el programa y el final (victoria o derrota).
 */

import {
  Camara,
  Cola,
  Particulas,
  barra,
  clamp,
  degradado,
  easeInOut,
  easeOutBack,
  easeOutCubic,
  elipse,
  numVar,
  ojos,
  rect,
  rebote,
  seguir,
  sombra,
  soloNumero,
  texto,
  type Juego,
} from './motor';

type Paso =
  | { tipo: 'aparece' }
  | { tipo: 'ataque'; clase: 'rayo' | 'fuego' }
  | { tipo: 'pocion' }
  | { tipo: 'contra' }
  | { tipo: 'danio'; a: 'rival' | 'heroe'; n: number }
  | { tipo: 'mensaje'; s: string }
  | { tipo: 'final'; gano: boolean };

export function crearRpg(): Juego {
  const cola = new Cola<Paso>();
  const fx = new Particulas();
  const cam = new Camara();
  let vidaHeroe = 100;
  let vidaRival = 80;
  let maxHeroe = 100;
  let maxRival = 80;
  let barraHeroe = 1;
  let barraRival = 1;
  let ultimoAtaque: 'rayo' | 'fuego' | 'pocion' | 'contra' | null = null;
  let golpeRival = 0; // destello al recibir daño
  let golpeHeroe = 0;
  let aparecido = 0;
  let final: 'nada' | 'victoria' | 'derrota' = 'nada';
  let tiempoFinal = 0;
  let mensaje = '¡Pulsa Jugar para empezar el duelo!';
  let numeros: { x: number; y: number; s: string; color: string; vida: number }[] = [];
  let leidoInicio = false;

  const reiniciar = () => {
    cola.vaciar();
    fx.lista = [];
    vidaHeroe = maxHeroe = 100;
    vidaRival = maxRival = 80;
    barraHeroe = barraRival = 1;
    ultimoAtaque = null;
    golpeRival = golpeHeroe = 0;
    aparecido = 0;
    final = 'nada';
    tiempoFinal = 0;
    numeros = [];
    leidoInicio = false;
    mensaje = 'Preparando el duelo…';
  };

  return {
    reiniciar,
    alEvento(clase, s, info) {
      const txt = s.toLowerCase();
      if (!leidoInicio) {
        maxHeroe = vidaHeroe = Math.max(1, numVar(info.variables, ['vida_heroe'], 100));
        maxRival = vidaRival = Math.max(1, numVar(info.variables, ['vida_rival'], 80));
        leidoInicio = true;
      }
      if (clase === 'respuesta') {
        const n = s.trim();
        cola.agregar({ tipo: 'mensaje', s: n === '1' ? 'Kira prepara el Rayo Chispa…' : n === '2' ? 'Kira concentra la Llamarada…' : n === '3' ? 'Kira saca una poción…' : `Kira eligió ${s}` }, 0.5);
        return;
      }
      if (clase !== 'salida' || txt.includes('|')) return;
      const n = soloNumero(s);
      if (n !== null) {
        if (ultimoAtaque === 'rayo' || ultimoAtaque === 'fuego') cola.agregar({ tipo: 'danio', a: 'rival', n }, 0.7);
        else if (ultimoAtaque === 'contra') cola.agregar({ tipo: 'danio', a: 'heroe', n }, 0.7);
        return;
      }
      if (/apareci/.test(txt)) cola.agregar({ tipo: 'aparece' }, 1.2);
      else if (/rayo/.test(txt)) {
        ultimoAtaque = 'rayo';
        cola.agregar({ tipo: 'ataque', clase: 'rayo' }, 0.9);
      } else if (/llamarada|fuego/.test(txt)) {
        ultimoAtaque = 'fuego';
        cola.agregar({ tipo: 'ataque', clase: 'fuego' }, 1.0);
      } else if (/poci/.test(txt)) {
        ultimoAtaque = 'pocion';
        cola.agregar({ tipo: 'pocion' }, 1.1);
      } else if (/contraataca/.test(txt)) {
        ultimoAtaque = 'contra';
        cola.agregar({ tipo: 'contra' }, 0.9);
      } else if (/victoria|derrotaste/.test(txt)) cola.agregar({ tipo: 'final', gano: true }, 0.1);
      else if (/buen combate|perdiste/.test(txt)) cola.agregar({ tipo: 'final', gano: false }, 0.1);
      if (!/rayo|llamarada|poci|contraataca/.test(txt)) cola.agregar({ tipo: 'mensaje', s }, 0.6);
    },

    dibujar(g, w, h, dt, t, info) {
      const paso = cola.avanzar(dt, info.reducido);
      // Posiciones (estilo combate por turnos: rival arriba a la derecha, héroe abajo a la izquierda)
      const hx = w * 0.27;
      const hy = h * 0.74;
      const rx = w * 0.72;
      const ry = h * 0.4;

      if (paso) {
        if (paso.tipo === 'aparece') {
          aparecido = 0.001;
          mensaje = '¡Un Slime Rey salvaje apareció!';
        } else if (paso.tipo === 'ataque') {
          mensaje = paso.clase === 'rayo' ? '¡Kira usó Rayo Chispa!' : '¡Kira lanzó una Llamarada!';
        } else if (paso.tipo === 'pocion') {
          // La poción cura hasta 25, pero nunca por encima de la vida máxima.
          const curado = Math.max(0, Math.min(25, maxHeroe - vidaHeroe));
          vidaHeroe += curado;
          mensaje = curado > 0 ? `¡Poción mágica! Kira recupera ${curado} de vida` : '¡Kira ya tiene la vida llena!';
          fx.estallar(hx, hy - 40, 22, ['#4ade80', '#bbf7d0', '#22c55e'], { gravedad: -120, fuerza: 70, forma: 'chispa' });
          numeros.push({ x: hx, y: hy - 80, s: curado > 0 ? `+${curado}` : 'MÁX', color: '#4ade80', vida: 0 });
        } else if (paso.tipo === 'contra') {
          mensaje = '¡El Slime Rey contraataca!';
        } else if (paso.tipo === 'danio') {
          if (paso.a === 'rival') {
            vidaRival -= paso.n;
            golpeRival = 1;
            cam.sacudir(0.45);
            fx.estallar(rx, ry - 30, 18, ['#fde047', '#ffffff', '#86efac'], { fuerza: 190 });
            numeros.push({ x: rx + 10, y: ry - 70, s: `-${paso.n}`, color: '#fde047', vida: 0 });
          } else {
            vidaHeroe -= paso.n;
            golpeHeroe = 1;
            cam.sacudir(0.5);
            fx.estallar(hx, hy - 30, 14, ['#4ade80', '#16a34a'], { fuerza: 160, forma: 'circulo' });
            numeros.push({ x: hx, y: hy - 75, s: `-${paso.n}`, color: '#f87171', vida: 0 });
          }
        } else if (paso.tipo === 'mensaje') {
          mensaje = paso.s;
        } else if (paso.tipo === 'final') {
          final = paso.gano ? 'victoria' : 'derrota';
          tiempoFinal = 0;
          mensaje = paso.gano ? '¡Victoria! Derrotaste al Slime Rey' : '¡Buen combate! Ajusta tu estrategia y vuelve a intentar';
          if (paso.gano) fx.estallar(w / 2, h * 0.35, 60, ['#fde047', info.acento, '#f472b6', '#38bdf8'], { fuerza: 260 });
        }
      }

      // Al terminar todo, sincroniza con los valores reales del programa.
      if (cola.pendientes === 0 && info.estado === 'inactivo' && leidoInicio) {
        vidaHeroe = Math.min(maxHeroe, numVar(info.variables, ['vida_heroe'], vidaHeroe));
        vidaRival = Math.min(maxRival, numVar(info.variables, ['vida_rival'], vidaRival));
      }
      barraHeroe = seguir(barraHeroe, clamp(vidaHeroe / maxHeroe), dt, 5);
      barraRival = seguir(barraRival, clamp(vidaRival / maxRival), dt, 5);
      golpeRival = Math.max(0, golpeRival - dt * 2.5);
      golpeHeroe = Math.max(0, golpeHeroe - dt * 2.5);
      if (aparecido > 0) aparecido = Math.min(1, aparecido + dt * 1.2);
      if (final !== 'nada') tiempoFinal += dt;
      fx.actualizar(dt);

      g.save();
      cam.aplicar(g, dt, info.reducido);

      // ---------- Fondo: atardecer en la pradera
      g.fillStyle = degradado(g, 0, h, [[0, '#ff9e7a'], [0.35, '#ffcf8f'], [0.62, '#bde6c0'], [1, '#5fb36b']]);
      g.fillRect(-10, -10, w + 20, h + 20);
      g.fillStyle = 'rgba(255,255,255,0.55)';
      for (let i = 0; i < 4; i += 1) {
        const cx = ((i * 0.31 + t * 0.008 * (i + 1)) % 1.3) * w - w * 0.15;
        elipse(g, cx, 26 + i * 13, 34 + i * 6, 9);
        g.fill();
      }
      // Montañas
      g.fillStyle = '#7fb59a';
      g.beginPath();
      g.moveTo(0, h * 0.6);
      for (let x = 0; x <= w; x += w / 8) g.lineTo(x, h * 0.6 - (Math.sin(x * 0.02) + 1.3) * 22);
      g.lineTo(w, h * 0.62);
      g.lineTo(0, h * 0.62);
      g.fill();
      // Plataformas
      g.fillStyle = '#4f9d5d';
      elipse(g, rx, ry + 6, 74, 17);
      g.fill();
      g.fillStyle = '#6cc07a';
      elipse(g, rx, ry + 2, 70, 14);
      g.fill();
      g.fillStyle = '#4f9d5d';
      elipse(g, hx, hy + 8, 84, 19);
      g.fill();
      g.fillStyle = '#6cc07a';
      elipse(g, hx, hy + 4, 80, 16);
      g.fill();

      // ---------- Slime Rey
      const actual = cola.actual?.datos;
      const prog = cola.progreso;
      let sx = rx;
      let sy = ry;
      if (actual?.tipo === 'contra') {
        // salta en arco hacia Kira y vuelve
        const ida = prog < 0.5 ? easeInOut(prog * 2) : easeInOut((1 - prog) * 2);
        sx = rx + (hx + 40 - rx) * ida * 0.7;
        sy = ry + (hy - ry) * ida * 0.7 - Math.sin(ida * Math.PI) * 40;
      }
      const entrada = aparecido === 0 ? 0 : easeOutBack(aparecido);
      if (aparecido > 0) dibujarSlime(g, sx, sy, t, golpeRival, final === 'victoria' ? Math.min(1, tiempoFinal * 0.8) : 0, entrada, h);

      // ---------- Kira
      let kx = hx;
      let lanza = 0;
      if (actual?.tipo === 'ataque') lanza = rebote(prog);
      kx += lanza * 26;
      const derrotada = final === 'derrota' ? Math.min(1, tiempoFinal * 1.5) : 0;
      dibujarKira(g, kx, hy, t, golpeHeroe, derrotada, actual?.tipo === 'pocion' ? prog : 0, info.acento);

      // ---------- Proyectiles
      if (actual?.tipo === 'ataque') {
        const p = easeOutCubic(clamp((prog - 0.15) / 0.6));
        if (actual.clase === 'rayo' && prog > 0.15 && prog < 0.8) {
          rayo(g, kx + 22, hy - 40, rx - 10, ry - 28, t);
        }
        if (actual.clase === 'fuego' && prog > 0.1 && prog < 0.85) {
          const fxp = kx + 25 + (rx - kx - 25) * p;
          const fyp = hy - 45 + (ry - 30 - (hy - 45)) * p - Math.sin(p * Math.PI) * 45;
          for (let i = 0; i < 3; i += 1) fx.emitir(fxp, fyp, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, i ? '#fb923c' : '#fde047', 5 + Math.random() * 4, 0.35);
          g.fillStyle = '#fff7ed';
          elipse(g, fxp, fyp, 9, 9);
          g.fill();
          g.fillStyle = '#f97316';
          elipse(g, fxp, fyp, 13, 13);
          g.globalAlpha = 0.5;
          g.fill();
          g.globalAlpha = 1;
        }
      }
      fx.dibujar(g);

      // ---------- Números de daño
      for (const n of numeros) {
        n.vida += dt;
        const e = easeOutBack(clamp(n.vida * 3));
        g.globalAlpha = clamp(2 - n.vida * 1.4);
        texto(g, n.s, n.x, n.y - n.vida * 26, 18 + e * 8, n.color);
      }
      g.globalAlpha = 1;
      numeros = numeros.filter((n) => n.vida < 1.5);
      g.restore();

      // ---------- Paneles de vida (fijos, sin sacudida)
      panelVida(g, 12, 12, 'Slime Rey', 'Nv. 9', barraRival, Math.max(0, Math.round(vidaRival)), maxRival);
      panelVida(g, Math.max(12, w - 198), h * 0.57, 'Kira', 'Nv. 7', barraHeroe, Math.max(0, Math.round(vidaHeroe)), maxHeroe);

      // ---------- Cuadro de mensaje
      const mh = 34;
      g.fillStyle = 'rgba(15,23,42,0.82)';
      rect(g, 10, h - mh - 8, w - 20, mh, 10);
      g.fill();
      g.strokeStyle = 'rgba(255,255,255,0.65)';
      g.lineWidth = 2;
      rect(g, 13, h - mh - 5, w - 26, mh - 6, 8);
      g.stroke();
      const esTurno = info.pregunta !== null && cola.pendientes === 0;
      texto(g, esTurno ? '¿Qué hará Kira? Elige 1, 2 o 3 ▼' : mensaje, 24, h - mh / 2 - 8, 13.5, esTurno ? '#fde047' : '#ffffff', 'left', 'rgba(0,0,0,0)');

      if (final !== 'nada' && cola.pendientes === 0) {
        const e = easeOutBack(clamp(tiempoFinal * 2));
        g.save();
        g.translate(w / 2, h * 0.32);
        g.scale(e, e);
        texto(g, final === 'victoria' ? '¡VICTORIA!' : '¡OTRA VEZ!', 0, 0, 34, final === 'victoria' ? '#fde047' : '#fca5a5');
        g.restore();
      }
    },
  };
}

function panelVida(g: CanvasRenderingContext2D, x: number, y: number, nombre: string, nivel: string, p: number, vida: number, max: number) {
  const ancho = 186;
  const etiquetaVida = `${vida}/${max}`;
  g.fillStyle = 'rgba(255,251,235,0.94)';
  rect(g, x, y, ancho, 44, 10);
  g.fill();
  g.strokeStyle = '#78350f';
  g.lineWidth = 2;
  g.stroke();
  texto(g, nombre, x + 10, y + 13, 13, '#1f2937', 'left', 'rgba(0,0,0,0)');
  texto(g, nivel, x + ancho - 10, y + 13, 11, '#92400e', 'right', 'rgba(0,0,0,0)');
  const color = p > 0.5 ? '#22c55e' : p > 0.22 ? '#f59e0b' : '#ef4444';
  g.save();
  g.font = '700 11px "Fredoka", "Plus Jakarta Sans", system-ui, sans-serif';
  const espacioTexto = Math.max(52, Math.ceil(g.measureText(etiquetaVida).width) + 10);
  g.restore();
  const anchoBarra = Math.max(68, ancho - 20 - espacioTexto);
  barra(g, x + 10, y + 24, anchoBarra, 11, p, color, '#334155');
  texto(g, etiquetaVida, x + ancho - 10, y + 30, 11, '#1f2937', 'right', 'rgba(0,0,0,0)');
}

function rayo(g: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, t: number) {
  g.save();
  g.strokeStyle = '#e0f2fe';
  g.shadowColor = '#38bdf8';
  g.shadowBlur = 16;
  g.lineWidth = 4;
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(x0, y0);
  const pasos = 7;
  for (let i = 1; i < pasos; i += 1) {
    const p = i / pasos;
    const j = Math.sin(t * 60 + i * 2.3) * 14;
    g.lineTo(x0 + (x1 - x0) * p + j * 0.4, y0 + (y1 - y0) * p + j);
  }
  g.lineTo(x1, y1);
  g.stroke();
  g.lineWidth = 1.5;
  g.strokeStyle = '#ffffff';
  g.stroke();
  g.restore();
}

function dibujarKira(g: CanvasRenderingContext2D, x: number, y: number, t: number, golpe: number, derrota: number, pocion: number, acento: string) {
  const bob = Math.sin(t * 3) * 2;
  const retro = golpe > 0 ? -golpe * 12 : 0;
  g.save();
  g.translate(x + retro, y + bob + derrota * 10);
  g.rotate(-derrota * 0.35);
  sombra(g, 0, 4 - bob, 26, 0.22);
  // capa
  g.fillStyle = acento;
  g.beginPath();
  g.moveTo(-14, -42);
  g.quadraticCurveTo(-30 + Math.sin(t * 4) * 3, -14, -22, 0);
  g.lineTo(6, 0);
  g.closePath();
  g.fill();
  // cuerpo (armadura)
  g.fillStyle = golpe > 0.5 ? '#ffffff' : '#cbd5e1';
  rect(g, -16, -44, 32, 40, 12);
  g.fill();
  g.fillStyle = '#94a3b8';
  rect(g, -16, -22, 32, 6, 3);
  g.fill();
  // piernas
  g.fillStyle = '#475569';
  rect(g, -12, -6, 9, 10, 3);
  g.fill();
  rect(g, 3, -6, 9, 10, 3);
  g.fill();
  // escudo
  g.fillStyle = '#2563eb';
  g.beginPath();
  g.moveTo(-26, -36);
  g.lineTo(-10, -36);
  g.lineTo(-10, -20);
  g.quadraticCurveTo(-18, -10, -18, -10);
  g.quadraticCurveTo(-26, -18, -26, -20);
  g.closePath();
  g.fill();
  g.fillStyle = '#fde047';
  g.beginPath();
  g.arc(-18, -26, 3, 0, Math.PI * 2);
  g.fill();
  // espada
  g.save();
  g.translate(16, -30);
  g.rotate(-0.6 + Math.sin(t * 3) * 0.05);
  g.fillStyle = '#e2e8f0';
  rect(g, -2, -30, 5, 30, 2);
  g.fill();
  g.fillStyle = '#a16207';
  rect(g, -7, -2, 15, 4, 2);
  g.fill();
  g.restore();
  // casco
  g.fillStyle = golpe > 0.5 ? '#ffffff' : '#e2e8f0';
  g.beginPath();
  g.arc(0, -56, 17, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#1e293b';
  rect(g, -11, -60, 22, 9, 4);
  g.fill();
  ojos(g, 0, -55.5, 5, 2.6, t, 1, derrota > 0.5);
  // penacho
  g.fillStyle = '#ef4444';
  g.beginPath();
  g.moveTo(0, -72);
  g.quadraticCurveTo(-18 + Math.sin(t * 5) * 3, -82, -24, -64);
  g.quadraticCurveTo(-10, -70, 0, -70);
  g.fill();
  // poción en la mano
  if (pocion > 0 && pocion < 0.9) {
    g.fillStyle = '#4ade80';
    rect(g, 18, -52 - pocion * 10, 10, 13, 4);
    g.fill();
    g.fillStyle = '#e2e8f0';
    rect(g, 20, -56 - pocion * 10, 6, 5, 2);
    g.fill();
    g.globalAlpha = 0.35 * Math.sin(pocion * Math.PI);
    g.fillStyle = '#4ade80';
    elipse(g, 0, -36, 40, 50);
    g.fill();
    g.globalAlpha = 1;
  }
  g.restore();
}

function dibujarSlime(g: CanvasRenderingContext2D, x: number, y: number, t: number, golpe: number, derretir: number, entrada: number, h: number) {
  const caer = (1 - entrada) * -h * 0.6;
  const resp = Math.sin(t * 4) * 0.06;
  const estirar = 1 + resp + golpe * 0.25;
  const ancho = 46 * (1 - resp * 0.8 + golpe * 0.15) * (1 + derretir * 0.6);
  const alto = 40 * estirar * (1 - derretir * 0.85);
  g.save();
  g.translate(x + (golpe > 0 ? (Math.random() - 0.5) * 8 * golpe : 0), y + caer);
  sombra(g, 0, 2, ancho * 0.9, 0.2);
  const cuerpo = golpe > 0.55 ? '#f0fdf4' : '#22c55e';
  g.fillStyle = cuerpo;
  g.beginPath();
  g.moveTo(-ancho, 0);
  g.bezierCurveTo(-ancho, -alto * 1.25, ancho, -alto * 1.25, ancho, 0);
  g.quadraticCurveTo(0, 6, -ancho, 0);
  g.fill();
  g.fillStyle = 'rgba(255,255,255,0.35)';
  elipse(g, -ancho * 0.4, -alto * 0.75, ancho * 0.2, alto * 0.12);
  g.fill();
  if (derretir < 0.7) {
    ojos(g, 0, -alto * 0.55, 13, 6, t + 1.3, -1, golpe > 0.4);
    g.strokeStyle = '#14532d';
    g.lineWidth = 2.5;
    g.lineCap = 'round';
    g.beginPath();
    g.arc(0, -alto * 0.3, 7, 0.15 * Math.PI, 0.85 * Math.PI);
    g.stroke();
  }
  // corona (cae al ser derrotado)
  g.save();
  g.translate(derretir * 34, -alto * 1.0 - 8 + derretir * 46);
  g.rotate(derretir * 1.8);
  g.fillStyle = '#facc15';
  g.beginPath();
  g.moveTo(-15, 0);
  g.lineTo(-15, -14);
  g.lineTo(-8, -6);
  g.lineTo(0, -17);
  g.lineTo(8, -6);
  g.lineTo(15, -14);
  g.lineTo(15, 0);
  g.closePath();
  g.fill();
  g.fillStyle = '#ef4444';
  g.beginPath();
  g.arc(0, -4, 3, 0, Math.PI * 2);
  g.fill();
  g.restore();
  g.restore();
}
