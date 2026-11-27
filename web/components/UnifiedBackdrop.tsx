import React, { useEffect, useRef, useState } from 'react';

import { obtenerTema, TEMAS_VALIDOS, type TemaId } from '../data/temas';

export type ModoFondoContinuo =
  | 'halftone'
  | 'braille'
  | 'mosaico'
  | 'circuito'
  | 'tablero'
  | 'plano'
  | 'panal'
  | 'cristal'
  | 'aurora'
  | 'plotter'
  | 'estelas';

interface UnifiedBackdropProps {
  tema: TemaId;
  modo: ModoFondoContinuo;
  desactivarAnimacion: boolean;
}

interface TapEvent {
  x: number;
  y: number;
  born: number;
  seed: number;
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
const BOARD_GLYPHS = ['<', '✦', '>', '{', '}', '0', '1', '→', '#', 'λ', '+', '*', '/', '='];

const INTERACTIVE_SKIP_SELECTOR =
  'button, a, input, textarea, select, label, dialog, [role="tab"], [role="button"], .lp-hero-panel, .lp-code-ticker, .lp-pipe-source, .lp-bento-card, .lp-stage-card, .lp-xp-bar-card, .lp-closing-card, .lp-nav';

/**
 * Fondo generativo ÚNICO, CONTINUO e INTERACTIVO detrás de toda la página (`position: fixed; inset: 0`).
 * Cero línea divisoria entre portada y contenido inferior.
 * Cada uno de los 11 modos posee su propia estética y su animación exclusiva al tocar el fondo:
 *  1. halftone  → Onda risográfica que infla y alterna tintas en la matriz de puntos.
 *  2. braille   → Constelación interactiva: red estelar conectada a glifos Braille cercanos.
 *  3. mosaico   → Cascada pixel en diamante Manhattan sobre la cuadrícula estilo Koi Mosaic.
 *  4. circuito  → Pulso eléctrico PCB con pistas a 90°/45° y nodos de soldadura luminosos.
 *  5. tablero   → Volteo mecánico (Departure Board) con cascada de fichas de código.
 *  6. plano     → Compás técnico (Blueprint) con círculo punteado, ángulos y coordenadas (X, Y).
 *  7. panal     → Reacción en cadena por celdas hexagonales vecinas.
 *  8. cristal   → Refracción de prisma con fragmentos triangulares translúcidos y rayos.
 *  9. aurora    → Velos volumétricos sin líneas + destello nebuloso con brasas ascendentes.
 * 10. plotter   → Sello topográfico trazado en vivo (curvas de nivel + mira +).
 * 11. estelas   → Vórtice de cometas curvos con puntas ✦ siguiendo el campo vectorial.
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
    const [pR, pG, pB] = hexARgb(temaMeta.muestras[2]); // Color 3 (principal)
    const [sR, sG, sB] = hexARgb(temaMeta.muestras[3]); // Color 4 (secundario)

    let ancho = 0;
    let alto = 0;
    let rafId = 0;
    let tiempo = 0;
    const mouse = { x: 0.72, y: 0.35, tx: 0.72, ty: 0.35 };
    const taps: TapEvent[] = [];

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
      setTapCount((n) => n + 1);
      if (desactivarAnimacion) {
        renderFrame();
      }
    };
    window.addEventListener('pointerdown', onPointerDown, { passive: true });

    // Datos deterministas pre-generados por modo
    const celdasBraille = Array.from({ length: 135 }, (_, i) => ({
      x: ((i * 73.13) % 100) / 100,
      y: ((i * 41.77) % 100) / 100,
      fase: i * 0.43,
      vel: 0.00016 + (i % 5) * 0.000045,
      esSecundario: i % 3 === 0,
    }));

    const koisMosaico = [
      { cx: 0.82, cy: 0.28, rx: 0.14, ry: 0.12, vel: 0.34, fase: 0, sec: false },
      { cx: 0.18, cy: 0.74, rx: 0.13, ry: 0.11, vel: -0.29, fase: 2.2, sec: true },
    ];

    const hebrasEstelas = Array.from({ length: 24 }, (_, i) => ({
      yNorm: (i + 0.5) / 24,
      fase: i * 0.52,
      amp: 16 + (i % 4) * 9,
      sec: i % 2 === 1,
    }));

    // Pistas PCB ambientales (Circuito)
    const pcbTraces = Array.from({ length: 14 }, (_, i) => ({
      xNorm: ((i * 19 + 7) % 94) / 100,
      yNorm: ((i * 31 + 11) % 88) / 100,
      len1: 70 + (i % 4) * 38,
      len2: 50 + (i % 3) * 34,
      dirX: i % 2 === 0 ? 1 : -1,
      dirY: i % 3 === 0 ? -1 : 1,
      sec: i % 3 === 0,
      speed: 0.32 + (i % 4) * 0.12,
      fase: i * 0.85,
    }));

    // Fragmentos geométricos ambientales (Cristal)
    const prismShards = Array.from({ length: 22 }, (_, i) => ({
      xNorm: ((i * 47.3 + 9) % 100) / 100,
      yNorm: ((i * 29.7 + 13) % 100) / 100,
      size: 22 + (i % 5) * 14,
      rot: i * 0.61,
      rotSpeed: (i % 2 === 0 ? 1 : -1) * (0.09 + (i % 4) * 0.04),
      driftX: (i % 2 === 0 ? 1 : -1) * (0.002 + (i % 3) * 0.0012),
      driftY: -0.0018 - (i % 4) * 0.0008,
      sec: i % 2 === 1,
    }));

    // Brasas ambientales suaves (Aurora)
    const brasasAmbient = Array.from({ length: 34 }, (_, i) => ({
      xNorm: ((i * 61.7 + 5) % 100) / 100,
      yNorm: ((i * 37.3 + 17) % 100) / 100,
      r: 1.5 + (i % 3) * 1.1,
      vel: 0.006 + (i % 5) * 0.0025,
      fase: i * 0.73,
      sec: i % 2 === 1,
    }));

    const podarTaps = (vidaMax: number) => {
      for (let i = taps.length - 1; i >= 0; i -= 1) {
        if (tiempo - taps[i].born > vidaMax) taps.splice(i, 1);
      }
    };

    // ==================== 1. HALFTONE + ONDA RISOGRÁFICA ====================
    const dibujarHalftone = (t: number) => {
      podarTaps(2.2);
      ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
      ctx.fillRect(0, 0, ancho, alto);

      const scrollNorm = Math.min(
        1,
        window.scrollY / Math.max(1, document.documentElement.scrollHeight - alto),
      );
      const f1x = ancho * (0.82 + (mouse.x - 0.5) * 0.06);
      const f1y = alto * (0.28 + scrollNorm * 0.36 + (mouse.y - 0.5) * 0.05);
      const r1 = Math.max(ancho, alto) * (0.44 + Math.sin(t * 0.45) * 0.03);

      const f2x = ancho * (0.14 - (mouse.x - 0.5) * 0.05);
      const f2y = alto * (0.86 - scrollNorm * 0.28);
      const r2 = Math.max(ancho, alto) * (0.42 + Math.cos(t * 0.38) * 0.03);

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

      for (const tap of taps) {
        const p = Math.min(1, (t - tap.born) / 2.2);
        const rad = 24 + p * 310;
        const glow = ctx.createRadialGradient(tap.x, tap.y, rad * 0.35, tap.x, tap.y, rad);
        const a = (1 - p) * (esClaro ? 0.22 : 0.26);
        glow.addColorStop(0, `rgba(${sR}, ${sG}, ${sB}, 0)`);
        glow.addColorStop(0.65, `rgba(${pR}, ${pG}, ${pB}, ${a.toFixed(3)})`);
        glow.addColorStop(1, `rgba(${sR}, ${sG}, ${sB}, 0)`);
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, ancho, alto);
      }

      const paso = ancho < 640 ? 22 : 18;
      const maxDot = paso * 0.34;

      for (let y = paso * 0.5; y < alto; y += paso) {
        for (let x = paso * 0.5; x < ancho; x += paso) {
          const d1 = Math.hypot(x - f1x, y - f1y) / r1;
          const d2 = Math.hypot(x - f2x, y - f2y) / r2;

          let tapBoost = 0;
          let tapSwap = false;
          for (const tap of taps) {
            const p = (t - tap.born) / 2.2;
            const waveR = 16 + p * 340;
            const dist = Math.hypot(x - tap.x, y - tap.y);
            const band = Math.abs(dist - waveR);
            if (band < 58) {
              const crest = Math.cos((band / 58) * (Math.PI * 0.5)) * (1 - p);
              if (crest > tapBoost) {
                tapBoost = crest;
                tapSwap = dist < waveR;
              }
            }
          }

          if (d1 < 1 || tapBoost > 0.04) {
            const onda = 0.85 + 0.15 * Math.sin(d1 * 7 - t * 1.15);
            const baseInt = d1 < 1 ? Math.pow(1 - d1, 1.45) * onda : 0;
            const radio = Math.min(paso * 0.48, maxDot * baseInt + paso * 0.34 * tapBoost);
            if (radio > 0.65) {
              const alpha = Math.min(
                0.86,
                (esClaro ? 0.34 : 0.42) * baseInt + (esClaro ? 0.62 : 0.78) * tapBoost,
              );
              ctx.fillStyle = tapSwap
                ? `rgba(${sR}, ${sG}, ${sB}, ${alpha.toFixed(3)})`
                : `rgba(${pR}, ${pG}, ${pB}, ${alpha.toFixed(3)})`;
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
              ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${(esClaro ? 0.3 : 0.38) * intensidad2})`;
              ctx.beginPath();
              ctx.arc(x + paso * 0.25, y + paso * 0.25, radio2, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }
    };

    // ==================== 2. BRAILLE + CONSTELACIÓN SUPERNOVA ====================
    const dibujarBraille = (t: number) => {
      podarTaps(2.4);
      ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
      ctx.fillRect(0, 0, ancho, alto);

      ctx.font = '600 15px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const mx = mouse.x * ancho;
      const my = mouse.y * alto;

      const puntos = celdasBraille.map((c) => {
        const px = ((c.x + (desactivarAnimacion ? 0 : t * c.vel)) % 1) * ancho;
        const py = ((c.y + (desactivarAnimacion ? 0 : t * c.vel * 0.45)) % 1) * alto;
        return { ...c, px, py };
      });

      for (const tap of taps) {
        const p = Math.min(1, (t - tap.born) / 2.4);
        const fade = 1 - p;
        const radioRed = 40 + Math.min(1, p * 2.2) * 200;

        ctx.lineWidth = 1;
        for (let i = 0; i < puntos.length; i += 1) {
          const st = puntos[i];
          const d = Math.hypot(st.px - tap.x, st.py - tap.y);
          if (d < radioRed) {
            const lineA = fade * (1 - d / radioRed) * (esClaro ? 0.42 : 0.55);
            ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${lineA.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(tap.x, tap.y);
            ctx.lineTo(st.px, st.py);
            ctx.stroke();
          }
        }

        for (let k = 0; k < 10; k += 1) {
          const ang = (k / 10) * Math.PI * 2 + tap.seed;
          const dist = 16 + p * (115 + (k % 3) * 32);
          const gx = tap.x + Math.cos(ang) * dist;
          const gy = tap.y + Math.sin(ang) * dist;
          const glyphIdx = Math.max(0, Math.floor((1 - p) * (BRAILLE_STEPS.length - 1)));
          const col = k % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
          ctx.fillStyle = `rgba(${col}, ${(fade * 0.92).toFixed(3)})`;
          ctx.fillText(BRAILLE_STEPS[glyphIdx], gx, gy);
        }
      }

      for (let i = 0; i < puntos.length; i += 1) {
        const c = puntos[i];
        const dist = Math.hypot(c.px - mx, c.py - my);
        const cerca = Math.max(0, 1 - dist / 190);

        let tapGlow = 0;
        for (const tap of taps) {
          const p = (t - tap.born) / 2.4;
          const d = Math.hypot(c.px - tap.x, c.py - tap.y);
          if (d < 220) {
            tapGlow = Math.max(tapGlow, (1 - d / 220) * (1 - p));
          }
        }

        const pulso = 0.5 + 0.5 * Math.sin(t * 1.2 + c.fase);
        const idxChar = Math.min(
          BRAILLE_STEPS.length - 1,
          Math.floor((pulso * 0.65 + cerca * 0.55 + tapGlow * 0.9) * BRAILLE_STEPS.length),
        );
        const alpha = (esClaro ? 0.2 : 0.24) + pulso * 0.18 + cerca * 0.42 + tapGlow * 0.5;
        const col = c.esSecundario ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;

        ctx.fillStyle = `rgba(${col}, ${Math.min(0.95, alpha).toFixed(3)})`;
        ctx.fillText(BRAILLE_STEPS[idxChar], c.px, c.py);
      }
    };

    // ==================== 3. MOSAICO (KOI PIXEL) + CASCADA DIAMANTE ====================
    const dibujarMosaico = (t: number) => {
      podarTaps(2.0);
      ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
      ctx.fillRect(0, 0, ancho, alto);

      const tile = ancho < 640 ? 24 : 20;
      const gap = 3;
      const cols = Math.ceil(ancho / tile);
      const rows = Math.ceil(alto / tile);

      const peces = koisMosaico.map((k) => {
        const a = t * k.vel + k.fase;
        return {
          x: ancho * (k.cx + Math.sin(a) * k.rx),
          y: alto * (k.cy + Math.sin(a * 2) * k.ry * 0.55),
          tx: ancho * (k.cx + Math.sin(a - 0.18) * k.rx),
          ty: alto * (k.cy + Math.sin((a - 0.18) * 2) * k.ry * 0.55),
          sec: k.sec,
        };
      });

      const mx = mouse.x * ancho;
      const my = mouse.y * alto;

      for (let r = 0; r < rows; r += 1) {
        const cy = r * tile + tile * 0.5;
        for (let c = 0; c < cols; c += 1) {
          const cx = c * tile + tile * 0.5;

          let valP = 0;
          let valS = 0;

          for (const pez of peces) {
            const dHead = Math.hypot(cx - pez.x, cy - pez.y);
            const dTail = Math.hypot(cx - pez.tx, cy - pez.ty);
            if (dHead < 95) {
              const v = Math.pow(1 - dHead / 95, 1.8) * (esClaro ? 0.3 : 0.36);
              if (pez.sec) valS = Math.max(valS, v);
              else valP = Math.max(valP, v);
            }
            if (dTail < 75) {
              const v = Math.pow(1 - dTail / 75, 2) * (esClaro ? 0.18 : 0.22);
              if (pez.sec) valS = Math.max(valS, v);
              else valP = Math.max(valP, v);
            }
          }

          const dMouse = Math.abs(cx - mx) + Math.abs(cy - my);
          if (dMouse < 130) {
            valP = Math.max(valP, (1 - dMouse / 130) * (esClaro ? 0.16 : 0.2));
          }

          for (const tap of taps) {
            const p = (t - tap.born) / 2.0;
            const manhattan = Math.abs(cx - tap.x) + Math.abs(cy - tap.y);
            const wave = 14 + p * 380;
            const band = Math.abs(manhattan - wave);
            if (band < tile * 2.4) {
              const energy = (1 - band / (tile * 2.4)) * (1 - p);
              const par = (r + c) % 2 === 0;
              if (par) valP = Math.max(valP, energy * (esClaro ? 0.58 : 0.72));
              else valS = Math.max(valS, energy * (esClaro ? 0.54 : 0.68));
            }
          }

          if (valP > 0.02 || valS > 0.02) {
            const usaS = valS > valP;
            const alpha = Math.min(0.82, Math.max(valP, valS));
            ctx.fillStyle = usaS
              ? `rgba(${sR}, ${sG}, ${sB}, ${alpha.toFixed(3)})`
              : `rgba(${pR}, ${pG}, ${pB}, ${alpha.toFixed(3)})`;
            ctx.beginPath();
            ctx.roundRect(c * tile + gap * 0.5, r * tile + gap * 0.5, tile - gap, tile - gap, 4);
            ctx.fill();
          }
        }
      }
    };

    // ==================== 4. CIRCUITO PCB + PULSO ELÉCTRICO 90°/45° ====================
    const dibujarCircuito = (t: number) => {
      podarTaps(2.2);
      ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
      ctx.fillRect(0, 0, ancho, alto);

      // Rejilla sutil de pines de placa base
      const pitch = 44;
      ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.1 : 0.12})`;
      for (let y = pitch * 0.5; y < alto; y += pitch) {
        for (let x = pitch * 0.5; x < ancho; x += pitch) {
          ctx.fillRect(x - 1, y - 1, 2, 2);
        }
      }

      // Pistas PCB ambientales con paquetes de datos viajando a 90° y 45°
      for (const tr of pcbTraces) {
        const x0 = Math.round((tr.xNorm * ancho) / pitch) * pitch;
        const y0 = Math.round((tr.yNorm * alto) / pitch) * pitch;
        const x1 = x0 + tr.dirX * tr.len1;
        const y1 = y0;
        const diag = 32;
        const x2 = x1 + tr.dirX * diag;
        const y2 = y1 + tr.dirY * diag;
        const x3 = x2 + tr.dirX * tr.len2;
        const y3 = y2;

        const col = tr.sec ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;
        ctx.strokeStyle = `rgba(${col}, ${esClaro ? 0.16 : 0.2})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.stroke();

        // Nodos de soldadura (pads)
        ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
        ctx.strokeStyle = `rgba(${col}, ${esClaro ? 0.34 : 0.42})`;
        ctx.lineWidth = 1.5;
        for (const [nx, ny] of [
          [x0, y0],
          [x3, y3],
        ]) {
          ctx.beginPath();
          ctx.arc(nx, ny, 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Pulso ambiental recorriendo la pista
        const prog = (t * tr.speed + tr.fase) % 1;
        let px = x0;
        let py = y0;
        if (prog < 0.45) {
          const u = prog / 0.45;
          px = x0 + (x1 - x0) * u;
          py = y0;
        } else if (prog < 0.65) {
          const u = (prog - 0.45) / 0.2;
          px = x1 + (x2 - x1) * u;
          py = y1 + (y2 - y1) * u;
        } else {
          const u = (prog - 0.65) / 0.35;
          px = x2 + (x3 - x2) * u;
          py = y2;
        }
        ctx.fillStyle = `rgba(${col}, ${esClaro ? 0.72 : 0.85})`;
        ctx.beginPath();
        ctx.arc(px, py, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Animación exclusiva de toque: 6 pistas PCB eléctricas ramificándose desde el clic
      const dirs = [
        [1, 0, 1, 1],
        [-1, 0, -1, -1],
        [0, -1, 1, -1],
        [0, 1, -1, 1],
        [1, 0, 1, -1],
        [-1, 0, -1, 1],
      ] as const;

      for (const tap of taps) {
        const p = Math.min(1, (t - tap.born) / 2.2);
        const fade = p < 0.75 ? 1 : (1 - p) / 0.25;

        // Microchip central en el punto del toque
        ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.85).toFixed(3)})`;
        ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${(fade * 0.35).toFixed(3)})`;
        ctx.lineWidth = 1.8;
        ctx.strokeRect(tap.x - 7, tap.y - 7, 14, 14);
        ctx.fillRect(tap.x - 4, tap.y - 4, 8, 8);

        for (let k = 0; k < dirs.length; k += 1) {
          const [dx1, dy1, dx2, dy2] = dirs[k];
          const col = k % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
          const seg1 = 64 + (k % 3) * 24;
          const seg2 = 34 + (k % 2) * 18;
          const seg3 = 82 + ((k + 1) % 3) * 26;
          const total = seg1 + seg2 + seg3;
          const reach = Math.min(total, p * 1.45 * total);

          const p1x = tap.x + dx1 * Math.min(seg1, reach);
          const p1y = tap.y + dy1 * Math.min(seg1, reach);

          ctx.strokeStyle = `rgba(${col}, ${(fade * (esClaro ? 0.68 : 0.84)).toFixed(3)})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(tap.x, tap.y);
          ctx.lineTo(p1x, p1y);

          let tipX = p1x;
          let tipY = p1y;

          if (reach > seg1) {
            const r2 = Math.min(seg2, reach - seg1);
            const p2x = tap.x + dx1 * seg1 + dx2 * r2 * 0.707;
            const p2y = tap.y + dy1 * seg1 + dy2 * r2 * 0.707;
            ctx.lineTo(p2x, p2y);
            tipX = p2x;
            tipY = p2y;

            if (reach > seg1 + seg2) {
              const r3 = Math.min(seg3, reach - seg1 - seg2);
              const bx = tap.x + dx1 * seg1 + dx2 * seg2 * 0.707;
              const by = tap.y + dy1 * seg1 + dy2 * seg2 * 0.707;
              const p3x = bx + (dx1 !== 0 ? dx1 : dx2) * r3;
              const p3y = by + (dy1 !== 0 ? dy1 : 0) * r3;
              ctx.lineTo(p3x, p3y);
              tipX = p3x;
              tipY = p3y;
            }
          }
          ctx.stroke();

          // Nodo brillante en la punta del pulso eléctrico
          ctx.fillStyle = `rgba(${col}, ${(fade * 0.95).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(tipX, tipY, 3.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    // ==================== 5. TABLERO MECÁNICO (DEPARTURE BOARD) ====================
    const dibujarTablero = (t: number) => {
      podarTaps(2.2);
      ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
      ctx.fillRect(0, 0, ancho, alto);

      const cellW = ancho < 640 ? 44 : 38;
      const cellH = ancho < 640 ? 50 : 44;
      const cols = Math.ceil(ancho / cellW);
      const rows = Math.ceil(alto / cellH);

      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const mx = mouse.x * ancho;
      const my = mouse.y * alto;

      for (let r = 0; r < rows; r += 1) {
        const y = r * cellH;
        const cy = y + cellH * 0.5;
        for (let c = 0; c < cols; c += 1) {
          const x = c * cellW;
          const cx = x + cellW * 0.5;

          const hash = (r * 37 + c * 17) % 100;
          const dMouse = Math.hypot(cx - mx, cy - my);
          const nearMouse = Math.max(0, 1 - dMouse / 160);

          // Volteo mecánico exclusivo al tocar el fondo
          let flipEnergy = 0;
          let flipPhase = 0;
          let flipSec = false;
          for (const tap of taps) {
            const p = (t - tap.born) / 2.2;
            const d = Math.hypot(cx - tap.x, cy - tap.y);
            const wave = 16 + p * 380;
            const band = Math.abs(d - wave);
            if (band < 95) {
              const e = (1 - band / 95) * (1 - p);
              if (e > flipEnergy) {
                flipEnergy = e;
                flipPhase = Math.floor(t * 18 + r + c);
                flipSec = (r + c) % 2 === 1;
              }
            }
          }

          // Solo dibujar celdas activas o con presencia sutil para mantener ligereza visual
          const ambientShow = hash < 24;
          if (!ambientShow && nearMouse < 0.08 && flipEnergy < 0.05) continue;

          const slowTick = Math.floor(t * 0.45 + hash * 0.3);
          const glyph = BOARD_GLYPHS[(hash + slowTick + flipPhase) % BOARD_GLYPHS.length];
          const col =
            flipEnergy > 0.05
              ? flipSec
                ? `${sR}, ${sG}, ${sB}`
                : `${pR}, ${pG}, ${pB}`
              : hash % 3 === 0
                ? `${sR}, ${sG}, ${sB}`
                : `${pR}, ${pG}, ${pB}`;

          const cardA = Math.min(
            0.34,
            (ambientShow ? (esClaro ? 0.06 : 0.08) : 0) + nearMouse * 0.1 + flipEnergy * 0.26,
          );
          const textA = Math.min(
            0.94,
            (ambientShow ? (esClaro ? 0.22 : 0.26) : 0) + nearMouse * 0.35 + flipEnergy * 0.78,
          );

          // Efecto bisagra vertical (flip card) durante la onda
          const scaleY = flipEnergy > 0.05 ? 0.45 + 0.55 * Math.abs(Math.cos(flipEnergy * Math.PI * 2.5)) : 1;
          const hDraw = (cellH - 10) * scaleY;
          const yDraw = cy - hDraw * 0.5;

          ctx.fillStyle = `rgba(${col}, ${cardA.toFixed(3)})`;
          ctx.strokeStyle = `rgba(${col}, ${(cardA * 1.9).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(x + 5, yDraw, cellW - 10, hDraw, 4);
          ctx.fill();
          ctx.stroke();

          // Línea de bisagra central de tablero split-flap
          ctx.strokeStyle = `rgba(${bgR}, ${bgG}, ${bgB}, 0.55)`;
          ctx.beginPath();
          ctx.moveTo(x + 6, cy);
          ctx.lineTo(x + cellW - 6, cy);
          ctx.stroke();

          ctx.fillStyle = `rgba(${col}, ${textA.toFixed(3)})`;
          ctx.fillText(glyph, cx, cy + 0.5);
        }
      }
    };

    // ==================== 6. PLANO TÉCNICO (BLUEPRINT + COMPÁS) ====================
    const dibujarPlano = (t: number) => {
      podarTaps(2.8);
      ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
      ctx.fillRect(0, 0, ancho, alto);

      // Rejilla milimétrica arquitectónica
      const major = 96;
      const minor = 24;

      ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.06 : 0.07})`;
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      for (let x = 0; x < ancho; x += minor) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, alto);
      }
      for (let y = 0; y < alto; y += minor) {
        ctx.moveTo(0, y);
        ctx.lineTo(ancho, y);
      }
      ctx.stroke();

      ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.13 : 0.15})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < ancho; x += major) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, alto);
      }
      for (let y = 0; y < alto; y += major) {
        ctx.moveTo(0, y);
        ctx.lineTo(ancho, y);
      }
      ctx.stroke();

      // Órbita elíptica técnica con cometa trazado (Anthropic Blueprint)
      const ox = ancho * 0.76;
      const oy = alto * 0.44;
      const orx = Math.min(ancho, alto) * 0.34;
      const ory = orx * 0.52;
      const rot = -0.28;

      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(rot);
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.28 : 0.34})`;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.ellipse(0, 0, orx, ory, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const cometAng = t * 0.48;
      const cx = Math.cos(cometAng) * orx;
      const cy = Math.sin(cometAng) * ory;
      ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.55 : 0.68})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, orx, ory, 0, cometAng - 0.45, cometAng);
      ctx.stroke();

      ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, 0.9)`;
      ctx.beginPath();
      ctx.arc(cx, cy, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Animación exclusiva de toque: Compás geométrico con ángulos y lectura (X, Y)
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'bottom';

      for (const tap of taps) {
        const p = Math.min(1, (t - tap.born) / 2.8);
        const fade = p < 0.74 ? 1 : (1 - p) / 0.26;
        const arcSweep = Math.min(1, p * 2.1) * Math.PI * 2;
        const rad = 48 + Math.min(1, p * 1.4) * 52;

        // Círculo técnico punteado trazado por el compás
        ctx.save();
        ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * (esClaro ? 0.65 : 0.8)).toFixed(3)})`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.arc(tap.x, tap.y, rad, -Math.PI * 0.5, -Math.PI * 0.5 + arcSweep);
        ctx.stroke();
        ctx.setLineDash([]);

        // Círculo interior sólido + brazo giratorio del compás
        ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${(fade * 0.62).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(tap.x, tap.y, rad * 0.55, 0, arcSweep);
        ctx.stroke();

        const armAng = -Math.PI * 0.5 + arcSweep;
        ctx.beginPath();
        ctx.moveTo(tap.x, tap.y);
        ctx.lineTo(tap.x + Math.cos(armAng) * rad, tap.y + Math.sin(armAng) * rad);
        ctx.stroke();

        // Marcas angulares cada 45°
        for (let a = 0; a < 8; a += 1) {
          const ang = (a / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(tap.x + Math.cos(ang) * (rad - 5), tap.y + Math.sin(ang) * (rad - 5));
          ctx.lineTo(tap.x + Math.cos(ang) * (rad + 5), tap.y + Math.sin(ang) * (rad + 5));
          ctx.stroke();
        }

        // Etiqueta técnica de coordenadas
        ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.88).toFixed(3)})`;
        ctx.fillText(
          `X:${Math.round(tap.x)} Y:${Math.round(tap.y)} R:${Math.round(rad)}`,
          tap.x + 12,
          tap.y - 8,
        );
        ctx.restore();
      }
    };

    // ==================== 7. PANAL HEXAGONAL + REACCIÓN EN CADENA ====================
    const dibujarPanal = (t: number) => {
      podarTaps(2.1);
      ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
      ctx.fillRect(0, 0, ancho, alto);

      const rHex = ancho < 640 ? 32 : 28;
      const dx = rHex * 1.5;
      const dy = rHex * Math.sqrt(3);
      const cols = Math.ceil(ancho / dx) + 1;
      const rows = Math.ceil(alto / dy) + 1;

      const mx = mouse.x * ancho;
      const my = mouse.y * alto;

      const drawHex = (cx: number, cy: number, rad: number) => {
        ctx.beginPath();
        for (let i = 0; i < 6; i += 1) {
          const ang = (i * Math.PI) / 3;
          const hx = cx + Math.cos(ang) * rad;
          const hy = cy + Math.sin(ang) * rad;
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
      };

      for (let c = 0; c < cols; c += 1) {
        const cx = c * dx;
        for (let r = 0; r < rows; r += 1) {
          const cy = r * dy + (c % 2 === 1 ? dy * 0.5 : 0);
          const dMouse = Math.hypot(cx - mx, cy - my);
          const nearMouse = Math.max(0, 1 - dMouse / 190);
          const pulse = 0.5 + 0.5 * Math.sin(t * 0.8 + c * 0.4 + r * 0.5);

          // Reacción en cadena hexagonal exclusiva al toque
          let chainE = 0;
          let chainRing = 0;
          for (const tap of taps) {
            const p = (t - tap.born) / 2.1;
            const d = Math.hypot(cx - tap.x, cy - tap.y);
            const ringDist = Math.abs(d - (18 + p * 340));
            if (ringDist < rHex * 2.2) {
              const e = (1 - ringDist / (rHex * 2.2)) * (1 - p);
              if (e > chainE) {
                chainE = e;
                chainRing = Math.floor(d / (rHex * 1.5));
              }
            }
          }

          const baseStroke = (esClaro ? 0.08 : 0.1) + pulse * 0.04 + nearMouse * 0.24;
          const usaSec = chainE > 0.05 ? chainRing % 2 === 1 : (c + r) % 3 === 0;
          const col = usaSec ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;

          drawHex(cx, cy, rHex - 2);
          ctx.strokeStyle = `rgba(${col}, ${Math.min(0.9, baseStroke + chainE * 0.72).toFixed(3)})`;
          ctx.lineWidth = chainE > 0.15 ? 1.8 : 1;
          ctx.stroke();

          if (nearMouse > 0.12 || chainE > 0.05) {
            const fillA = Math.min(0.42, nearMouse * 0.12 + chainE * 0.36);
            ctx.fillStyle = `rgba(${col}, ${fillA.toFixed(3)})`;
            ctx.fill();
          }
        }
      }
    };

    // ==================== 8. CRISTAL / PRISMAS (AERO SHARDS) ====================
    const dibujarCristal = (t: number) => {
      podarTaps(2.2);
      ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
      ctx.fillRect(0, 0, ancho, alto);

      // Rayos diagonales translúcidos muy sutiles
      const rayGrad = ctx.createLinearGradient(0, 0, ancho, alto);
      rayGrad.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.09 : 0.11})`);
      rayGrad.addColorStop(0.5, `rgba(${sR}, ${sG}, ${sB}, 0.02)`);
      rayGrad.addColorStop(1, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.09 : 0.11})`);
      ctx.fillStyle = rayGrad;
      ctx.fillRect(0, 0, ancho, alto);

      // Fragmentos geométricos translúcidos flotando
      for (const sh of prismShards) {
        const x = (((sh.xNorm + (desactivarAnimacion ? 0 : t * sh.driftX)) % 1) + 1) % 1 * ancho;
        const y = (((sh.yNorm + (desactivarAnimacion ? 0 : t * sh.driftY)) % 1) + 1) % 1 * alto;
        const ang = sh.rot + (desactivarAnimacion ? 0 : t * sh.rotSpeed);
        const col = sh.sec ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(ang);
        ctx.fillStyle = `rgba(${col}, ${esClaro ? 0.1 : 0.12})`;
        ctx.strokeStyle = `rgba(${col}, ${esClaro ? 0.26 : 0.32})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(0, -sh.size);
        ctx.lineTo(sh.size * 0.78, sh.size * 0.62);
        ctx.lineTo(-sh.size * 0.62, sh.size * 0.42);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Animación exclusiva de toque: Refracción de prisma con 9 fragmentos triangulares + destello
      for (const tap of taps) {
        const p = Math.min(1, (t - tap.born) / 2.2);
        const fade = 1 - p;

        // 4 rayos prismáticos cruzados
        ctx.save();
        ctx.translate(tap.x, tap.y);
        for (let r = 0; r < 4; r += 1) {
          const ang = (r * Math.PI) / 4 + tap.seed * 0.5;
          const len = 30 + p * 170;
          const col = r % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
          ctx.strokeStyle = `rgba(${col}, ${(fade * (esClaro ? 0.42 : 0.55)).toFixed(3)})`;
          ctx.lineWidth = 1.6 * fade;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * -len, Math.sin(ang) * -len);
          ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
          ctx.stroke();
        }
        ctx.restore();

        // 9 triángulos de vidrio girando hacia afuera
        for (let k = 0; k < 9; k += 1) {
          const ang = (k / 9) * Math.PI * 2 + tap.seed;
          const dist = 16 + Math.pow(p, 0.78) * (150 + (k % 3) * 45);
          const sx = tap.x + Math.cos(ang) * dist;
          const sy = tap.y + Math.sin(ang) * dist;
          const sz = (14 + (k % 3) * 6) * (1 - p * 0.45);
          const col = k % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;

          ctx.save();
          ctx.translate(sx, sy);
          ctx.rotate(ang + p * (k % 2 === 0 ? 3.8 : -3.4));
          ctx.fillStyle = `rgba(${col}, ${(fade * (esClaro ? 0.28 : 0.36)).toFixed(3)})`;
          ctx.strokeStyle = `rgba(${col}, ${(fade * (esClaro ? 0.72 : 0.88)).toFixed(3)})`;
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(0, -sz);
          ctx.lineTo(sz * 0.72, sz * 0.58);
          ctx.lineTo(-sz * 0.65, sz * 0.36);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }
    };

    // ==================== 9. AURORA & BRASAS (ZERO LINES) ====================
    const dibujarAurora = (t: number) => {
      podarTaps(2.6);
      ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
      ctx.fillRect(0, 0, ancho, alto);

      // 3 velos amplios y difuminados de aurora (cero líneas delgadas)
      const velos = [
        {
          x: ancho * (0.24 + Math.sin(t * 0.22) * 0.08 + (mouse.x - 0.5) * 0.06),
          y: alto * (0.26 + Math.cos(t * 0.18) * 0.06),
          r: Math.max(ancho, alto) * 0.48,
          col: `${pR}, ${pG}, ${pB}`,
          a: esClaro ? 0.18 : 0.22,
        },
        {
          x: ancho * (0.78 + Math.cos(t * 0.2) * 0.09 - (mouse.x - 0.5) * 0.05),
          y: alto * (0.58 + Math.sin(t * 0.25) * 0.08),
          r: Math.max(ancho, alto) * 0.52,
          col: `${sR}, ${sG}, ${sB}`,
          a: esClaro ? 0.16 : 0.2,
        },
        {
          x: ancho * (0.48 + Math.sin(t * 0.15 + 1.5) * 0.1),
          y: alto * (0.86 + Math.cos(t * 0.21) * 0.06),
          r: Math.max(ancho, alto) * 0.42,
          col: `${pR}, ${pG}, ${pB}`,
          a: esClaro ? 0.13 : 0.16,
        },
      ];

      for (const v of velos) {
        const g = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, v.r);
        g.addColorStop(0, `rgba(${v.col}, ${v.a})`);
        g.addColorStop(0.55, `rgba(${v.col}, ${(v.a * 0.42).toFixed(3)})`);
        g.addColorStop(1, `rgba(${v.col}, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, ancho, alto);
      }

      // Brasas suaves flotando hacia arriba
      for (const b of brasasAmbient) {
        const bx = b.xNorm * ancho + Math.sin(t * 0.9 + b.fase) * 18;
        const by = (((b.yNorm - (desactivarAnimacion ? 0 : t * b.vel)) % 1) + 1) % 1 * alto;
        const tw = 0.45 + 0.55 * Math.sin(t * 1.8 + b.fase);
        const col = b.sec ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;
        ctx.fillStyle = `rgba(${col}, ${(tw * (esClaro ? 0.42 : 0.55)).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(bx, by, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Animación exclusiva de toque: Destello nebuloso + 16 brasas flotando hacia arriba
      for (const tap of taps) {
        const p = Math.min(1, (t - tap.born) / 2.6);
        const fade = 1 - p;
        const rad = 36 + Math.pow(p, 0.7) * 230;

        const bloom = ctx.createRadialGradient(tap.x, tap.y, 0, tap.x, tap.y, rad);
        bloom.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${(fade * (esClaro ? 0.3 : 0.38)).toFixed(3)})`);
        bloom.addColorStop(0.5, `rgba(${sR}, ${sG}, ${sB}, ${(fade * (esClaro ? 0.18 : 0.24)).toFixed(3)})`);
        bloom.addColorStop(1, `rgba(${sR}, ${sG}, ${sB}, 0)`);
        ctx.fillStyle = bloom;
        ctx.fillRect(0, 0, ancho, alto);

        for (let k = 0; k < 16; k += 1) {
          const spreadX = Math.sin(k * 2.399 + tap.seed) * (24 + p * 120);
          const riseY = -p * (95 + (k % 4) * 34) - Math.abs(Math.cos(k * 1.7)) * 18;
          const sway = Math.sin(t * 3.2 + k) * 10 * p;
          const ex = tap.x + spreadX + sway;
          const ey = tap.y + riseY;
          const er = (2.2 + (k % 3) * 1.2) * (1 - p * 0.65);
          const col = k % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;

          ctx.fillStyle = `rgba(${col}, ${(fade * 0.92).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(ex, ey, Math.max(0.8, er), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    // ==================== 10. PLOTTER + SELLO TOPOGRÁFICO ====================
    const dibujarPlotter = (t: number) => {
      podarTaps(2.8);
      ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
      ctx.fillRect(0, 0, ancho, alto);

      const scrollShift = window.scrollY * 0.18;
      const capas = 14;

      for (let i = 0; i < capas; i += 1) {
        const progreso = i / (capas - 1);
        const esB = i % 2 === 1;
        const baseColor = esB ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;
        const alpha = (esClaro ? 0.14 : 0.17) + (1 - Math.abs(progreso - 0.5) * 2) * 0.1;

        ctx.strokeStyle = `rgba(${baseColor}, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.15;
        ctx.beginPath();

        const yBase = alto * (0.14 + progreso * 0.82);
        const pasosX = 56;
        for (let sx = 0; sx <= pasosX; sx += 1) {
          const u = sx / pasosX;
          const x = u * ancho;
          const distCursor = Math.hypot(u - mouse.x, yBase / Math.max(1, alto) - mouse.y);
          const empujon = Math.max(0, 1 - distCursor * 2.6) * 24;

          let deflexionTap = 0;
          for (const tap of taps) {
            const p = (t - tap.born) / 2.8;
            const dist = Math.hypot(x - tap.x, yBase - tap.y);
            const waveR = 14 + p * 260;
            const band = Math.abs(dist - waveR);
            if (band < 70) {
              const dir = yBase >= tap.y ? 1 : -1;
              deflexionTap += dir * Math.cos((band / 70) * (Math.PI * 0.5)) * (1 - p) * 28;
            }
          }

          const y =
            yBase +
            Math.sin(u * 5.2 + t * 0.55 + i * 0.45) * 26 +
            Math.cos(u * 9.5 - t * 0.35 + scrollShift * 0.012 + i * 0.3) * 12 +
            empujon +
            deflexionTap;
          if (sx === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

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

      for (const tap of taps) {
        const p = Math.min(1, (t - tap.born) / 2.8);
        const fade = p < 0.7 ? 1 : (1 - p) / 0.3;

        const crossA = fade * (esClaro ? 0.55 : 0.72);
        ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${crossA.toFixed(3)})`;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(tap.x - 8, tap.y);
        ctx.lineTo(tap.x + 8, tap.y);
        ctx.moveTo(tap.x, tap.y - 8);
        ctx.lineTo(tap.x, tap.y + 8);
        ctx.stroke();

        for (let ring = 1; ring <= 5; ring += 1) {
          const ringStart = (ring - 1) * 0.09;
          const drawFrac = Math.max(0, Math.min(1, (p - ringStart) / 0.36));
          if (drawFrac <= 0) continue;

          const baseR = ring * 26 + p * 34;
          const col = ring % 2 === 0 ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;
          const ringA = fade * (0.58 - ring * 0.075);
          ctx.strokeStyle = `rgba(${col}, ${Math.max(0.06, ringA).toFixed(3)})`;
          ctx.lineWidth = ring === 1 ? 1.55 : 1.1;
          ctx.beginPath();

          const steps = 44;
          const maxStep = Math.ceil(steps * drawFrac);
          for (let s = 0; s <= maxStep; s += 1) {
            const ang = (s / steps) * Math.PI * 2;
            const wobble =
              1 +
              0.12 * Math.sin(ang * 3 + tap.seed + ring * 0.8) +
              0.07 * Math.cos(ang * 5 - tap.seed * 1.4);
            const rx = Math.cos(ang) * baseR * wobble * 1.15;
            const ry = Math.sin(ang) * baseR * wobble * 0.82;
            if (s === 0) ctx.moveTo(tap.x + rx, tap.y + ry);
            else ctx.lineTo(tap.x + rx, tap.y + ry);
          }
          ctx.stroke();
        }
      }
    };

    // ==================== 11. ESTELAS (FLOW FIELD) + VÓRTICE DE CHISPAS ====================
    const dibujarEstelas = (t: number) => {
      podarTaps(2.3);
      ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
      ctx.fillRect(0, 0, ancho, alto);

      for (const h of hebrasEstelas) {
        const y0 = h.yNorm * alto;
        const col = h.sec ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;
        ctx.strokeStyle = `rgba(${col}, ${(esClaro ? 0.12 : 0.15).toFixed(3)})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        const segs = 40;
        for (let i = 0; i <= segs; i += 1) {
          const u = i / segs;
          const x = u * ancho;
          const flow =
            Math.sin(u * 4.5 + t * 0.6 + h.fase) * h.amp +
            Math.cos(u * 2.8 - t * 0.4 + mouse.x * 2.5) * 14;
          const y = y0 + flow;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      for (const tap of taps) {
        const p = Math.min(1, (t - tap.born) / 2.3);
        const fade = 1 - p;

        for (let k = 0; k < 12; k += 1) {
          const baseAng = (k / 12) * Math.PI * 2 + tap.seed;
          const esSec = k % 2 === 1;
          const col = esSec ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;
          const speed = 135 + (k % 3) * 42;
          const curl = (k % 2 === 0 ? 1 : -1) * 1.15;

          const headT = p;
          const tailT = Math.max(0, p - 0.24);

          ctx.strokeStyle = `rgba(${col}, ${(fade * (esClaro ? 0.62 : 0.78)).toFixed(3)})`;
          ctx.lineWidth = 2.1 * fade + 0.6;
          ctx.lineCap = 'round';
          ctx.beginPath();

          let hx = tap.x;
          let hy = tap.y;
          const steps = 10;
          for (let s = 0; s <= steps; s += 1) {
            const st = tailT + ((headT - tailT) * s) / steps;
            const r = st * speed;
            const ang = baseAng + st * curl;
            const px = tap.x + Math.cos(ang) * r;
            const py = tap.y + Math.sin(ang) * r;
            if (s === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
            if (s === steps) {
              hx = px;
              hy = py;
            }
          }
          ctx.stroke();

          const starR = (3.5 + (k % 2) * 1.5) * fade;
          if (starR > 0.8) {
            ctx.fillStyle = `rgba(${col}, ${(fade * 0.92).toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(hx, hy - starR);
            ctx.lineTo(hx + starR * 0.34, hy - starR * 0.34);
            ctx.lineTo(hx + starR, hy);
            ctx.lineTo(hx + starR * 0.34, hy + starR * 0.34);
            ctx.lineTo(hx, hy + starR);
            ctx.lineTo(hx - starR * 0.34, hy + starR * 0.34);
            ctx.lineTo(hx - starR, hy);
            ctx.lineTo(hx - starR * 0.34, hy - starR * 0.34);
            ctx.closePath();
            ctx.fill();
          }
        }
      }
    };

    const renderFrame = () => {
      switch (modo) {
        case 'halftone':
          dibujarHalftone(tiempo);
          break;
        case 'braille':
          dibujarBraille(tiempo);
          break;
        case 'mosaico':
          dibujarMosaico(tiempo);
          break;
        case 'circuito':
          dibujarCircuito(tiempo);
          break;
        case 'tablero':
          dibujarTablero(tiempo);
          break;
        case 'plano':
          dibujarPlano(tiempo);
          break;
        case 'panal':
          dibujarPanal(tiempo);
          break;
        case 'cristal':
          dibujarCristal(tiempo);
          break;
        case 'aurora':
          dibujarAurora(tiempo);
          break;
        case 'plotter':
          dibujarPlotter(tiempo);
          break;
        case 'estelas':
          dibujarEstelas(tiempo);
          break;
      }
    };

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
