/**
 * Mundo libre: Chispa dice en voz alta cada `mostrar` y las variables del
 * programa flotan como cajitas con su nombre y valor. Clic para moverla.
 */

import {
  Cola,
  Particulas,
  clamp,
  degradado,
  easeOutBack,
  elipse,
  estrella,
  globo,
  ojos,
  rect,
  seguir,
  sombra,
  texto,
  type Juego,
} from './motor';

type Paso = { tipo: 'decir'; s: string } | { tipo: 'error'; s: string };

export function crearLibre(): Juego {
  const cola = new Cola<Paso>();
  const fx = new Particulas();
  let x = 0.5;
  let metaX = 0.5;
  let salto = 0;
  let mensaje = 'Escribe tu código y pulsa Jugar';
  let mensajeT = 0;
  let error = 0;
  const aparicion = new Map<string, number>(); // variable → tiempo desde que cambió

  return {
    reiniciar() {
      cola.vaciar();
      aparicion.clear();
      error = 0;
      mensaje = '¡Vamos!';
      mensajeT = 0;
    },
    alEvento(clase, s) {
      if (clase === 'salida') cola.agregar({ tipo: 'decir', s }, 0.9);
      else if (clase === 'error') cola.agregar({ tipo: 'error', s }, 1.2);
    },
    alClic(nx) {
      metaX = clamp(nx, 0.12, 0.88);
      salto = 1;
    },

    dibujar(g, w, h, dt, t, info) {
      const paso = cola.avanzar(dt, info.reducido);
      if (paso) {
        mensaje = paso.s;
        mensajeT = 0;
        salto = 1;
        if (paso.tipo === 'error') error = 1;
        else fx.estallar(x * w, h * 0.6, 8, [info.acento, '#fde047', '#ffffff'], { fuerza: 90, forma: 'chispa' });
      }
      x = seguir(x, metaX, dt, 5);
      salto = Math.max(0, salto - dt * 2.4);
      error = Math.max(0, error - dt * 0.5);
      mensajeT += dt;
      for (const v of info.variables) {
        if (!aparicion.has(v.nombre) || v.cambioReciente) aparicion.set(v.nombre, v.cambioReciente ? 0 : aparicion.get(v.nombre) ?? 0);
      }
      for (const [k, v] of aparicion) aparicion.set(k, v + dt);
      fx.actualizar(dt);

      // ---------- Jardín
      g.fillStyle = degradado(g, 0, h, [[0, '#c4b5fd'], [0.55, '#fbcfe8'], [1, '#fde68a']]);
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#86efac';
      elipse(g, w * 0.25, h * 1.05, w * 0.45, h * 0.32);
      g.fill();
      g.fillStyle = '#4ade80';
      elipse(g, w * 0.78, h * 1.08, w * 0.5, h * 0.33);
      g.fill();
      for (let i = 0; i < 9; i += 1) {
        const fx0 = ((i * 0.13 + 0.05) % 1) * w;
        const fy0 = h * 0.86 + (i % 3) * 6;
        g.fillStyle = ['#f472b6', '#fde047', '#ffffff'][i % 3];
        estrella(g, fx0, fy0, 5, 2.5, t * 0.5 + i, 5);
        g.fill();
      }

      // ---------- Cajitas de variables
      const vars = info.variables.slice(0, 6);
      vars.forEach((v, i) => {
        const edad = aparicion.get(v.nombre) ?? 9;
        const e = easeOutBack(clamp(edad * 2.5));
        const bx = w * (0.12 + (i % 3) * 0.29);
        const by = h * (0.16 + Math.floor(i / 3) * 0.2) + Math.sin(t * 1.5 + i) * 3;
        const etiqueta = `${v.nombre} = ${v.valor === '' ? '∅' : v.valor}`;
        g.font = '700 11px "JetBrains Mono", monospace';
        const ancho = Math.min(w * 0.27, g.measureText(etiqueta).width + 18);
        g.save();
        g.translate(bx + ancho / 2, by);
        g.scale(e, e);
        g.fillStyle = edad < 0.6 ? '#fde047' : 'rgba(255,255,255,0.92)';
        rect(g, -ancho / 2, -12, ancho, 24, 8);
        g.fill();
        g.strokeStyle = '#7c3aed';
        g.lineWidth = 1.5;
        g.stroke();
        texto(g, etiqueta.length > 22 ? `${etiqueta.slice(0, 21)}…` : etiqueta, 0, 0, 11, '#3b0764', 'center', 'rgba(0,0,0,0)');
        g.restore();
      });

      // ---------- Chispa
      const cx = x * w;
      const cy = h * 0.68 - Math.sin(salto * Math.PI) * 22 + Math.sin(t * 2.5) * 3;
      sombra(g, cx, h * 0.8, 18, 0.18);
      g.save();
      g.translate(cx + (error > 0 ? Math.sin(t * 40) * 3 * error : 0), cy);
      const halo = g.createRadialGradient(0, 0, 4, 0, 0, 38);
      halo.addColorStop(0, 'rgba(253,224,71,0.6)');
      halo.addColorStop(1, 'rgba(253,224,71,0)');
      g.fillStyle = halo;
      g.beginPath();
      g.arc(0, 0, 38, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = error > 0.3 ? '#fca5a5' : info.acento || '#f59e0b';
      estrella(g, 0, 0, 26, 15, Math.sin(t * 1.5) * 0.15, 5);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.35)';
      estrella(g, -4, -5, 10, 6, 0, 5);
      g.fill();
      ojos(g, 0, -2, 7, 3.6, t, (metaX - x) * 8, false);
      g.strokeStyle = '#7c2d12';
      g.lineWidth = 2;
      g.lineCap = 'round';
      g.beginPath();
      if (error > 0.3) g.arc(0, 12, 5, 1.2 * Math.PI, 1.8 * Math.PI);
      else g.arc(0, 4, 5, 0.15 * Math.PI, 0.85 * Math.PI);
      g.stroke();
      g.restore();
      fx.dibujar(g);

      const turno = info.pregunta !== null && cola.pendientes === 0;
      globo(g, turno ? info.pregunta ?? '' : mensaje, cx, cy - 34, w * 0.6, turno ? 1 : clamp(mensajeT * 5), error > 0.3 ? '#fee2e2' : '#ffffff');
    },
  };
}
