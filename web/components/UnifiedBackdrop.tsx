import React, { useEffect, useRef, useState } from 'react';

import { obtenerTema, TEMAS_VALIDOS, type TemaId } from '../data/temas';

export type ModoFondoContinuo =
  | 'halftone'
  | 'braille'
  | 'mosaico'
  | 'tablero'
  | 'plano'
  | 'plotter';

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
 * Cada uno de los 6 modos posee su propia estética y su animación exclusiva al tocar el fondo:
 *  1. halftone → Onda risográfica que infla y alterna tintas en la matriz de puntos.
 *  2. braille  → Constelación interactiva: red estelar conectada a glifos Braille cercanos.
 *  3. mosaico  → Cascada pixel en diamante Manhattan sobre la cuadrícula estilo Koi Mosaic.
 *  4. tablero  → Volteo mecánico (Departure Board) con cascada de fichas de código.
 *  5. plano    → Compás técnico (Blueprint) con círculo punteado, ángulos y coordenadas (X, Y).
 *  6. plotter  → Sello topográfico trazado en vivo (curvas de nivel + mira +).
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

    // ==================== 4. TABLERO MECÁNICO (DEPARTURE BOARD) ====================
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

    // ==================== 6. PLOTTER + SELLO TOPOGRÁFICO ====================
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
        case 'tablero':
          dibujarTablero(tiempo);
          break;
        case 'plano':
          dibujarPlano(tiempo);
          break;
        case 'plotter':
          dibujarPlotter(tiempo);
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
