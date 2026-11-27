/**
 * Escenario 2D Interactivo 16-bit estilo Scratch × MakeCode Arcade × Pokémon GBA.
 * 6 mundos pixel-art únicos y detallados a 60 fps que reaccionan EN VIVO
 * al código en español del niño:
 *  1. rpg      — Batalla RPG estilo Pokémon GBA (bosque, luna, rayo zigzag, llamarada, HP)
 *  2. aventura — Isla del Tesoro del Dado Mágico (mar con olas, palmeras, puente, cofre que se abre)
 *  3. torneo   — Estadio Arcade Piedra, Papel o Tijera (gradas animadas, reflectores, sprites de jugada)
 *  4. cohete   — Base Lunar NASA 3-2-1 (nebulosa, Saturno, brazos de torre que se abren, altímetro)
 *  5. boveda   — Bóveda Secreta y Laboratorio (engranajes, dial giratorio, calor/frío, gemas)
 *  6. chispa   — Parque Chispa 16-bit (montañas pixel, árboles, flores, valla, mariposas, diálogo cómic)
 */

import React, { useEffect, useRef, useState } from 'react';
import { Gamepad2, KeyRound, Rocket, Shield, Sparkles, Swords } from 'lucide-react';

import { obtenerTema, type TemaId } from '../data/temas';
import type { VariableMemoria } from '../engine/types';

export type TipoEscena2D = 'auto' | 'rpg' | 'aventura' | 'torneo' | 'cohete' | 'boveda' | 'chispa';

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

// ---- Sprites Pixel-Art 16-bit Detallados ----
const SPRITE_HERO_14 = [
  '.....pppp.....',
  '....pppppp....',
  '...pp1111pp...',
  '...p1w11w1p...',
  '...p1k11k1p...',
  '...pp1111pp...',
  '..cssssssssc..',
  '.ccsppppppscc.',
  '.c.spppppps.c.',
  '...spppppps...',
  '....pp..pp....',
  '....pp..pp....',
  '...kk....kk...',
];

const SPRITE_HERO_WALK = [
  '.....pppp.....',
  '....pppppp....',
  '...pp1111pp...',
  '...p1w11w1p...',
  '...p1k11k1p...',
  '...pp1111pp...',
  '..cssssssssc..',
  '.ccsppppppscc.',
  '..csppppppsc..',
  '...spppppps...',
  '...pp....pp...',
  '..kk......kk..',
  '..............',
];

const SPRITE_SLIME_KING = [
  '....y..y..y...',
  '....yyyyyyy...',
  '....yyryryy...',
  '....yyyyyyy...',
  '..ssssssssss..',
  '.ssllssssllss.',
  'ssslsssssslsss',
  'ssswksssswksss',
  'ssskksssskksss',
  'ssssssssssssss',
  'sssppppppppsss',
  '.ssssssssssss.',
  '..ssssssssss..',
];

const SPRITE_SLIME_HURT = [
  '....y..y..y...',
  '....yyyyyyy...',
  '....yyryryy...',
  '....yyyyyyy...',
  '..ssssssssss..',
  '.ssssssssssss.',
  'sssksskkssksss',
  'ssssksssskssss',
  'sssksskkssksss',
  'ssssssssssssss',
  'ssssrrrrrrssss',
  '.ssssssssssss.',
  '..ssssssssss..',
];

const SPRITE_ROCKET_14 = [
  '......pp......',
  '.....pppp.....',
  '....pppppp....',
  '....ppwwpp....',
  '...ppwbbwpp...',
  '...ppwbbwpp...',
  '...ppwwwwpp...',
  '...pppppppp...',
  '..ssppppppss..',
  '.sssppppppsss.',
  'sss.pppppp.sss',
  'ss..pppppp..ss',
  '....yyyyyy....',
];

const SPRITE_CHEST_CLOSED = [
  '.yyyyyyyyyy.',
  'yppppppppppy',
  'ypppyyyypppy',
  'yyyyyyyyyyyy',
  'yppppyyppppy',
  'yppppppppppy',
  'yppppppppppy',
  '.yyyyyyyyyy.',
];

const SPRITE_CHEST_OPEN = [
  '.yyyyyyyyyy.',
  'yggggggggggy',
  'ygwwggggwwgy',
  'yyyyyyyyyyyy',
  'yppppyyppppy',
  'yppppppppppy',
  '.yyyyyyyyyy.',
];

const SPRITE_ROCK = [
  '...gggggg...',
  '..gllllggg..',
  '.gllggggggg.',
  'gllggggddggg',
  'ggggggddddgg',
  '.ggggddddgg.',
  '..ggggddgg..',
];

const SPRITE_PAPER = [
  '.wwwwwwww.',
  'wbbbbbbbbw',
  'wwwwwwwwww',
  'wbbbbbbwww',
  'wwwwwwwwww',
  'wbbbbbbwww',
  'wwwwwwwwww',
  '.wwwwwwww.',
];

