import React, { useEffect, useRef, useState } from 'react';

import { obtenerTema, TEMAS_VALIDOS, type TemaId } from '../data/temas';

export type ModoFondoContinuo = 'halftone' | 'plotter' | 'braille' | 'mosaico' | 'estelas';

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

const INTERACTIVE_SKIP_SELECTOR =
  'button, a, input, textarea, select, label, dialog, [role="tab"], [role="button"], .lp-hero-panel, .lp-code-ticker, .lp-pipe-source, .lp-bento-card, .lp-stage-card, .lp-xp-bar-card, .lp-closing-card, .lp-nav';

/**
 * Fondo generativo ÚNICO, CONTINUO e INTERACTIVO detrás de toda la página (`position: fixed; inset: 0`).
 * Cero línea divisoria entre portada y contenido inferior.
 * Cada uno de los 5 modos posee su propia animación exclusiva al tocar o hacer clic en el fondo:
 *  - halftone → Onda risográfica que infla y alterna tintas en la matriz de puntos.
 *  - plotter  → Sello topográfico trazado en vivo (anillos orgánicos + mira de coordenadas + deflexión de marea).
 *  - braille  → Constelación interactiva: red estelar conectada a glifos Braille cercanos + supernova Unicode.
 *  - mosaico  → Cascada pixel en diamante Manhattan sobre la cuadrícula estilo Koi Mosaic.
 *  - estelas  → Vórtice de cometas curvos con chispas ✦ siguiendo el campo vectorial.
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

    // Estrellas Braille pre-generadas
    const celdasBraille = Array.from({ length: 135 }, (_, i) => ({
      x: ((i * 73.13) % 100) / 100,
      y: ((i * 41.77) % 100) / 100,
      fase: i * 0.43,
      vel: 0.00016 + (i % 5) * 0.000045,
      esSecundario: i % 3 === 0,
    }));

    // Peces / partículas suaves para el modo Mosaico
    const koisMosaico = [
      { cx: 0.82, cy: 0.28, rx: 0.14, ry: 0.12, vel: 0.34, fase: 0, sec: false },
      { cx: 0.18, cy: 0.74, rx: 0.13, ry: 0.11, vel: -0.29, fase: 2.2, sec: true },
    ];

    // Partículas de flujo ambiental para el modo Estelas
    const hebrasEstelas = Array.from({ length: 24 }, (_, i) => ({
      yNorm: (i + 0.5) / 24,
      fase: i * 0.52,
      amp: 16 + (i % 4) * 9,
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

      // Halo suave en cada toque risográfico
      for (const tap of taps) {
        const age = t - tap.born;
        const p = Math.min(1, age / 2.2);
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

          // Calcular impulso de onda risográfica exclusiva de Halftone
          let tapBoost = 0;
          let tapSwap = false;
          for (const tap of taps) {
            const age = t - tap.born;
            const p = age / 2.2;
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

    // ==================== 2. PLOTTER + SELLO TOPOGRÁFICO ====================
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

          // Deflexión de onda topográfica cuando el usuario toca el fondo
          let deflexionTap = 0;
          for (const tap of taps) {
            const age = t - tap.born;
            const p = age / 2.8;
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

      // Anillos topográficos ambientales esquina superior derecha
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

      // Animación exclusiva de toque: Sello topográfico trazado por plumilla (pen-plotter)
      for (const tap of taps) {
        const age = t - tap.born;
        const p = Math.min(1, age / 2.8);
        const fade = p < 0.7 ? 1 : (1 - p) / 0.3;

        // Mira de coordenadas (+) en el punto tocado
        const crossA = fade * (esClaro ? 0.55 : 0.72);
        ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${crossA.toFixed(3)})`;
        ctx.lineWidth = 1.25;
        ctx.beginPath();
        ctx.moveTo(tap.x - 8, tap.y);
        ctx.lineTo(tap.x + 8, tap.y);
        ctx.moveTo(tap.x, tap.y - 8);
        ctx.lineTo(tap.x, tap.y + 8);
        ctx.stroke();

        // 5 curvas de nivel orgánicas que se dibujan progresivamente 0 → 2π
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

    // ==================== 3. BRAILLE + CONSTELACIÓN SUPERNOVA ====================
    const dibujarBraille = (t: number) => {
      podarTaps(2.4);
      ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
      ctx.fillRect(0, 0, ancho, alto);

      ctx.font = '600 15px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const mx = mouse.x * ancho;
      const my = mouse.y * alto;

      // Posiciones proyectadas de todas las estrellas Braille
      const puntos = celdasBraille.map((c) => {
        const px = ((c.x + (desactivarAnimacion ? 0 : t * c.vel)) % 1) * ancho;
        const py = ((c.y + (desactivarAnimacion ? 0 : t * c.vel * 0.45)) % 1) * alto;
        return { ...c, px, py };
      });

      // Animación exclusiva de toque: Red estelar + supernova Braille
      for (const tap of taps) {
        const age = t - tap.born;
        const p = Math.min(1, age / 2.4);
        const fade = 1 - p;
        const radioRed = 40 + Math.min(1, p * 2.2) * 200;

        // Conectar estrellas Braille cercanas con líneas de carta astronómica
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

        // 10 glifos Braille en expansión desde la supernova
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

      // Dibujar campo Braille ambiental (iluminado si está dentro de un toque)
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

    // ==================== 4. MOSAICO (KOI PIXEL) + CASCADA DIAMANTE ====================
    const dibujarMosaico = (t: number) => {
      podarTaps(2.0);
      ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
      ctx.fillRect(0, 0, ancho, alto);

      const tile = ancho < 640 ? 24 : 20;
      const gap = 3;
      const cols = Math.ceil(ancho / tile);
      const rows = Math.ceil(alto / tile);

      // Posiciones de los dos "koi" de mosaico flotando en trayectoria suave
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

          // Brillo ambiental por proximidad a los peces koi y al cursor
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

          // Animación exclusiva de toque: Cascada de teselas en diamante Manhattan
          for (const tap of taps) {
            const age = t - tap.born;
            const p = age / 2.0;
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

    // ==================== 5. ESTELAS (FLOW FIELD) + VÓRTICE DE CHISPAS ====================
    const dibujarEstelas = (t: number) => {
      podarTaps(2.3);
      ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
      ctx.fillRect(0, 0, ancho, alto);

      // Corrientes vectoriales fluidas de fondo
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

      // Animación exclusiva de toque: Vórtice de 12 cometas curvos con puntas de chispa ✦
      for (const tap of taps) {
        const age = t - tap.born;
        const p = Math.min(1, age / 2.3);
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

          // Estrella Chispa ✦ en la punta de cada cometa
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
      if (modo === 'halftone') dibujarHalftone(tiempo);
      else if (modo === 'plotter') dibujarPlotter(tiempo);
      else if (modo === 'braille') dibujarBraille(tiempo);
      else if (modo === 'mosaico') dibujarMosaico(tiempo);
      else dibujarEstelas(tiempo);
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
