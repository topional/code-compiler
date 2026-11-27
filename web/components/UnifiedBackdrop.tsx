import React, { useEffect, useRef, useState } from 'react';

import { obtenerTema, TEMAS_VALIDOS, type TemaId } from '../data/temas';
import {
  crearEstadoNaturaleza,
  dibujarEstanqueKoi,
  dibujarPraderaLuciernagas,
  registrarToqueNaturaleza,
} from './worlds/natureWorlds';
import {
  crearEstadoHorizonte,
  dibujarAcropolisEstelar,
  dibujarCosmos,
  dibujarLluviaNeon,
  dibujarMontanasVector,
  registrarToqueHorizonte,
} from './worlds/skylineWorlds';
import { hexARgb, type ModoFondoContinuo, type WorldTap } from './worlds/types';

export type { ModoFondoContinuo };

interface UnifiedBackdropProps {
  tema: TemaId;
  modo: ModoFondoContinuo;
  desactivarAnimacion: boolean;
}

const INTERACTIVE_SKIP_SELECTOR =
  'button, a, input, textarea, select, label, dialog, [role="tab"], [role="button"], .lp-hero-panel, .lp-code-ticker, .lp-pipe-source, .lp-bento-card, .lp-stage-card, .lp-xp-bar-card, .lp-closing-card, .lp-nav';

/**
 * Lienzo vivo ÚNICO, CONTINUO e INTERACTIVO detrás de toda la página (`position: fixed; inset: 0`).
 * Cero línea divisoria entre portada y contenido inferior.
 * Seis mundos programados a código con arquitectura modular, capas de profundidad y toque exclusivo:
 *  1. koi         → Estanque Koi con 3 peces articulados, nenúfares con loto y ondas que los atraen.
 *  2. luciernagas → Pradera con arco Torii, luciérnagas Boids con estelas y faroles flotantes.
 *  3. cosmos      → Galaxia espiral + Agujero Negro Gargantua con lente gravitacional y meteoros.
 *  4. vector      → Montañas 3D en malla wireframe cruzada con sol retro y sonar sísmico 3D.
 *  5. lluvia      → Metrópolis neón de 2 capas con cables de datos y gotas en cristal.
 *  6. acropolis   → Partenón griego bajo Vía Láctea, constelaciones doradas y estrella fugaz.
 */
export const UnifiedBackdrop: React.FC<UnifiedBackdropProps> = ({
  tema,
  modo,
  desactivarAnimacion,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [domTema, setDomTema] = useState<TemaId>(tema);
  const [tapCount, setTapCount] = useState(0);

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
  const esAltoContraste = temaMeta.grupo === 'Accesibilidad';
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
    const [pR, pG, pB] = hexARgb(temaMeta.muestras[2]);
    const [sR, sG, sB] = hexARgb(temaMeta.muestras[3]);
    const pal = { bgR, bgG, bgB, pR, pG, pB, sR, sG, sB, esClaro };

    let ancho = 0;
    let alto = 0;
    let rafId = 0;
    let tiempo = 0;
    const mouse = { x: 0.72, y: 0.35, tx: 0.72, ty: 0.35 };
    const taps: WorldTap[] = [];

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

    const natureState = crearEstadoNaturaleza(ancho, alto);
    const skylineState = crearEstadoHorizonte();

    const onMove = (e: MouseEvent) => {
      mouse.tx = e.clientX / Math.max(1, ancho);
      mouse.ty = e.clientY / Math.max(1, alto);
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    const podarTaps = (vidaMax: number) => {
      for (let i = taps.length - 1; i >= 0; i -= 1) {
        if (tiempo - taps[i].born > vidaMax) taps.splice(i, 1);
      }
    };

    const renderFrame = () => {
      switch (modo) {
        case 'koi':
          podarTaps(2.6);
          dibujarEstanqueKoi(ctx, ancho, alto, tiempo, pal, taps, natureState, mouse, desactivarAnimacion);
          break;
        case 'luciernagas':
          podarTaps(3.2);
          dibujarPraderaLuciernagas(ctx, ancho, alto, tiempo, pal, taps, natureState, mouse, desactivarAnimacion);
          break;
        case 'cosmos':
          podarTaps(2.4);
          dibujarCosmos(ctx, ancho, alto, tiempo, pal, taps, skylineState, mouse);
          break;
        case 'vector':
          podarTaps(2.2);
          dibujarMontanasVector(ctx, ancho, alto, tiempo, pal, taps, skylineState, mouse);
          break;
        case 'lluvia':
          podarTaps(2.6);
          dibujarLluviaNeon(ctx, ancho, alto, tiempo, pal, taps, skylineState, desactivarAnimacion);
          break;
        case 'acropolis':
          podarTaps(2.5);
          dibujarAcropolisEstelar(ctx, ancho, alto, tiempo, pal, taps, skylineState);
          break;
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (e.target instanceof Element && e.target.closest(INTERACTIVE_SKIP_SELECTOR)) return;
      taps.push({
        x: e.clientX,
        y: e.clientY,
        born: tiempo,
        seed: (e.clientX * 0.013 + e.clientY * 0.017 + taps.length * 1.618) % 6.283,
      });
      if (taps.length > 8) taps.shift();
      registrarToqueNaturaleza(modo, natureState, e.clientX, e.clientY, tiempo);
      registrarToqueHorizonte(modo, skylineState, e.clientX, e.clientY, tiempo);
      setTapCount((n) => n + 1);
      if (desactivarAnimacion) {
        renderFrame();
      }
    };
    window.addEventListener('pointerdown', onPointerDown, { passive: true });

    const loop = () => {
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      if (!desactivarAnimacion) {
        tiempo += 0.016;
      }

      renderFrame();

      if (!desactivarAnimacion) {
        rafId = window.requestAnimationFrame(loop);
      }
    };

    loop();

    const onScrollStatic = () => {
      if (desactivarAnimacion) renderFrame();
    };
    window.addEventListener('scroll', onScrollStatic, { passive: true });

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', redimensionar);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', onScrollStatic);
    };
  }, [desactivarAnimacion, esAltoContraste, esClaro, modo, temaMeta]);

  return (
    <div
      className="unified-backdrop-layer"
      data-backdrop-mode={modo}
      data-tap-count={tapCount}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="unified-backdrop-canvas" />
    </div>
  );
};
