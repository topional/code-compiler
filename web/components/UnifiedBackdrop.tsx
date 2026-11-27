import React, { useEffect, useRef, useState } from 'react';

import { obtenerTema, TEMAS_VALIDOS, type TemaId } from '../data/temas';

export type ModoFondoContinuo = 'halftone' | 'plotter' | 'braille';

interface UnifiedBackdropProps {
  tema: TemaId;
  modo: ModoFondoContinuo;
  desactivarAnimacion: boolean;
}

function hexARgb(hex: string): [number, number, number] {
  const limpio = hex.replace('#', '');
  const full =
    limpio.length === 3
      ? limpio
          .split('')
          .map((c) => c + c)
          .join('')
      : limpio;
  const n = Number.parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const BRAILLE_STEPS = ['⠁', '⠂', '⠄', '⡀', '⢀', '⠠', '⠐', '⠰', '⠛', '⠿'];

/**
 * Fondo generativo ÚNICO y CONTINUO detrás de toda la página (`position: fixed; inset: 0`).
 * Cero línea divisoria entre el hero y el contenido inferior: todo se superpone sobre este lienzo.
 * Inspirado en las escenas de `buildwithclaude.com/themes` (Halftone Dawn/Dusk, Plotter Tide y Braille Starfield)
 * y adaptado automáticamente tanto a los temas claros como a los oscuros.
 */
export const UnifiedBackdrop: React.FC<UnifiedBackdropProps> = ({
  tema,
  modo,
  desactivarAnimacion,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [domTema, setDomTema] = useState<TemaId>(tema);

  useEffect(() => {
    setDomTema(tema);
  }, [tema]);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => {
      const attr = root.getAttribute('data-theme');
      if (attr && TEMAS_VALIDOS.has(attr)) {
        setDomTema(attr as TemaId);
      }
    };
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  const temaMeta = obtenerTema(domTema);
  const esAltoContraste = domTema === 'high-contrast';
  const esClaro = temaMeta.grupo === 'Claros';

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (esAltoContraste) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const [bgR, bgG, bgB] = hexARgb(temaMeta.muestras[0]);
    const [pR, pG, pB] = hexARgb(temaMeta.muestras[2]); // Color 3 (principal)
    const [sR, sG, sB] = hexARgb(temaMeta.muestras[3]); // Color 4 (secundario)

    let ancho = 0;
    let alto = 0;
    let rafId = 0;
    let tiempo = 0;
    const mouse = { x: 0.72, y: 0.35, tx: 0.72, ty: 0.35 };

    const redimensionar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      ancho = window.innerWidth;
      alto = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(ancho * dpr));
      canvas.height = Math.max(1, Math.floor(alto * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    redimensionar();
    window.addEventListener('resize', redimensionar);

    const onMove = (e: MouseEvent) => {
      mouse.tx = e.clientX / Math.max(1, ancho);
      mouse.ty = e.clientY / Math.max(1, alto);
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    // Estrellas Braille pre-generadas
    const celdasBraille = Array.from({ length: 135 }, (_, i) => ({
      x: ((i * 73.13) % 100) / 100,
      y: ((i * 41.77) % 100) / 100,
      fase: i * 0.43,
      vel: 0.00018 + (i % 5) * 0.00005,
      esSecundario: i % 3 === 0,
    }));

    const dibujarHalftone = (t: number) => {
      // Base limpia del tema (Halftone Dawn en claros / Halftone Dusk en oscuros)
      ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
      ctx.fillRect(0, 0, ancho, alto);

      // Dos focos suaves que respiran despacio con sutil paralaje al cursor y scroll
      const scrollNorm = Math.min(1, window.scrollY / Math.max(1, document.documentElement.scrollHeight - alto));
      const f1x = ancho * (0.82 + (mouse.x - 0.5) * 0.06);
      const f1y = alto * (0.28 + scrollNorm * 0.36 + (mouse.y - 0.5) * 0.05);
      const r1 = Math.max(ancho, alto) * (0.44 + Math.sin(t * 0.45) * 0.03);

      const f2x = ancho * (0.14 - (mouse.x - 0.5) * 0.05);
      const f2y = alto * (0.86 - scrollNorm * 0.28);
      const r2 = Math.max(ancho, alto) * (0.42 + Math.cos(t * 0.38) * 0.03);

      // Halo atmosférico ultra suave
      const g1 = ctx.createRadialGradient(f1x, f1y, 0, f1x, f1y, r1);
      g1.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.14 : 0.16})`);
      g1.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, 0)`);
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, ancho, alto);

      const g2 = ctx.createRadialGradient(f2x, f2y, 0, f2x, f2y, r2);
      g2.addColorStop(0, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.12 : 0.14})`);
      g2.addColorStop(1, `rgba(${sR}, ${sG}, ${sB}, 0)`);
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, ancho, alto);

      // Matriz de puntos risográficos (Halftone Dawn / Dusk)
      const paso = ancho < 640 ? 22 : 18;
      const maxDot = paso * 0.34;

      for (let y = paso * 0.5; y < alto; y += paso) {
        for (let x = paso * 0.5; x < ancho; x += paso) {
          const d1 = Math.hypot(x - f1x, y - f1y) / r1;
          const d2 = Math.hypot(x - f2x, y - f2y) / r2;

          if (d1 < 1) {
            const onda = 0.85 + 0.15 * Math.sin(d1 * 7 - t * 1.15);
            const intensidad = Math.pow(1 - d1, 1.45) * onda;
            const radio = maxDot * intensidad;
            if (radio > 0.65) {
              ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.34 * intensidad : 0.42 * intensidad})`;
              ctx.beginPath();
              ctx.arc(x, y, radio, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          if (d2 < 1) {
            const onda2 = 0.85 + 0.15 * Math.cos(d2 * 6 - t * 0.95);
            const intensidad2 = Math.pow(1 - d2, 1.5) * onda2;
            const radio2 = maxDot * intensidad2;
            if (radio2 > 0.65) {
              ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.3 * intensidad2 : 0.38 * intensidad2})`;
              ctx.beginPath();
              ctx.arc(x + paso * 0.25, y + paso * 0.25, radio2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    };

    const dibujarPlotter = (t: number) => {
      ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
      ctx.fillRect(0, 0, ancho, alto);

      const scrollShift = window.scrollY * 0.18;
      const capas = 14;

      // Curvas topográficas de marea (Plotter Tide)
      for (let i = 0; i < capas; i += 1) {
        const progreso = i / (capas - 1);
        const esB = i % 2 === 1;
        const baseColor = esB ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;
        const alpha = (esClaro ? 0.13 : 0.16) + (1 - Math.abs(progreso - 0.5) * 2) * 0.1;

        ctx.strokeStyle = `rgba(${baseColor}, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.15;
        ctx.beginPath();

        const yBase = alto * (0.14 + progreso * 0.82);
        const pasosX = 48;
        for (let sx = 0; sx <= pasosX; sx += 1) {
          const u = sx / pasosX;
          const x = u * ancho;
          const distCursor = Math.hypot(u - mouse.x, yBase / Math.max(1, alto) - mouse.y);
          const empujon = Math.max(0, 1 - distCursor * 2.6) * 24;
          const y =
            yBase +
            Math.sin(u * 5.2 + t * 0.55 + i * 0.45) * 26 +
            Math.cos(u * 9.5 - t * 0.35 + scrollShift * 0.012 + i * 0.3) * 12 +
            empujon;
          if (sx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Anillos topográficos sutiles en esquina superior derecha (detalle pen-plotter)
      const cx = ancho * 0.88;
      const cy = alto * 0.16;
      for (let k = 1; k <= 5; k += 1) {
        const r = k * 24 + Math.sin(t * 0.7 + k) * 4;
        ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.16 : 0.2})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * 1.18, r * 0.72, 0.35, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const dibujarBraille = (t: number) => {
      ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
      ctx.fillRect(0, 0, ancho, alto);

      ctx.font = '600 15px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const mx = mouse.x * ancho;
      const my = mouse.y * alto;

      for (let i = 0; i < celdasBraille.length; i += 1) {
        const c = celdasBraille[i];
        const px = ((c.x + (desactivarAnimacion ? 0 : t * c.vel)) % 1) * ancho;
        const py = ((c.y + (desactivarAnimacion ? 0 : t * c.vel * 0.45)) % 1) * alto;
        const dist = Math.hypot(px - mx, py - my);
        const cerca = Math.max(0, 1 - dist / 190);
        const pulso = 0.5 + 0.5 * Math.sin(t * 1.2 + c.fase);
        const idxChar = Math.min(
          BRAILLE_STEPS.length - 1,
          Math.floor((pulso * 0.65 + cerca * 0.55) * BRAILLE_STEPS.length),
        );
        const alpha = (esClaro ? 0.2 : 0.24) + pulso * 0.18 + cerca * 0.42;
        const col = c.esSecundario ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;

        ctx.fillStyle = `rgba(${col}, ${Math.min(0.85, alpha).toFixed(3)})`;
        ctx.fillText(BRAILLE_STEPS[idxChar], px, py);
      }
    };

    const loop = () => {
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      if (!desactivarAnimacion) {
        tiempo += 0.016;
      }

      if (modo === 'halftone') dibujarHalftone(tiempo);
      else if (modo === 'plotter') dibujarPlotter(tiempo);
      else dibujarBraille(tiempo);

      if (!desactivarAnimacion) {
        rafId = window.requestAnimationFrame(loop);
      }
    };

    loop();

    const onScrollStatic = () => {
      if (desactivarAnimacion) loop();
    };
    window.addEventListener('scroll', onScrollStatic, { passive: true });

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', redimensionar);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', onScrollStatic);
    };
  }, [desactivarAnimacion, esAltoContraste, esClaro, modo, temaMeta]);

  return (
    <div className="unified-backdrop-layer" aria-hidden="true">
      <canvas ref={canvasRef} className="unified-backdrop-canvas" />
    </div>
  );
};