const SPRITE_SCISSORS = [
  's........s',
  '.s......s.',
  '..s....s..',
  '...ssss...',
  '...ssss...',
  '..r....r..',
  '.r.r..r.r.',
  '..r....r..',
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

function drawPixelTree(ctx: CanvasRenderingContext2D, x: number, groundY: number, scale = 1) {
  const s = scale;
  ctx.fillStyle = '#78350f';
  ctx.fillRect(Math.round(x - 4 * s), Math.round(groundY - 22 * s), Math.round(8 * s), Math.round(22 * s));
  ctx.fillStyle = '#15803d';
  ctx.fillRect(Math.round(x - 16 * s), Math.round(groundY - 40 * s), Math.round(32 * s), Math.round(18 * s));
  ctx.fillStyle = '#22c55e';
  ctx.fillRect(Math.round(x - 12 * s), Math.round(groundY - 50 * s), Math.round(24 * s), Math.round(14 * s));
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(Math.round(x - 8 * s), Math.round(groundY - 54 * s), Math.round(12 * s), Math.round(6 * s));
}

function drawPalmTree(ctx: CanvasRenderingContext2D, x: number, groundY: number, sway: number) {
  ctx.fillStyle = '#92400e';
  for (let i = 0; i < 6; i += 1) {
    ctx.fillRect(Math.round(x - 3 + i * 1.4 + sway * i * 0.25), Math.round(groundY - 7 * (i + 1)), 6, 7);
  }
  const topX = x + 8 + sway * 1.5;
  const topY = groundY - 44;
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(Math.round(topX - 18), Math.round(topY - 2), 18, 6);
  ctx.fillRect(Math.round(topX), Math.round(topY - 4), 18, 6);
  ctx.fillRect(Math.round(topX - 14), Math.round(topY - 10), 14, 6);
  ctx.fillRect(Math.round(topX + 2), Math.round(topY - 10), 14, 6);
  ctx.fillStyle = '#713f12';
  ctx.fillRect(Math.round(topX - 3), Math.round(topY + 2), 4, 4);
  ctx.fillRect(Math.round(topX + 2), Math.round(topY + 3), 4, 4);
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
  if (/secreto|adivina|calculadora|boveda|operacion|primero/.test(fuente)) {
    return 'boveda';
  }
  const varsStr = variables.map((v) => v.nombre).join(' ').toLowerCase();
  if (/vida_rival|vida_heroe/.test(varsStr)) return 'rpg';
  if (/computadora|jugador/.test(varsStr)) return 'torneo';
  if (/cuenta|piloto/.test(varsStr)) return 'cohete';
  if (/dado/.test(varsStr)) return 'aventura';
  if (/secreto|intento|opcion/.test(varsStr)) return 'boveda';
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
  { id: 'auto', label: 'Auto', icon: <Sparkles size={11} aria-hidden="true" /> },
  { id: 'rpg', label: 'RPG', icon: <Swords size={11} aria-hidden="true" /> },
  { id: 'aventura', label: 'Dado', icon: <Shield size={11} aria-hidden="true" /> },
  { id: 'torneo', label: 'Duelo', icon: <Gamepad2 size={11} aria-hidden="true" /> },
  { id: 'cohete', label: 'Cohete', icon: <Rocket size={11} aria-hidden="true" /> },
  { id: 'boveda', label: 'Bóveda', icon: <KeyRound size={11} aria-hidden="true" /> },
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
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);

  const escenaDetectada = detectarEscena2D(nombrePrograma, codigo, variables);
  const escenaActiva = modoManual === 'auto' ? escenaDetectada : modoManual;

  const temaMeta = obtenerTema(tema);

  const animRef = useRef({
    heroJump: 0,
    heroLunge: 0,
    enemyShake: 0,
    heroShake: 0,
    diceSpin: 0,
    rocketAlt: 0,
    rocketLaunched: false,
    dialAngle: 0,
    heroPosX: 0.5,
    heroTargetX: 0.5,
    lastOutCount: 0,
    lastHeroHp: 100,
    lastEnemyHp: 80,
    particles: [] as Particle[],
    floats: [] as FloatText[],
    projectiles: [] as Projectile[],
  });

  useEffect(() => {
    const a = animRef.current;
    const accent = temaMeta.muestras[2];

    if (salidas.length < a.lastOutCount) {
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
        if (txt.includes('|')) continue;
        a.heroJump = 1;

        if (/usaste rayo|llamarada solar|ataque|golpe/.test(txt)) {
          a.heroLunge = 1;
          a.enemyShake = 1;
          a.projectiles.push({
            x: 0.28,
            y: 0.65,
            tx: 0.73,
            ty: 0.35,
            p: 0,
            color: /llamarada/.test(txt) ? '#ff6b35' : '#38bdf8',
            kind: /llamarada/.test(txt) ? 'fire' : 'bolt',
          });
        }
        if (/contraataca|perdiste/.test(txt)) {
          a.heroShake = 1;
        }
        if (/poción mágica|\+25 vida|curaste/.test(txt)) {
          for (let i = 0; i < 14; i += 1) {
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
          a.floats.push({ x: 0.26, y: 0.53, text: '+25 HP', color: '#4ade80', life: 0 });
        }
        if (/dado|tirada/.test(txt)) {
          a.diceSpin = 1;
        }
        if (/despeg/.test(txt)) {
          a.rocketLaunched = true;
        }
        if (/victoria|ganaste|estrella|adivinaste|medalla|súper|resultado/.test(txt)) {
          for (let i = 0; i < 28; i += 1) {
            a.particles.push({
              x: 0.5 + (Math.random() - 0.5) * 0.5,
              y: 0.36 + (Math.random() - 0.5) * 0.2,
              vx: (Math.random() - 0.5) * 0.5,
              vy: -0.25 - Math.random() * 0.4,
              size: 4 + (i % 3),
              color: i % 3 === 0 ? accent : i % 3 === 1 ? '#fde047' : '#4ade80',
              life: 0,
              maxLife: 1.5,
              gravity: 0.55,
            });
          }
        }
      }
    }
    a.lastOutCount = salidas.length;

    const heroHp = leerNumVar(variables, ['vida_heroe', 'vida', 'energia'], 100);
    const enemyHp = leerNumVar(variables, ['vida_rival', 'vida_enemigo', 'enemigo'], 80);
    if (enemyHp < a.lastEnemyHp) {
      const diff = a.lastEnemyHp - enemyHp;
      a.enemyShake = 1;
      a.floats.push({ x: 0.73, y: 0.24, text: `-${diff}!`, color: '#fde047', life: 0 });
    }
    if (heroHp < a.lastHeroHp) {
      const diff = a.lastHeroHp - heroHp;
      a.heroShake = 1;
      a.floats.push({ x: 0.26, y: 0.5, text: `-${diff}!`, color: '#f87171', life: 0 });
    }
    a.lastHeroHp = heroHp;
    a.lastEnemyHp = enemyHp;
  }, [salidas, variables, temaMeta.muestras]);

  const liveRef = useRef({
    escenaActiva,
    variables,
    salidas,
    estadoEjec,
    temaMeta,
  });
  liveRef.current = { escenaActiva, variables, salidas, estadoEjec, temaMeta };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let t = 0;
    let w = 480;
    let h = 248;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(260, Math.floor(rect.width));
      h = Math.max(196, Math.floor(rect.height));
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
      const cs = window.getComputedStyle(document.documentElement);
      const accent = cs.getPropertyValue('--accent').trim() || tm.muestras[2];
      const sec = cs.getPropertyValue('--logo-spark').trim() || cs.getPropertyValue('--info').trim() || tm.muestras[3];
      const dt = desactivarAnimacion ? 0 : 0.016;

      a.heroJump = Math.max(0, a.heroJump - dt * 2.4);
      a.heroLunge = Math.max(0, a.heroLunge - dt * 2.8);
      a.enemyShake = Math.max(0, a.enemyShake - dt * 3.0);
      a.heroShake = Math.max(0, a.heroShake - dt * 3.0);
      a.diceSpin = Math.max(0, a.diceSpin - dt * 1.4);
      const moving = Math.abs(a.heroTargetX - a.heroPosX) > 0.012;
      a.heroPosX += (a.heroTargetX - a.heroPosX) * 0.09;

      const heroPalette: Record<string, string> = {
        p: accent,
        s: sec,
        c: '#f97316',
        '1': '#fde68a',
        w: '#ffffff',
        k: '#0f172a',
      };
      const slimePalette: Record<string, string> = {
        s: '#22c55e',
        l: '#86efac',
        p: '#15803d',
        y: '#facc15',
        r: '#ef4444',
        w: '#ffffff',
        k: '#0f172a',
      };

      const ultimaSalida = [...outs].reverse().find((o) => o.clase === 'salida')?.texto ?? '';

      // ======================== 1. BATALLA RPG POKÉMON GBA 16-BIT ========================
      if (sc === 'rpg') {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, '#0c142c');
        sky.addColorStop(0.45, '#1d3557');
        sky.addColorStop(0.62, '#2a5a6a');
        sky.addColorStop(1, '#143628');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // Luna creciente + estrellas titilantes
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(w * 0.48, 28, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#12203f';
        ctx.beginPath();
        ctx.arc(w * 0.48 + 5, 25, 10, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < 22; i += 1) {
          const sx = ((i * 53.7) % 100) / 100 * w;
          const sy = ((i * 23.1 + 4) % 44) / 100 * h;
          const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * 2 + i));
          ctx.fillStyle = `rgba(255,255,255,${tw.toFixed(2)})`;
          ctx.fillRect(Math.round(sx), Math.round(sy), i % 4 === 0 ? 3 : 2, i % 4 === 0 ? 3 : 2);
        }

        // Silueta de bosque de pinos pixel en el horizonte
        ctx.fillStyle = '#112a36';
        for (let px = 0; px < w + 24; px += 22) {
          const ph = 24 + ((px * 7) % 18);
          ctx.beginPath();
          ctx.moveTo(px - 14, h * 0.56);
          ctx.lineTo(px, h * 0.56 - ph);
          ctx.lineTo(px + 14, h * 0.56);
          ctx.closePath();
          ctx.fill();
        }

        // Pradera esmeralda con franjas de hierba pixelada
        ctx.fillStyle = '#1b4d33';
        ctx.fillRect(0, h * 0.56, w, h * 0.44);
        ctx.fillStyle = '#225e3f';
        for (let gx = 0; gx < w; gx += 32) {
          ctx.fillRect(gx, h * 0.56, 16, h * 0.44);
        }
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(0, h * 0.56, w, 3);

        // Briznas de hierba animadas con viento
        ctx.fillStyle = '#34d399';
        for (let b = 0; b < 14; b += 1) {
          const bx = ((b * 43 + 18) % w);
          const by = h * 0.62 + (b % 3) * 20;
          const lean = Math.round(Math.sin(t * 3 + b) * 2);
          ctx.fillRect(bx, by, 2, 6);
          ctx.fillRect(bx + lean, by - 3, 2, 4);
        }

        // Plataformas ovaladas estilo Pokémon GBA con doble borde y sombra
        const drawPad = (px: number, py: number, rx: number, ry: number) => {
          ctx.fillStyle = 'rgba(2, 6, 23, 0.42)';
          ctx.beginPath();
          ctx.ellipse(px, py + 5, rx + 4, ry + 1, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#2dd4bf';
          ctx.beginPath();
          ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#5eead4';
          ctx.beginPath();
          ctx.ellipse(px, py - 2, rx * 0.78, ry * 0.68, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ccfbf1';
          ctx.lineWidth = 2;
          ctx.stroke();
        };
        drawPad(w * 0.25, h * 0.77, 60, 15);
        drawPad(w * 0.74, h * 0.48, 56, 14);

        const heroHp = Math.max(0, leerNumVar(vars, ['vida_heroe', 'vida', 'energia'], 100));
        const enemyHp = Math.max(0, leerNumVar(vars, ['vida_rival', 'vida_enemigo', 'enemigo'], 80));
        const heroPct = Math.min(1, heroHp / 100);
        const enemyPct = Math.min(1, enemyHp / 80);

        const ex = w * 0.74 + Math.sin(t * 32) * a.enemyShake * 8;
        const ey = h * 0.34 + Math.sin(t * 3.8) * 3.5;
        if (enemyHp > 0) {
          drawPixelSprite(
            ctx,
            a.enemyShake > 0.25 ? SPRITE_SLIME_HURT : SPRITE_SLIME_KING,
            ex,
            ey,
            4.1,
            a.enemyShake > 0.5 ? { ...slimePalette, s: '#ffffff', l: '#fecaca' } : slimePalette,
          );
        } else {
          ctx.fillStyle = '#fde047';
          ctx.font = '700 13px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('★ ¡VICTORIA! ★', ex, ey);
        }

        const hx = w * 0.25 + a.heroLunge * 40 + Math.sin(t * 32) * a.heroShake * 7;
        const hy = h * 0.64 - Math.sin(a.heroJump * Math.PI) * 14 + Math.sin(t * 4) * 2;
        drawPixelSprite(
          ctx,
          SPRITE_HERO_14,
          hx,
          hy,
          4.3,
          a.heroShake > 0.5 ? { ...heroPalette, p: '#f87171' } : heroPalette,
        );

        // Tarjetas HP estilo Pokémon GBA con borde doble y barra de energía
        const drawHpCard = (x: number, y: number, title: string, tag: string, hp: number, max: number, pct: number) => {
          const cw = 152;
          const ch = 40;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.strokeStyle = accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x, y, cw, ch, 8);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#f8fafc';
          ctx.font = '700 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(title, x + 9, y + 14);
          ctx.fillStyle = '#fde047';
          ctx.textAlign = 'right';
          ctx.fillText(tag, x + cw - 9, y + 14);

          ctx.fillStyle = 'rgba(255,255,255,0.16)';
          ctx.fillRect(x + 9, y + 20, cw - 18, 7);
          ctx.fillStyle = pct > 0.5 ? '#4ade80' : pct > 0.24 ? '#facc15' : '#f87171';
          ctx.fillRect(x + 9, y + 20, Math.round((cw - 18) * pct), 7);

          ctx.fillStyle = '#cbd5e1';
          ctx.font = '700 9px "JetBrains Mono", monospace';
          ctx.fillText(`HP ${hp}/${max}`, x + cw - 9, y + 36);
        };

        drawHpCard(12, 12, 'SLIME REY', 'JEFE', enemyHp, 80, enemyPct);
        drawHpCard(w - 164, h - 68, 'CHISPA', 'NV.5', heroHp, 100, heroPct);

        // Proyectiles reales: rayo eléctrico zigzag y llamarada con estela
        for (let i = a.projectiles.length - 1; i >= 0; i -= 1) {
          const pr = a.projectiles[i];
          pr.p += dt * 2.6;
          if (pr.p >= 1) {
            for (let k = 0; k < 18; k += 1) {
              a.particles.push({
                x: pr.tx,
                y: pr.ty,
                vx: (Math.random() - 0.5) * 0.55,
                vy: (Math.random() - 0.5) * 0.55,
                size: 4 + (k % 2),
                color: k % 2 === 0 ? pr.color : '#ffffff',
                life: 0,
                maxLife: 0.75,
                gravity: 0.25,
              });
            }
            a.projectiles.splice(i, 1);
            continue;
          }
          const px = (pr.x + (pr.tx - pr.x) * pr.p) * w;
          const py = (pr.y + (pr.ty - pr.y) * pr.p) * h;
          if (pr.kind === 'bolt') {
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(pr.x * w, pr.y * h);
            for (let seg = 1; seg <= 4; seg += 1) {
              const sp = (pr.p * seg) / 4;
              const jx = (pr.x + (pr.tx - pr.x) * sp) * w;
              const jy = (pr.y + (pr.ty - pr.y) * sp) * h + (seg % 2 === 0 ? -9 : 9);
              ctx.lineTo(jx, jy);
            }
            ctx.stroke();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.6;
            ctx.stroke();
          } else {
            ctx.fillStyle = '#ff6b35';
            ctx.beginPath();
            ctx.arc(px, py, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // ======================== 2. ISLA DEL TESORO DEL DADO MÁGICO ========================
      else if (sc === 'aventura') {
        const dado = Math.max(1, Math.min(6, Math.round(leerNumVar(vars, ['dado', 'pasos', 'numero'], 1))));
        const sky = ctx.createLinearGradient(0, 0, 0, h * 0.64);
        sky.addColorStop(0, '#0284c7');
        sky.addColorStop(0.65, '#38bdf8');
        sky.addColorStop(1, '#bae6fd');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // Sol tropical con rayos
        ctx.fillStyle = 'rgba(253, 224, 71, 0.22)';
        ctx.beginPath();
        ctx.arc(w * 0.74, 34, 24 + Math.sin(t * 2) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.fillRect(Math.round(w * 0.74 - 11), 23, 22, 22);

        // Nubes volumétricas pixel + gaviotas
        for (let i = 0; i < 4; i += 1) {
          const cx = (((i * 140 + t * 9) % (w + 90)) - 45);
          const cy = 22 + (i % 2) * 22;
          ctx.fillStyle = '#e0f2fe';
          ctx.fillRect(Math.round(cx), cy + 5, 38, 6);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.round(cx), cy, 38, 7);
          ctx.fillRect(Math.round(cx) + 7, cy - 5, 22, 6);
        }

        // Mar turquesa animado con olas blancas
        ctx.fillStyle = '#0369a1';
        ctx.fillRect(0, h * 0.55, w, h * 0.45);
        ctx.fillStyle = '#0ea5e9';
        ctx.fillRect(0, h * 0.55, w, 6);
        ctx.fillStyle = 'rgba(224, 242, 254, 0.65)';
        for (let ow = 0; ow < 8; ow += 1) {
          const ox = ((ow * 68 + t * 18) % (w + 30)) - 15;
          ctx.fillRect(Math.round(ox), Math.round(h * 0.84 + (ow % 2) * 8), 22, 3);
        }

        // Isla de arena + pradera + 2 palmeras
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.roundRect(14, h * 0.62, w - 28, h * 0.23, 18);
        ctx.fill();
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.roundRect(20, h * 0.6, w - 40, h * 0.14, 14);
        ctx.fill();

        const sway = Math.sin(t * 2.5);
        drawPalmTree(ctx, 26, h * 0.63, sway);
        drawPalmTree(ctx, w - 34, h * 0.63, -sway);

        // Puente de madera conectando las 6 casillas
        const padX = 52;
        const stepW = (w - padX * 2) / 5;
        ctx.fillStyle = '#78350f';
        ctx.fillRect(padX, h * 0.7 - 4, stepW * 5, 8);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(padX, h * 0.7 - 2, stepW * 5, 4);

        for (let i = 1; i <= 6; i += 1) {
          const tx = padX + (i - 1) * stepW;
          const ty = h * 0.7;
          const reached = i <= dado;
          ctx.fillStyle = reached ? '#fde047' : '#f8fafc';
          ctx.strokeStyle = reached ? '#b45309' : '#1e293b';
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

        // Cofre del tesoro: se abre con brillo dorado cuando sacas 6
        const chestX = padX + 5 * stepW + (dado === 6 ? 18 : 0);
        if (dado === 6) {
          ctx.fillStyle = 'rgba(253, 224, 71, 0.35)';
          ctx.beginPath();
          ctx.arc(chestX, h * 0.54, 24 + Math.sin(t * 6) * 3, 0, Math.PI * 2);
          ctx.fill();
        }
        drawPixelSprite(ctx, dado === 6 ? SPRITE_CHEST_OPEN : SPRITE_CHEST_CLOSED, chestX, h * 0.55, 3.3, {
          y: '#facc15',
          p: '#b45309',
          g: '#fde047',
          w: '#ffffff',
        });

        // Héroe saltando a la casilla actual
        const targetTileX = padX + (dado - 1) * stepW - (dado === 6 ? 18 : 0);
        const hy = h * 0.49 - Math.sin(a.heroJump * Math.PI) * 18 + Math.sin(t * 4) * 2;
        drawPixelSprite(ctx, SPRITE_HERO_14, targetTileX, hy, 3.8, heroPalette);

        // Dado 3D pixelado
        ctx.save();
        ctx.translate(42, 38);
        ctx.rotate(a.diceSpin * Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
        ctx.beginPath();
        ctx.roundRect(-18, -17, 40, 40, 8);
        ctx.fill();
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

      // ======================== 3. ESTADIO ARCADE PIEDRA, PAPEL O TIJERA ========================
      else if (sc === 'torneo') {
        const jug = Math.round(leerNumVar(vars, ['jugador'], 0));
        const cpu = Math.round(leerNumVar(vars, ['computadora'], 0));
        const labels: Record<number, string> = { 1: 'PIEDRA', 2: 'PAPEL', 3: 'TIJERA' };

        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, '#0f0a24');
        sky.addColorStop(0.6, '#1e1646');
        sky.addColorStop(1, '#2d1b54');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // Gradas con público pixel saltando al ritmo
        ctx.fillStyle = '#181036';
        ctx.fillRect(0, h * 0.45, w, h * 0.25);
        for (let c = 0; c < 26; c += 1) {
          const cx = (c + 0.5) * (w / 26);
          const hop = Math.abs(Math.sin(t * 4 + c)) * 3;
          ctx.fillStyle = c % 3 === 0 ? '#38bdf8' : c % 3 === 1 ? '#f472b6' : '#fde047';
          ctx.fillRect(Math.round(cx - 3), Math.round(h * 0.58 - hop), 6, 6);
        }

        // Reflectores móviles cruzados
        const sweep = Math.sin(t * 1.6) * 24;
        ctx.fillStyle = 'rgba(56, 189, 248, 0.14)';
        ctx.beginPath();
        ctx.moveTo(w * 0.22, 0);
        ctx.lineTo(w * 0.04 + sweep, h);
        ctx.lineTo(w * 0.42 + sweep, h);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = 'rgba(244, 114, 182, 0.14)';
        ctx.beginPath();
        ctx.moveTo(w * 0.78, 0);
        ctx.lineTo(w * 0.58 - sweep, h);
        ctx.lineTo(w * 0.96 - sweep, h);
        ctx.closePath();
        ctx.fill();

        // Piso del ring arcade con cuadrícula luminosa
        ctx.fillStyle = '#312e81';
        ctx.fillRect(0, h * 0.68, w, h * 0.32);
        ctx.fillStyle = accent;
        ctx.fillRect(0, h * 0.68, w, 3);

        drawPixelSprite(ctx, SPRITE_HERO_14, w * 0.2, h * 0.56 + Math.sin(t * 4) * 2.5, 4.1, heroPalette);
        drawPixelSprite(ctx, SPRITE_SLIME_KING, w * 0.8, h * 0.56 + Math.cos(t * 4) * 2.5, 4.1, slimePalette, true);

        // Sprites gigantes de la jugada elegida en el centro
        const drawMoveIcon = (choice: number, cx: number, cy: number) => {
          if (choice === 1) {
            drawPixelSprite(ctx, SPRITE_ROCK, cx, cy, 3.2, { g: '#94a3b8', l: '#e2e8f0', d: '#475569' });
          } else if (choice === 2) {
            drawPixelSprite(ctx, SPRITE_PAPER, cx, cy, 3.2, { w: '#f8fafc', b: '#38bdf8' });
          } else if (choice === 3) {
            drawPixelSprite(ctx, SPRITE_SCISSORS, cx, cy, 3.2, { s: '#e2e8f0', r: '#f43f5e' });
          }
        };
        if (jug >= 1 && jug <= 3) drawMoveIcon(jug, w * 0.38, h * 0.52);
        if (jug >= 1 && cpu >= 1 && cpu <= 3) drawMoveIcon(cpu, w * 0.62, h * 0.52);

        ctx.fillStyle = '#fde047';
        ctx.font = '700 19px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('VS', w * 0.5, h * 0.54);

        const drawChoiceBadge = (cx: number, title: string, choice: string, col: string) => {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.strokeStyle = col;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(cx - 50, 14, 100, 38, 8);
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

      // ======================== 4. BASE ESPACIAL NASA 3-2-1 ========================
      else if (sc === 'cohete') {
        const cuenta = leerNumVar(vars, ['cuenta', 'contador'], 5);
        if (a.rocketLaunched || cuenta <= 0) {
          a.rocketAlt = Math.min(h * 0.44, a.rocketAlt + dt * 95);
        }

        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, '#040714');
        sky.addColorStop(0.55, '#0f172a');
        sky.addColorStop(1, '#1e293b');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // Nebulosa suave violeta/celeste
        const neb = ctx.createRadialGradient(w * 0.75, h * 0.28, 10, w * 0.75, h * 0.28, 95);
        neb.addColorStop(0, 'rgba(139, 92, 246, 0.26)');
        neb.addColorStop(1, 'rgba(139, 92, 246, 0)');
        ctx.fillStyle = neb;
        ctx.fillRect(0, 0, w, h);

        // Estrellas en 2 capas de paralaje
        for (let i = 0; i < 30; i += 1) {
          const sx = ((i * 47.3) % 100) / 100 * w;
          const sy = (((i * 29.7 + (a.rocketAlt > 10 ? t * 22 : 0)) % 76) / 100) * h;
          const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 2.5 + i));
          ctx.fillStyle = `rgba(255,255,255,${tw.toFixed(2)})`;
          ctx.fillRect(Math.round(sx), Math.round(sy), i % 5 === 0 ? 3 : 2, i % 5 === 0 ? 3 : 2);
        }

        // Saturno con anillos
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(w * 0.19, h * 0.34, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(w * 0.19, h * 0.34, 29, 7, -0.28, 0, Math.PI * 2);
        ctx.stroke();

        // Superficie lunar + cúpula de base iluminada
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, h * 0.76, w, h * 0.24);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(0, h * 0.76, w, 3);
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.ellipse(w * 0.25, h * 0.84, 20, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(w * 0.76, h * 0.83, 24, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cúpula lunar a la derecha
        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(w * 0.8, h * 0.76, 20, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(Math.round(w * 0.8 - 10), Math.round(h * 0.76 - 10), 6, 5);
        ctx.fillRect(Math.round(w * 0.8 + 3), Math.round(h * 0.76 - 10), 6, 5);

        // Torre con brazos mecánicos que se abren al despegar
        const armOpen = a.rocketAlt > 4 ? -12 : 0;
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(w * 0.5 - 52, h * 0.38, 8, h * 0.38);
        ctx.fillRect(w * 0.5 - 52, h * 0.46 + armOpen, 28, 5);
        ctx.fillRect(w * 0.5 - 52, h * 0.6 + armOpen, 24, 4);

        const rx = w * 0.5 + (a.rocketAlt > 0 && a.rocketAlt < h * 0.4 ? Math.sin(t * 42) * 2.5 : 0);
        const ry = h * 0.58 - a.rocketAlt;

        if (a.rocketAlt > 0 || cuenta <= 2) {
          const flameH = 24 + Math.sin(t * 34) * 9 + (a.rocketAlt > 0 ? 18 : 0);
          ctx.fillStyle = 'rgba(226, 232, 240, 0.38)';
          ctx.beginPath();
          ctx.arc(rx - 18, h * 0.75, 13 + Math.sin(t * 10) * 3, 0, Math.PI * 2);
          ctx.arc(rx + 18, h * 0.75, 13 + Math.cos(t * 10) * 3, 0, Math.PI * 2);
          ctx.arc(rx, h * 0.76, 15, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ff6b35';
          ctx.beginPath();
          ctx.moveTo(rx - 13, ry + 26);
          ctx.lineTo(rx, ry + 26 + flameH);
          ctx.lineTo(rx + 13, ry + 26);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.moveTo(rx - 6, ry + 26);
          ctx.lineTo(rx, ry + 26 + flameH * 0.62);
          ctx.lineTo(rx + 6, ry + 26);
          ctx.closePath();
          ctx.fill();
        }

        drawPixelSprite(ctx, SPRITE_ROCKET_14, rx, ry, 4.1, {
          p: '#f8fafc',
          s: accent,
          w: '#e0f2fe',
          b: '#38bdf8',
          y: '#facc15',
        });

        // Telemetría NASA arriba izquierda
        const km = Math.round((a.rocketAlt / (h * 0.44)) * 120);
        ctx.fillStyle = '#fde047';
        ctx.font = '700 16px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(a.rocketAlt > 12 ? '★ ¡EN ÓRBITA! ★' : `T-${Math.max(0, cuenta)}`, 14, 28);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.fillText(`ALTITUD: ${km} km`, 14, 43);
      }

      // ======================== 5. BÓVEDA SECRETA & LABORATORIO (NUEVO 6to ESCENARIO) ========================
      else if (sc === 'boveda') {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, '#111827');
        sky.addColorStop(1, '#1f2937');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // Paneles metálicos remachados
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.16)';
        ctx.lineWidth = 2;
        ctx.strokeRect(12, 12, w - 24, h - 42);

        const intento = leerNumVar(vars, ['intento', 'primero', 'resultado'], 0);
        const abierta = /adivinaste|resultado/i.test(ultimaSalida);
        const masGrande = /más grande|mayor/i.test(ultimaSalida);
        const masPequeno = /más pequeño|menor/i.test(ultimaSalida);

        a.dialAngle += (intento * 0.62 - a.dialAngle) * 0.1;

        // Puerta circular de bóveda con dial giratorio
        const cx = w * 0.5;
        const cy = h * 0.48;
        ctx.fillStyle = abierta ? '#065f46' : '#334155';
        ctx.strokeStyle = abierta ? '#4ade80' : accent;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, 52, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Rayos del dial girando
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(a.dialAngle + (abierta ? t : 0));
        ctx.strokeStyle = abierta ? '#fde047' : '#cbd5e1';
        ctx.lineWidth = 3;
        for (let r = 0; r < 6; r += 1) {
          const ang = (r * Math.PI) / 3;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * 14, Math.sin(ang) * 14);
          ctx.lineTo(Math.cos(ang) * 42, Math.sin(ang) * 42);
          ctx.stroke();
        }
        ctx.restore();

        // Pantalla digital central
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(cx - 26, cy - 16, 52, 32, 8);
        ctx.fill();
        ctx.strokeStyle = abierta ? '#4ade80' : '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = abierta ? '#4ade80' : '#f8fafc';
        ctx.font = '700 15px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(abierta ? '★ OK' : String(intento || '?'), cx, cy + 5);

        // Semáforo de pista calor/frío a la izquierda
        const badgeCol = abierta ? '#4ade80' : masGrande ? '#38bdf8' : masPequeno ? '#fb923c' : accent;
        const badgeTxt = abierta
          ? '¡DESBLOQUEADA!'
          : masGrande
            ? '↑ MÁS GRANDE'
            : masPequeno
              ? '↓ MÁS PEQUEÑO'
              : 'ELIGE NÚMERO';
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = badgeCol;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(18, 20, 126, 30, 8);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = badgeCol;
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.fillText(badgeTxt, 81, 39);
      }

      // ======================== 6. PARQUE CHISPA 16-BIT (PROGRAMAS LIBRES) ========================
      else {
        const sky = ctx.createLinearGradient(0, 0, 0, h * 0.72);
        sky.addColorStop(0, '#1e3a8a');
        sky.addColorStop(0.55, '#38bdf8');
        sky.addColorStop(1, '#bae6fd');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // Sol pixel brillante
        ctx.fillStyle = 'rgba(253, 224, 71, 0.25)';
        ctx.fillRect(Math.round(w * 0.78) - 5, 13, 32, 32);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(Math.round(w * 0.78), 18, 22, 22);

        // Nubes pixel sombreadas
        for (let i = 0; i < 4; i += 1) {
          const cx = (((i * 136 + t * 8) % (w + 80)) - 40);
          const cy = 20 + (i % 2) * 20;
          ctx.fillStyle = '#e0f2fe';
          ctx.fillRect(Math.round(cx), cy + 5, 36, 6);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.round(cx), cy, 36, 7);
          ctx.fillRect(Math.round(cx) + 8, cy - 5, 20, 6);
        }

        // Montañas pixel escalonadas en paralaje
        ctx.fillStyle = '#1e40af';
        for (let m = 0; m < 5; m += 1) {
          const mx = m * (w / 4);
          ctx.beginPath();
          ctx.moveTo(mx - 45, h * 0.68);
          ctx.lineTo(mx + 25, h * 0.42 + (m % 2) * 14);
          ctx.lineTo(mx + 95, h * 0.68);
          ctx.closePath();
          ctx.fill();
        }

        // Colinas verdes suaves + pradera con camino de piedra
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(w * 0.2, h * 0.82, 95, Math.PI, Math.PI * 2);
        ctx.arc(w * 0.82, h * 0.84, 110, Math.PI, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#16a34a';
        ctx.fillRect(0, h * 0.68, w, h * 0.32);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(0, h * 0.68, w, 4);

        // Camino de tierra/piedra + valla de madera
        ctx.fillStyle = '#d97706';
        ctx.fillRect(0, h * 0.8, w, 14);
        ctx.fillStyle = '#fbbf24';
        for (let st = 10; st < w; st += 38) {
          ctx.fillRect(st, Math.round(h * 0.82), 14, 6);
        }
        ctx.fillStyle = '#92400e';
        for (let fx = 16; fx < w; fx += 44) {
          ctx.fillRect(fx, Math.round(h * 0.61), 4, 16);
        }
        ctx.fillRect(0, Math.round(h * 0.65), w, 3);

        // Árboles pixel sombreados a los costados
        drawPixelTree(ctx, 42, h * 0.72, 1.05);
        drawPixelTree(ctx, w - 48, h * 0.72, 0.95);

        // Florecitas balanceándose + mariposa pixel
        for (let f = 0; f < 7; f += 1) {
          const fx = 76 + f * ((w - 152) / 6);
          const fy = h * 0.74 + (f % 2) * 4;
          ctx.fillStyle = f % 2 === 0 ? '#fde047' : '#f472b6';
          ctx.fillRect(Math.round(fx + Math.sin(t * 3 + f)), Math.round(fy), 4, 4);
        }
        const bxFly = w * 0.32 + Math.sin(t * 1.4) * 55;
        const byFly = h * 0.38 + Math.cos(t * 3.1) * 12;
        ctx.fillStyle = '#fde047';
        ctx.fillRect(Math.round(bxFly - 3), Math.round(byFly), 3, Math.sin(t * 16) > 0 ? 4 : 2);
        ctx.fillRect(Math.round(bxFly + 1), Math.round(byFly), 3, Math.sin(t * 16) > 0 ? 4 : 2);

        // Sombra y personaje Chispa caminando/saltando
        const hx = w * a.heroPosX;
        const hy = h * 0.66 - Math.sin(a.heroJump * Math.PI) * 22 + Math.sin(t * 3.8) * 2;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
        ctx.beginPath();
        ctx.ellipse(hx, h * 0.83, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        drawPixelSprite(
          ctx,
          moving && Math.floor(t * 10) % 2 === 0 ? SPRITE_HERO_WALK : SPRITE_HERO_14,
          hx,
          hy,
          4.1,
          heroPalette,
        );

        // Burbuja cómic estilo Scratch con flechita apuntando a Chispa
        const nombreHero = leerTextoVar(vars, ['nombre', 'piloto', 'heroe'], 'Chispa');
        const msg = ultimaSalida || `¡Hola! Soy ${nombreHero}`;
        const clipped = msg.length > 36 ? `${msg.slice(0, 35)}…` : msg;
        ctx.font = '700 11px "JetBrains Mono", monospace';
        const tw = Math.min(w - 32, Math.max(114, ctx.measureText(clipped).width + 26));
        const bx = Math.max(12, Math.min(w - tw - 12, hx - tw * 0.5));
        const by = Math.max(12, hy - 74);

        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.roundRect(bx, by, tw, 30, 10);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(hx - 6, by + 29);
        ctx.lineTo(hx, by + 37);
        ctx.lineTo(hx + 6, by + 29);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.textAlign = 'center';
        ctx.fillText(clipped, bx + tw * 0.5, by + 19);
      }

      // Monitores de Variables estilo Scratch en la esquina superior derecha
      if (sc !== 'rpg' && sc !== 'torneo' && vars.length > 0) {
        const showVars = vars.slice(0, 3);
        let vy = 10;
        ctx.font = '700 10px "JetBrains Mono", monospace';
        for (const v of showVars) {
          const text = `${v.nombre}: ${v.valor}`;
          const bw = Math.min(176, ctx.measureText(text).width + 18);
          ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
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

      // Partículas y textos flotantes (-26!, +25 HP)
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

      // Barra retro de diálogo del juego
      if (sc !== 'chispa' && ultimaSalida) {
        const trimmed = ultimaSalida.length > 48 ? `${ultimaSalida.slice(0, 47)}…` : ultimaSalida;
        ctx.fillStyle = 'rgba(11, 16, 28, 0.92)';
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
    for (let i = 0; i < 12; i += 1) {
      a.particles.push({
        x: nx,
        y: ny,
        vx: (Math.random() - 0.5) * 0.42,
        vy: -0.15 - Math.random() * 0.32,
        size: 4,
        color: i % 2 === 0 ? accent : sec,
        life: 0,
        maxLife: 0.9,
        gravity: 0.45,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = Math.round(((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 480);
    const sy = Math.round((0.5 - (e.clientY - rect.top) / Math.max(1, rect.height)) * 360);
    setCoords({ x: sx, y: sy });
  };

  const nombreEscena =
    escenaActiva === 'rpg'
      ? 'Duelo RPG'
      : escenaActiva === 'aventura'
        ? 'Isla del Dado'
        : escenaActiva === 'torneo'
          ? 'Estadio Arcade'
          : escenaActiva === 'cohete'
            ? 'Base Espacial'
            : escenaActiva === 'boveda'
              ? 'Bóveda Secreta'
              : 'Parque Chispa';

  return (
    <div className="game-stage-shell" data-stage-scene={escenaActiva}>
      <div className="game-stage-bar">
        <span className="game-stage-title">
          <Gamepad2 size={13} aria-hidden="true" style={{ color: 'var(--accent)' }} />
          <span>Escenario 2D</span>
          <span className="pill-mini ok">{nombreEscena}</span>
          {coords && (
            <span className="stage-coords mono" aria-hidden="true">
              X:{coords.x} Y:{coords.y}
            </span>
          )}
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
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setCoords(null)}
        aria-label="Escenario interactivo de juego 2D"
        title="Haz clic en el escenario para mover a Chispa y lanzar chispas"
      />
    </div>
  );
};
