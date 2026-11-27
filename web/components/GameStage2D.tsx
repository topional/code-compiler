/**
 * Escenario 2D Interactivo estilo Scratch × MakeCode Arcade × Pokémon RPG.
 * Renderiza sprites pixel-art reales en Canvas 2D a 60fps reaccionando EN VIVO
 * al código en español del niño (variables, salidas, combates, dados y despegues).
 */

import React, { useEffect, useRef, useState } from 'react';
import { Gamepad2, Rocket, Shield, Sparkles, Swords } from 'lucide-react';

import { obtenerTema, type TemaId } from '../data/temas';
import type { VariableMemoria } from '../engine/types';

export type TipoEscena2D = 'auto' | 'rpg' | 'aventura' | 'torneo' | 'cohete' | 'chispa';

export interface GameStage2DProps {
  tema: TemaId;
  nombrePrograma: string;
  codigo: string;
  salidas: { id: number; clase: string; texto: string; linea: number | null }[];
  variables: VariableMemoria[];
  estadoEjec: 'inactivo' | 'corriendo' | 'pausado' | 'esperando_paso';
  desactivarAnimacion: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  gravity: number;
}

interface FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

interface Projectile {
  x: number;
  y: number;
  tx: number;
  ty: number;
  p: number;
  color: string;
  kind: 'bolt' | 'fire';
}

// ---- Sprites Pixel-Art Reales (Matrices de 12x12 y 10x10 estilo MakeCode / PICO-8) ----
const SPRITE_HERO = [
  '....pppp....',
  '...pppppp...',
  '..pp1111pp..',
  '..p1w11w1p..',
  '..p1k11k1p..',
  '..pp1111pp..',
  '...ssssss...',
  '..ssppppps..',
  '..s.pppp.s..',
  '....pp.pp...',
  '...pp...pp..',
  '...kk...kk..',
];

const SPRITE_SLIME = [
  '....yyyy....',
  '...y.yy.y...',
  '....yyyy....',
  '..ssssssss..',
  '.ssssssssss.',
  'ssswsssswsss',
  'ssskssssksss',
  'ssssssssssss',
  'sssppppppsss',
  'ssssssssssss',
  '.ssssssssss.',
  '..ss....ss..',
];

const SPRITE_ROCKET = [
  '....pp....',
  '...pppp...',
  '..pppppp..',
  '..ppwwpp..',
  '..ppwwpp..',
  '..pppppp..',
  '.ssppppss.',
  'sssppppsss',
  'ss.pppp.ss',
  '...yyyy...',
];

const SPRITE_CHEST = [
  '.yyyyyyyy.',
  'yppppppppy',
  'ypppyypppy',
  'yyyyyyyyyy',
  'yppppppppy',
  'yppppppppy',
  '.yyyyyyyy.',
];

function drawPixelSprite(
  ctx: CanvasRenderingContext2D,
  grid: string[],
  cx: number,
  cy: number,
  pixelSize: number,
  palette: Record<string, string>,
  flipX = false,
) {
  const rows = grid.length;
  const cols = grid[0].length;
  const startX = cx - (cols * pixelSize) / 2;
  const startY = cy - (rows * pixelSize) / 2;

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const ch = grid[r][flipX ? cols - 1 - c : c];
      if (ch === '.') continue;
      const fill = palette[ch];
      if (!fill) continue;
      ctx.fillStyle = fill;
      ctx.fillRect(
        Math.round(startX + c * pixelSize),
        Math.round(startY + r * pixelSize),
        Math.ceil(pixelSize),
        Math.ceil(pixelSize),
      );
    }
  }
}

export function detectarEscena2D(
  nombre: string,
  codigo: string,
  variables: VariableMemoria[],
): Exclude<TipoEscena2D, 'auto'> {
  const fuente = `${nombre} ${codigo}`.toLowerCase();
  if (/vida_rival|vida_heroe|slime|duelo|llamarada|pokemon|pocion|contraataca|enemigo/.test(fuente)) {
    return 'rpg';
  }
  if (/piedra|tijera|papel|torneo/.test(fuente)) {
    return 'torneo';
  }
  if (/cohete|despeg|espacio|cuenta\s*regresiva/.test(fuente)) {
    return 'cohete';
  }
  if (/dado|tesoro|puente|estrella/.test(fuente)) {
    return 'aventura';
  }
  const varsStr = variables.map((v) => v.nombre).join(' ').toLowerCase();
  if (/vida_rival|vida_heroe/.test(varsStr)) return 'rpg';
  if (/computadora|jugador/.test(varsStr)) return 'torneo';
  if (/cuenta|piloto/.test(varsStr)) return 'cohete';
  if (/dado/.test(varsStr)) return 'aventura';
  return 'chispa';
}

function leerNumVar(vars: VariableMemoria[], nombres: string[], fallback: number): number {
  for (const n of nombres) {
    const found = vars.find((v) => v.nombre.toLowerCase() === n);
    if (found) {
      const parsed = Number(found.valor);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function leerTextoVar(vars: VariableMemoria[], nombres: string[], fallback: string): string {
  for (const n of nombres) {
    const found = vars.find((v) => v.nombre.toLowerCase() === n);
    if (found) return String(found.valor).replace(/^"|"$/g, '');
  }
  return fallback;
}

const ESCENA_OPTIONS: { id: TipoEscena2D; label: string; icon: React.ReactNode }[] = [
  { id: 'auto', label: 'Auto', icon: <Sparkles size={12} aria-hidden="true" /> },
  { id: 'rpg', label: 'RPG', icon: <Swords size={12} aria-hidden="true" /> },
  { id: 'aventura', label: 'Dado', icon: <Shield size={12} aria-hidden="true" /> },
  { id: 'torneo', label: 'Duelo', icon: <Gamepad2 size={12} aria-hidden="true" /> },
  { id: 'cohete', label: 'Cohete', icon: <Rocket size={12} aria-hidden="true" /> },
];

export const GameStage2D: React.FC<GameStage2DProps> = ({
  tema,
  nombrePrograma,
  codigo,
  salidas,
  variables,
  estadoEjec,
  desactivarAnimacion,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [modoManual, setModoManual] = useState<TipoEscena2D>('auto');

  const escenaDetectada = detectarEscena2D(nombrePrograma, codigo, variables);
  const escenaActiva = modoManual === 'auto' ? escenaDetectada : modoManual;

  const temaMeta = obtenerTema(tema);
  const esClaro = temaMeta.grupo === 'Claros' || temaMeta.id === 'high-contrast-light' || temaMeta.id === 'high-contrast-deuteranopia-light' || temaMeta.id === 'high-contrast-sepia';

  // Estado mutable de animaciones 60fps (partículas, proyectiles, sacudida, salto)
  const animRef = useRef({
    heroJump: 0,
    heroLunge: 0,
    enemyShake: 0,
    heroShake: 0,
    diceSpin: 0,
    rocketAlt: 0,
    rocketLaunched: false,
    heroPosX: 0.5,
    heroTargetX: 0.5,
    lastOutCount: 0,
    lastHeroHp: 100,
    lastEnemyHp: 80,
    particles: [] as Particle[],
    floats: [] as FloatText[],
    projectiles: [] as Projectile[],
  });

  // Disparar efectos visuales 2D cada vez que llega una nueva línea de salida o cambia HP
  useEffect(() => {
    const a = animRef.current;
    const accent = temaMeta.muestras[2];
    const sec = temaMeta.muestras[3];

    if (salidas.length < a.lastOutCount) {
      // Nueva ejecución reiniciada
      a.rocketAlt = 0;
      a.rocketLaunched = false;
      a.heroLunge = 0;
      a.enemyShake = 0;
      a.heroShake = 0;
      a.lastHeroHp = 100;
      a.lastEnemyHp = 80;
    }

    if (salidas.length > a.lastOutCount) {
      const nuevas = salidas.slice(a.lastOutCount);
      for (const s of nuevas) {
        const txt = s.texto.toLowerCase();
        // Ignorar líneas de menú ("1: Rayo | 2: Llamarada | 3: Pocion") para no disparar efectos falsos
        if (txt.includes('|')) continue;
        a.heroJump = 1;

        if (/usaste rayo|llamarada solar|ataque|golpe/.test(txt)) {
          a.heroLunge = 1;
          a.enemyShake = 1;
          a.projectiles.push({
            x: 0.28,
            y: 0.66,
            tx: 0.72,
            ty: 0.34,
            p: 0,
            color: /llamarada/.test(txt) ? '#ff6b35' : accent,
            kind: /llamarada/.test(txt) ? 'fire' : 'bolt',
          });
        }
        if (/contraataca|perdiste/.test(txt)) {
          a.heroShake = 1;
        }
        if (/poción mágica|\+25 vida|curaste/.test(txt)) {
          for (let i = 0; i < 12; i += 1) {
            a.particles.push({
              x: 0.25 + (Math.random() - 0.5) * 0.14,
              y: 0.68,
              vx: (Math.random() - 0.5) * 0.12,
              vy: -0.22 - Math.random() * 0.2,
              size: 4,
              color: '#4ade80',
              life: 0,
              maxLife: 1.1,
              gravity: -0.05,
            });
          }
          a.floats.push({ x: 0.26, y: 0.55, text: '+25 HP', color: '#4ade80', life: 0 });
        }
        if (/dado|tirada/.test(txt)) {
          a.diceSpin = 1;
        }
        if (/despeg|espacio|listo/.test(txt) && /despeg/.test(txt)) {
          a.rocketLaunched = true;
        }
        if (/victoria|ganaste|estrella|adivinaste|medalla|súper/.test(txt)) {
          for (let i = 0; i < 24; i += 1) {
            a.particles.push({
              x: 0.5 + (Math.random() - 0.5) * 0.5,
              y: 0.35 + (Math.random() - 0.5) * 0.2,
              vx: (Math.random() - 0.5) * 0.45,
              vy: -0.25 - Math.random() * 0.35,
              size: 4 + (i % 3),
              color: i % 3 === 0 ? accent : i % 3 === 1 ? sec : '#4ade80',
              life: 0,
              maxLife: 1.4,
              gravity: 0.55,
            });
          }
        }
      }
    }
    a.lastOutCount = salidas.length;

    // Detectar daño en RPG por cambio de variables
    const heroHp = leerNumVar(variables, ['vida_heroe', 'vida', 'energia'], 100);
    const enemyHp = leerNumVar(variables, ['vida_rival', 'vida_enemigo', 'enemigo'], 80);
    if (enemyHp < a.lastEnemyHp) {
      const diff = a.lastEnemyHp - enemyHp;
      a.enemyShake = 1;
      a.floats.push({ x: 0.72, y: 0.26, text: `-${diff}!`, color: accent, life: 0 });
    }
    if (heroHp < a.lastHeroHp) {
      const diff = a.lastHeroHp - heroHp;
      a.heroShake = 1;
      a.floats.push({ x: 0.27, y: 0.54, text: `-${diff}!`, color: '#f87171', life: 0 });
    }
    a.lastHeroHp = heroHp;
    a.lastEnemyHp = enemyHp;
  }, [salidas, variables, temaMeta.muestras]);

  // Ref para datos vivos sin reiniciar el bucle RAF
  const liveRef = useRef({
    escenaActiva,
    variables,
    salidas,
    estadoEjec,
    temaMeta,
    esClaro,
  });
  liveRef.current = {
    escenaActiva,
    variables,
    salidas,
    estadoEjec,
    temaMeta,
    esClaro,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let t = 0;
    let w = 480;
    let h = 230;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(240, Math.floor(rect.width));
      h = Math.max(170, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const drawStage = () => {
      const { escenaActiva: sc, variables: vars, salidas: outs, temaMeta: tm } = liveRef.current;
      const a = animRef.current;
      // Leer paleta viva del documento para mantenerse 100 % sincronizado con los 90 temas
      const cs = window.getComputedStyle(document.documentElement);
      const accent = cs.getPropertyValue('--accent').trim() || tm.muestras[2];
      const sec = cs.getPropertyValue('--logo-spark').trim() || cs.getPropertyValue('--info').trim() || tm.muestras[3];
      const dt = desactivarAnimacion ? 0 : 0.016;

      // Decaimiento suave de efectos
      a.heroJump = Math.max(0, a.heroJump - dt * 2.4);
      a.heroLunge = Math.max(0, a.heroLunge - dt * 2.8);
      a.enemyShake = Math.max(0, a.enemyShake - dt * 3.0);
      a.heroShake = Math.max(0, a.heroShake - dt * 3.0);
      a.diceSpin = Math.max(0, a.diceSpin - dt * 1.4);
      a.heroPosX += (a.heroTargetX - a.heroPosX) * 0.08;

      // 1. Fondo atmosférico retro 2D dedicado a cada mundo de juego (estilo Pokémon GBA / MakeCode Arcade)
      const sky = ctx.createLinearGradient(0, 0, 0, h);
      if (sc === 'rpg') {
        sky.addColorStop(0, '#132440');
        sky.addColorStop(0.55, '#1e4d5c');
        sky.addColorStop(1, '#1a3b2e');
      } else if (sc === 'aventura') {
        sky.addColorStop(0, '#1d4ed8');
        sky.addColorStop(0.58, '#38bdf8');
        sky.addColorStop(1, '#bae6fd');
      } else if (sc === 'torneo') {
        sky.addColorStop(0, '#120d26');
        sky.addColorStop(0.65, '#1f1642');
        sky.addColorStop(1, '#2b1848');
      } else if (sc === 'cohete') {
        sky.addColorStop(0, '#050816');
        sky.addColorStop(0.65, '#0f172a');
        sky.addColorStop(1, '#1e293b');
      } else {
        sky.addColorStop(0, '#1e3a8a');
        sky.addColorStop(0.6, '#38bdf8');
        sky.addColorStop(1, '#7dd3fc');
      }
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, w, h);

      // Decoración de cielo: estrellas en cohete/torneo/rpg o nubes pixel + sol en aventura/chispa
      if (sc === 'cohete' || sc === 'torneo' || sc === 'rpg') {
        for (let i = 0; i < 24; i += 1) {
          const sx = (((i * 67.3 + (sc === 'cohete' ? t * 3 : 0)) % 100) / 100) * w;
          const sy = (((i * 29.7 + 5) % 52) / 100) * h;
          const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 2.2 + i));
          ctx.fillStyle = `rgba(255,255,255,${tw.toFixed(2)})`;
          const sz = i % 5 === 0 ? 3 : 2;
          ctx.fillRect(Math.round(sx), Math.round(sy), sz, sz);
        }
      } else {
        // Sol pixel brillante
        ctx.fillStyle = '#fde047';
        ctx.fillRect(Math.round(w * 0.72), 18, 22, 22);
        ctx.fillStyle = 'rgba(253, 224, 71, 0.25)';
        ctx.fillRect(Math.round(w * 0.72) - 5, 13, 32, 32);
        // Nubes pixel blancas suaves
        for (let i = 0; i < 5; i += 1) {
          const cx = (((i * 118 + t * 10) % (w + 80)) - 40);
          const cy = 22 + (i % 3) * 18;
          ctx.fillStyle = 'rgba(255,255,255,0.88)';
          ctx.fillRect(Math.round(cx), cy, 34, 10);
          ctx.fillRect(Math.round(cx) + 6, cy - 5, 20, 6);
        }
      }

      const heroPalette: Record<string, string> = {
        p: accent,
        s: sec,
        '1': '#fde68a',
        w: '#ffffff',
        k: '#0f172a',
      };
      const slimePalette: Record<string, string> = {
        s: '#34d399',
        p: '#059669',
        y: '#facc15',
        w: '#ffffff',
        k: '#0f172a',
      };

      const ultimaSalida = [...outs].reverse().find((o) => o.clase === 'salida')?.texto ?? '';

      // ======================== ESCENA 1: DUELO RPG POKÉMON ========================
      if (sc === 'rpg') {
        // Montañas pixel en horizonte
        ctx.fillStyle = '#183847';
        for (let m = 0; m < 6; m += 1) {
          const mx = m * (w / 5);
          ctx.beginPath();
          ctx.moveTo(mx - 40, h * 0.56);
          ctx.lineTo(mx + 35, h * 0.34 + (m % 2) * 14);
          ctx.lineTo(mx + 110, h * 0.56);
          ctx.closePath();
          ctx.fill();
        }
        // Suelo pradera pixel esmeralda con patrón retro
        ctx.fillStyle = '#1f5c3a';
        ctx.fillRect(0, h * 0.56, w, h * 0.44);
        ctx.fillStyle = '#256e45';
        for (let gx = 0; gx < w; gx += 28) {
          ctx.fillRect(gx, h * 0.56, 14, h * 0.44);
        }
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(0, h * 0.56, w, 3);

        // Plataformas ovaladas estilo Pokémon GBA
        const drawPad = (px: number, py: number, rx: number, ry: number) => {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
          ctx.beginPath();
          ctx.ellipse(px, py + 4, rx + 3, ry + 1, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#34d399';
          ctx.beginPath();
          ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#a7f3d0';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        };
        drawPad(w * 0.25, h * 0.77, 58, 15);
        drawPad(w * 0.74, h * 0.47, 54, 14);

        const heroHp = Math.max(0, leerNumVar(vars, ['vida_heroe', 'vida', 'energia'], 100));
        const enemyHp = Math.max(0, leerNumVar(vars, ['vida_rival', 'vida_enemigo', 'enemigo'], 80));
        const heroPct = Math.min(1, heroHp / 100);
        const enemyPct = Math.min(1, enemyHp / 80);

        // Rival (Slime Rey) arriba derecha
        const ex = w * 0.74 + Math.sin(t * 28) * a.enemyShake * 7;
        const ey = h * 0.35 + Math.sin(t * 3.4) * 3;
        if (enemyHp > 0) {
          drawPixelSprite(
            ctx,
            SPRITE_SLIME,
            ex,
            ey,
            4.3,
            a.enemyShake > 0.5 ? { ...slimePalette, s: '#ffffff', p: '#ff4d6d' } : slimePalette,
          );
        } else {
          ctx.fillStyle = '#fde047';
          ctx.font = '700 13px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('★ DERROTADO ★', ex, ey);
        }

        // Héroe (Chispa) abajo izquierda
        const hx = w * 0.25 + a.heroLunge * 36 + Math.sin(t * 28) * a.heroShake * 6;
        const hy = h * 0.64 - Math.sin(a.heroJump * Math.PI) * 14 + Math.sin(t * 4) * 2;
        drawPixelSprite(
          ctx,
          SPRITE_HERO,
          hx,
          hy,
          4.7,
          a.heroShake > 0.5 ? { ...heroPalette, p: '#f87171' } : heroPalette,
        );

        // Barras de HP estilo Pokémon con alto contraste
        const drawHpCard = (x: number, y: number, title: string, hp: number, max: number, pct: number) => {
          const cw = 142;
          const ch = 36;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
          ctx.strokeStyle = accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x, y, cw, ch, 7);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#f8fafc';
          ctx.font = '700 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(title, x + 8, y + 13);
          ctx.textAlign = 'right';
          ctx.fillText(`${hp}/${max}`, x + cw - 8, y + 13);

          ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
          ctx.fillRect(x + 8, y + 20, cw - 16, 8);
          ctx.fillStyle = pct > 0.5 ? '#4ade80' : pct > 0.22 ? '#facc15' : '#f87171';
          ctx.fillRect(x + 8, y + 20, Math.round((cw - 16) * pct), 8);
        };

        drawHpCard(12, 12, 'SLIME REY', enemyHp, 80, enemyPct);
        drawHpCard(w - 154, h - 64, 'CHISPA NV.5', heroHp, 100, heroPct);

        // Proyectiles de ataque volando al rival
        for (let i = a.projectiles.length - 1; i >= 0; i -= 1) {
          const pr = a.projectiles[i];
          pr.p += dt * 2.8;
          if (pr.p >= 1) {
            for (let k = 0; k < 14; k += 1) {
              a.particles.push({
                x: pr.tx,
                y: pr.ty,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: 4,
                color: pr.color,
                life: 0,
                maxLife: 0.7,
                gravity: 0.3,
              });
            }
            a.projectiles.splice(i, 1);
            continue;
          }
          const px = (pr.x + (pr.tx - pr.x) * pr.p) * w;
          const py = (pr.y + (pr.ty - pr.y) * pr.p) * h;
          ctx.fillStyle = pr.color;
          ctx.beginPath();
          ctx.arc(px, py, pr.kind === 'fire' ? 11 : 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ======================== ESCENA 2: AVENTURA DEL DADO ========================
      else if (sc === 'aventura') {
        const dado = Math.max(1, Math.min(6, Math.round(leerNumVar(vars, ['dado', 'pasos', 'numero'], 1))));
        // Colinas verdes pixel + pradera + sendero de madera
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(w * 0.22, h * 0.78, 95, Math.PI, Math.PI * 2);
        ctx.arc(w * 0.65, h * 0.8, 120, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(0, h * 0.64, w, h * 0.36);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(0, h * 0.64, w, 4);

        // Sendero conectando las 6 casillas
        const padX = 46;
        const stepW = (w - padX * 2) / 5;
        ctx.fillStyle = '#92400e';
        ctx.fillRect(padX, h * 0.71 - 3, stepW * 5, 6);

        for (let i = 1; i <= 6; i += 1) {
          const tx = padX + (i - 1) * stepW;
          const ty = h * 0.71;
          const reached = i <= dado;
          ctx.fillStyle = reached ? '#fde047' : '#f8fafc';
          ctx.strokeStyle = reached ? '#b45309' : '#334155';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(tx - 19, ty - 12, 38, 24, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#0f172a';
          ctx.font = '700 11px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(String(i), tx, ty + 4);
        }

        // Cofre del tesoro dorado en la casilla 6 (desplazado ligeramente a la derecha si el héroe llega a 6)
        const chestX = padX + 5 * stepW + (dado === 6 ? 18 : 0);
        drawPixelSprite(ctx, SPRITE_CHEST, chestX, h * 0.56, 3.6, {
          y: '#facc15',
          p: '#b45309',
        });

        // Héroe saltando a la casilla del dado
        const targetTileX = padX + (dado - 1) * stepW - (dado === 6 ? 18 : 0);
        const hy = h * 0.50 - Math.sin(a.heroJump * Math.PI) * 18 + Math.sin(t * 4) * 2;
        drawPixelSprite(ctx, SPRITE_HERO, targetTileX, hy, 4.2, heroPalette);

        // Dado pixel-art giratorio arriba izquierda
        const dx = 40;
        const dy = 38;
        ctx.save();
        ctx.translate(dx, dy);
        ctx.rotate(a.diceSpin * Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(-20, -20, 40, 40, 8);
        ctx.fill();
        ctx.stroke();

        const pips: Record<number, [number, number][]> = {
          1: [[0, 0]],
          2: [[-8, -8], [8, 8]],
          3: [[-8, -8], [0, 0], [8, 8]],
          4: [[-8, -8], [8, -8], [-8, 8], [8, 8]],
          5: [[-8, -8], [8, -8], [0, 0], [-8, 8], [8, 8]],
          6: [[-8, -10], [8, -10], [-8, 0], [8, 0], [-8, 10], [8, 10]],
        };
        ctx.fillStyle = '#0f172a';
        for (const [px, py] of pips[dado] ?? pips[1]) {
          ctx.beginPath();
          ctx.arc(px, py, 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // ======================== ESCENA 3: TORNEO PIEDRA, PAPEL O TIJERA ========================
      else if (sc === 'torneo') {
        const jug = Math.round(leerNumVar(vars, ['jugador'], 0));
        const cpu = Math.round(leerNumVar(vars, ['computadora'], 0));
        const labels: Record<number, string> = { 1: 'PIEDRA', 2: 'PAPEL', 3: 'TIJERA' };

        // Focos del estadio arcade
        ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
        ctx.beginPath();
        ctx.moveTo(w * 0.25, 0);
        ctx.lineTo(w * 0.06, h);
        ctx.lineTo(w * 0.44, h);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(244, 114, 182, 0.16)';
        ctx.beginPath();
        ctx.moveTo(w * 0.75, 0);
        ctx.lineTo(w * 0.56, h);
        ctx.lineTo(w * 0.94, h);
        ctx.closePath();
        ctx.fill();

        // Piso del ring arcade
        ctx.fillStyle = '#312e81';
        ctx.fillRect(0, h * 0.7, w, h * 0.3);
        ctx.fillStyle = accent;
        ctx.fillRect(0, h * 0.7, w, 3);

        // Dos luchadores en el ring
        drawPixelSprite(ctx, SPRITE_HERO, w * 0.24, h * 0.56 + Math.sin(t * 4) * 3, 4.5, heroPalette);
        drawPixelSprite(ctx, SPRITE_SLIME, w * 0.76, h * 0.56 + Math.cos(t * 4) * 3, 4.5, slimePalette, true);

        // VS central + tarjetas de elección
        ctx.fillStyle = '#fde047';
        ctx.font = '700 20px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('VS', w * 0.5, h * 0.54);

        const drawChoiceBadge = (cx: number, title: string, choice: string, col: string) => {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.strokeStyle = col;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(cx - 48, 14, 96, 38, 8);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = col;
          ctx.font = '700 9px "JetBrains Mono", monospace';
          ctx.fillText(title, cx, 28);
          ctx.fillStyle = '#f8fafc';
          ctx.font = '700 12px "JetBrains Mono", monospace';
          ctx.fillText(choice, cx, 44);
        };
        drawChoiceBadge(w * 0.24, 'TÚ', labels[jug] ?? 'ELIGE...', '#38bdf8');
        drawChoiceBadge(w * 0.76, 'RIVAL', jug > 0 ? labels[cpu] ?? '?' : '???', '#f472b6');
      }

      // ======================== ESCENA 4: DESPEGUE DE COHETE ========================
      else if (sc === 'cohete') {
        const cuenta = leerNumVar(vars, ['cuenta', 'contador'], 5);
        if (a.rocketLaunched || cuenta <= 0) {
          a.rocketAlt = Math.min(h * 0.44, a.rocketAlt + dt * 95);
        }

        // Planeta con anillos en el fondo espacial
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(w * 0.2, h * 0.34, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(w * 0.2, h * 0.34, 28, 7, -0.3, 0, Math.PI * 2);
        ctx.stroke();

        // Superficie lunar con cráteres + torre de lanzamiento
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, h * 0.78, w, h * 0.22);
        ctx.fillStyle = '#475569';
        ctx.fillRect(0, h * 0.78, w, 3);
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(w * 0.24, h * 0.85, 18, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(w * 0.76, h * 0.84, 22, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Torre metálica de despegue
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(w * 0.5 - 52, h * 0.4, 8, h * 0.38);
        ctx.fillRect(w * 0.5 - 52, h * 0.46, 30, 5);
        ctx.fillRect(w * 0.5 - 52, h * 0.62, 26, 4);

        const rx = w * 0.5 + (a.rocketAlt > 0 && a.rocketAlt < h * 0.4 ? Math.sin(t * 40) * 2.5 : 0);
        const ry = h * 0.62 - a.rocketAlt;

        // Llama propulsora + humo pixel
        if (a.rocketAlt > 0 || cuenta <= 2) {
          const flameH = 22 + Math.sin(t * 32) * 8 + (a.rocketAlt > 0 ? 18 : 0);
          ctx.fillStyle = 'rgba(226, 232, 240, 0.35)';
          ctx.beginPath();
          ctx.arc(rx - 14, h * 0.76, 12 + Math.sin(t * 10) * 3, 0, Math.PI * 2);
          ctx.arc(rx + 14, h * 0.76, 12 + Math.cos(t * 10) * 3, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ff6b35';
          ctx.beginPath();
          ctx.moveTo(rx - 12, ry + 22);
          ctx.lineTo(rx, ry + 22 + flameH);
          ctx.lineTo(rx + 12, ry + 22);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.moveTo(rx - 6, ry + 22);
          ctx.lineTo(rx, ry + 22 + flameH * 0.62);
          ctx.lineTo(rx + 6, ry + 22);
          ctx.closePath();
          ctx.fill();
        }

        drawPixelSprite(ctx, SPRITE_ROCKET, rx, ry, 4.6, {
          p: '#f8fafc',
          s: accent,
          w: '#38bdf8',
          y: '#facc15',
        });

        // Contador grande estilo NASA
        ctx.fillStyle = '#fde047';
        ctx.font = '700 18px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(a.rocketAlt > 12 ? '★ ¡EN ÓRBITA! ★' : `T-${Math.max(0, cuenta)}`, 14, 30);
      }

      // ======================== ESCENA 5: PARQUE CHISPA (ESTILO SCRATCH) ========================
      else {
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(w * 0.25, h * 0.9, 110, Math.PI, Math.PI * 2);
        ctx.arc(w * 0.78, h * 0.94, 130, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(0, h * 0.74, w, h * 0.26);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(0, h * 0.74, w, 4);

        const hx = w * a.heroPosX;
        const hy = h * 0.62 - Math.sin(a.heroJump * Math.PI) * 20 + Math.sin(t * 3.8) * 2.5;
        drawPixelSprite(ctx, SPRITE_HERO, hx, hy, 4.8, heroPalette);

        // Burbuja de diálogo cómic estilo Scratch con el último `mostrar`
        const nombreHero = leerTextoVar(vars, ['nombre', 'piloto', 'heroe'], 'Chispa');
        const msg = ultimaSalida || `¡Hola! Soy ${nombreHero}`;
        const clipped = msg.length > 34 ? `${msg.slice(0, 33)}…` : msg;
        ctx.font = '700 11px "JetBrains Mono", monospace';
        const tw = Math.min(w - 32, Math.max(110, ctx.measureText(clipped).width + 24));
        const bx = Math.max(12, Math.min(w - tw - 12, hx - tw * 0.5));
        const by = Math.max(12, hy - 74);

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(bx, by, tw, 30, 10);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.fillText(clipped, bx + tw * 0.5, by + 19);
      }

      // 2. Monitores de Variables estilo Scratch en la esquina superior derecha (si hay variables)
      if (sc !== 'rpg' && sc !== 'torneo' && vars.length > 0) {
        const showVars = vars.slice(0, 3);
        let vy = 10;
        ctx.font = '700 10px "JetBrains Mono", monospace';
        for (const v of showVars) {
          const text = `${v.nombre}: ${v.valor}`;
          const bw = Math.min(165, ctx.measureText(text).width + 18);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
          ctx.strokeStyle = accent;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.roundRect(w - bw - 10, vy, bw, 20, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#f8fafc';
          ctx.textAlign = 'right';
          ctx.fillText(text, w - 18, vy + 13.5);
          vy += 24;
        }
      }

      // 3. Partículas pixel-art y textos flotantes (-24!, +25 HP)
      for (let i = a.particles.length - 1; i >= 0; i -= 1) {
        const pt = a.particles[i];
        pt.life += dt;
        if (pt.life >= pt.maxLife) {
          a.particles.splice(i, 1);
          continue;
        }
        pt.vy += pt.gravity * dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        ctx.globalAlpha = Math.max(0, 1 - pt.life / pt.maxLife);
        ctx.fillStyle = pt.color;
        ctx.fillRect(Math.round(pt.x * w), Math.round(pt.y * h), pt.size, pt.size);
        ctx.globalAlpha = 1;
      }

      for (let i = a.floats.length - 1; i >= 0; i -= 1) {
        const fl = a.floats[i];
        fl.life += dt;
        if (fl.life >= 1.3) {
          a.floats.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = Math.max(0, 1 - fl.life / 1.3);
        ctx.fillStyle = fl.color;
        ctx.font = '700 14px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(fl.text, fl.x * w, (fl.y - fl.life * 0.14) * h);
        ctx.globalAlpha = 1;
      }

      // Barra retro de diálogo del juego (siempre alto contraste sobre cualquier escenario)
      if (sc !== 'chispa' && ultimaSalida) {
        const trimmed = ultimaSalida.length > 48 ? `${ultimaSalida.slice(0, 47)}…` : ultimaSalida;
        ctx.fillStyle = 'rgba(11, 16, 28, 0.9)';
        ctx.fillRect(0, h - 24, w, 24);
        ctx.fillStyle = accent;
        ctx.fillRect(0, h - 24, w, 1.5);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`▶ ${trimmed}`, 10, h - 8);
      }
    };

    const loop = () => {
      if (!desactivarAnimacion) t += 0.016;
      drawStage();
      if (!desactivarAnimacion) rafId = window.requestAnimationFrame(loop);
    };
    loop();

    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [desactivarAnimacion]);

  const handleStageClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / Math.max(1, rect.width);
    const ny = (e.clientY - rect.top) / Math.max(1, rect.height);
    const a = animRef.current;
    a.heroTargetX = Math.max(0.14, Math.min(0.86, nx));
    a.heroJump = 1;
    const accent = temaMeta.muestras[2];
    const sec = temaMeta.muestras[3];
    for (let i = 0; i < 10; i += 1) {
      a.particles.push({
        x: nx,
        y: ny,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.15 - Math.random() * 0.3,
        size: 4,
        color: i % 2 === 0 ? accent : sec,
        life: 0,
        maxLife: 0.9,
        gravity: 0.45,
      });
    }
  };

  return (
    <div className="game-stage-shell" data-stage-scene={escenaActiva}>
      <div className="game-stage-bar">
        <span className="game-stage-title">
          <Gamepad2 size={13} aria-hidden="true" style={{ color: 'var(--accent)' }} />
          <span>Escenario 2D</span>
          <span className="pill-mini ok">
            {escenaActiva === 'rpg'
              ? 'Duelo RPG'
              : escenaActiva === 'aventura'
                ? 'Dado Mágico'
                : escenaActiva === 'torneo'
                  ? 'Torneo'
                  : escenaActiva === 'cohete'
                    ? 'Cohete'
                    : 'Parque Chispa'}
          </span>
        </span>
        <div className="game-stage-modes" role="group" aria-label="Elegir escenario 2D">
          {ESCENA_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="stage-mode-pill"
              aria-pressed={modoManual === opt.id}
              onClick={() => setModoManual(opt.id)}
            >
              {opt.icon}
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="game-stage-canvas"
        onClick={handleStageClick}
        aria-label="Escenario interactivo de juego 2D"
        title="Haz clic en el escenario para mover a Chispa y lanzar chispas"
      />
    </div>
  );
};
