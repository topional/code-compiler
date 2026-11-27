/**
 * Escenario 2D Interactivo con Director de Escena (Scratch 3 × MakeCode Arcade × Pokémon GBA).
 * - Selector directo de juegos reales (tocar RPG, Dado, Duelo, Cohete, Bóveda o Libre carga ese juego).
 * - Controles tipo consola en el propio escenario: Jugar / Volver a jugar, Detener y Ampliar pantalla.
 * - Botones de acción en vivo dentro del escenario (sincronizados 1:1 con la Terminal interactiva).
 * - Líneas de tiempo reales (cuenta regresiva real en Cohete, salto casilla por casilla en Dado,
 *   descarte visual 1..10 en Bóveda, calculadora digital en vivo y animaciones de turno en RPG/Duelo).
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calculator,
  Dices,
  Gamepad2,
  KeyRound,
  Maximize2,
  Minimize2,
  Play,
  Rocket,
  RotateCcw,
  Sparkles,
  Square,
  Swords,
} from 'lucide-react';

import { obtenerTema, type TemaId } from '../data/temas';
import type { VariableMemoria } from '../engine/types';

export type EscenaJuego2D = 'rpg' | 'aventura' | 'torneo' | 'cohete' | 'boveda' | 'chispa';

export interface OpcionRapidaJuego {
  val: string;
  label: string;
}

export interface GameStage2DProps {
  tema: TemaId;
  nombrePrograma: string;
  codigo: string;
  runSeq: number;
  salidas: { id: number; clase: string; texto: string; linea: number | null }[];
  variables: VariableMemoria[];
  estadoEjec: 'inactivo' | 'corriendo' | 'pausado' | 'esperando_paso';
  preguntaActiva: string | null;
  opcionesRapidas: OpcionRapidaJuego[];
  onElegirOpcion: (val: string) => void;
  onJugar: () => void;
  onDetener: () => void;
  onSeleccionarJuego: (juegoId: EscenaJuego2D) => void;
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
  kind: 'bolt' | 'fire' | 'slime';
}

// ---- Sprites Pixel-Art 16-bit ----
const SPRITE_HERO_IDLE = [
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

const SPRITE_HERO_STEP = [
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

const SPRITE_ROCKET = [
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

const SPRITE_STAR = [
  '.....yy.....',
  '.....yy.....',
  '....yyyy....',
  'yyyyyyyyyyyy',
  '.yyyywyyyyy.',
  '..yyyyyyyy..',
  '..yyyyyyyy..',
  '.yyyy..yyyy.',
  'yyy......yyy',
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
    ctx.fillRect(Math.round(x - 3 + i * 1.3 + sway * i * 0.25), Math.round(groundY - 7 * (i + 1)), 6, 7);
  }
  const topX = x + 7 + sway * 1.4;
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

function drawPixelCottage(ctx: CanvasRenderingContext2D, x: number, groundY: number, t: number) {
  // Humo de chimenea animado
  for (let i = 0; i < 3; i += 1) {
    const prog = ((t * 0.7 + i * 0.33) % 1);
    ctx.fillStyle = `rgba(226, 232, 240, ${(0.55 * (1 - prog)).toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(x + 14 + Math.sin(t * 2 + i) * 4, groundY - 42 - prog * 22, 3 + prog * 4, 0, Math.PI * 2);
    ctx.fill();
  }
  // Chimenea + techo rojo pixel + paredes crema + puerta
  ctx.fillStyle = '#7c2d12';
  ctx.fillRect(Math.round(x + 10), Math.round(groundY - 40), 7, 12);
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(x - 24, groundY - 22);
  ctx.lineTo(x, groundY - 40);
  ctx.lineTo(x + 24, groundY - 22);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(Math.round(x - 18), Math.round(groundY - 22), 36, 22);
  ctx.fillStyle = '#92400e';
  ctx.fillRect(Math.round(x - 5), Math.round(groundY - 14), 10, 14);
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(Math.round(x - 14), Math.round(groundY - 17), 6, 6);
  ctx.fillRect(Math.round(x + 8), Math.round(groundY - 17), 6, 6);
}

export function detectarEscena2D(
  nombre: string,
  codigo: string,
  variables: VariableMemoria[],
): EscenaJuego2D {
  const fuente = `${nombre} ${codigo}`.toLowerCase();
  if (/vida_rival|vida_heroe|slime|duelo_rpg|llamarada|pokemon|pocion|contraataca|enemigo/.test(fuente)) {
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

const JUEGOS_RAPIDOS: { id: EscenaJuego2D; label: string; titulo: string; icon: React.ReactNode }[] = [
  { id: 'rpg', label: 'RPG', titulo: 'Cargar y jugar Duelo RPG Chispa', icon: <Swords size={11} aria-hidden="true" /> },
  { id: 'aventura', label: 'Dado', titulo: 'Cargar y jugar Isla del Dado Mágico', icon: <Dices size={11} aria-hidden="true" /> },
  { id: 'torneo', label: 'Duelo', titulo: 'Cargar y jugar Piedra, Papel o Tijera', icon: <Gamepad2 size={11} aria-hidden="true" /> },
  { id: 'cohete', label: 'Cohete', titulo: 'Cargar y lanzar Cohete 3-2-1', icon: <Rocket size={11} aria-hidden="true" /> },
  { id: 'boveda', label: 'Bóveda', titulo: 'Cargar y jugar Adivina el Número', icon: <KeyRound size={11} aria-hidden="true" /> },
  { id: 'chispa', label: 'Libre', titulo: 'Abrir Parque Chispa para código libre', icon: <Sparkles size={11} aria-hidden="true" /> },
];

export const GameStage2D: React.FC<GameStage2DProps> = ({
  tema,
  nombrePrograma,
  codigo,
  runSeq,
  salidas,
  variables,
  estadoEjec,
  preguntaActiva,
  opcionesRapidas,
  onElegirOpcion,
  onJugar,
  onDetener,
  onSeleccionarJuego,
  desactivarAnimacion,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ampliado, setAmpliado] = useState(false);
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null);

  const escenaActiva = detectarEscena2D(nombrePrograma, codigo, variables);
  const esCalculadora = useMemo(
    () => /calculadora|multiplicar|dividir/i.test(`${nombrePrograma} ${codigo}`),
    [nombrePrograma, codigo],
  );
  const temaMeta = obtenerTema(tema);

  // Director de animación secuenciada a 60fps
  const animRef = useRef({
    heroJump: 0,
    heroLunge: 0,
    enemyLunge: 0,
    enemyShake: 0,
    heroShake: 0,
    maxHeroHp: 100,
    // Dado secuenciado (rueda -> salta casilla por casilla -> abre cofre / estrella)
    diceRollTimer: 0,
    diceFaceShown: 1,
    currentTile: 1,
    targetTile: 1,
    tileStepTimer: 0,
    starCelebration: 0,
    // Cohete secuenciado (cuenta regresiva visual 5..1 -> ignición -> despegue -> órbita)
    rocketSeqActive: false,
    rocketSeqTime: 0,
    rocketAlt: 0,
    // Bóveda (rango descartado 1..10)
    vaultMin: 1,
    vaultMax: 10,
    dialAngle: 0,
    // Parque libre
    heroPosX: 0.5,
    heroTargetX: 0.5,
    lastOutCount: 0,
    lastRunSeq: -1,
    lastHeroHp: 100,
    lastEnemyHp: 80,
    particles: [] as Particle[],
    floats: [] as FloatText[],
    projectiles: [] as Projectile[],
  });

  // Reiniciar el Director cuando arranca una nueva ejecución (`runSeq`) o cambia la escena
  useEffect(() => {
    const a = animRef.current;
    if (a.lastRunSeq !== runSeq) {
      a.lastRunSeq = runSeq;
      a.heroLunge = 0;
      a.enemyLunge = 0;
      a.enemyShake = 0;
      a.heroShake = 0;
      a.maxHeroHp = 100;
      a.lastHeroHp = 100;
      a.lastEnemyHp = 80;
      a.vaultMin = 1;
      a.vaultMax = 10;
      a.particles = [];
      a.floats = [];
      a.projectiles = [];
      a.lastOutCount = 0;

      if (escenaActiva === 'aventura') {
        a.currentTile = 1;
        a.targetTile = 1;
        a.diceRollTimer = desactivarAnimacion ? 0 : 0.65;
        a.starCelebration = 0;
      }
      if (escenaActiva === 'cohete') {
        a.rocketSeqActive = false;
        a.rocketSeqTime = 0;
        a.rocketAlt = 0;
      }
    }
  }, [runSeq, escenaActiva, desactivarAnimacion]);

  // Procesar eventos del programa en vivo para alimentar el Director de Escena
  useEffect(() => {
    const a = animRef.current;
    const accent = temaMeta.muestras[2];

    if (salidas.length < a.lastOutCount) {
      a.lastOutCount = 0;
      a.vaultMin = 1;
      a.vaultMax = 10;
    }

    if (salidas.length > a.lastOutCount) {
      const nuevas = salidas.slice(a.lastOutCount);
      for (const s of nuevas) {
        if (s.clase !== 'salida') continue;
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
        if (/contraataca/.test(txt)) {
          a.enemyLunge = 1;
          a.heroShake = 1;
          a.projectiles.push({
            x: 0.7,
            y: 0.38,
            tx: 0.28,
            ty: 0.64,
            p: 0,
            color: '#4ade80',
            kind: 'slime',
          });
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
          a.floats.push({ x: 0.26, y: 0.52, text: '+25 HP', color: '#4ade80', life: 0 });
        }
        if (/lanzando tu dado/.test(txt)) {
          a.diceRollTimer = desactivarAnimacion ? 0 : 0.6;
          a.currentTile = 1;
        }
        if (/cohete listo|despeg/.test(txt)) {
          a.rocketSeqActive = true;
        }
        // Bóveda: estrechar el rango visual 1..10 según las pistas de Chispa
        const lastTry = leerNumVar(variables, ['intento'], 0);
        if (lastTry >= 1 && lastTry <= 10) {
          if (/más grande|mayor/.test(txt)) {
            a.vaultMin = Math.max(a.vaultMin, lastTry + 1);
          } else if (/más pequeño|menor/.test(txt)) {
            a.vaultMax = Math.min(a.vaultMax, lastTry - 1);
          }
        }

        if (/victoria|ganaste el torneo|adivinaste|medalla/.test(txt)) {
          for (let i = 0; i < 28; i += 1) {
            a.particles.push({
              x: 0.5 + (Math.random() - 0.5) * 0.55,
              y: 0.35 + (Math.random() - 0.5) * 0.2,
              vx: (Math.random() - 0.5) * 0.5,
              vy: -0.25 - Math.random() * 0.4,
              size: 4 + (i % 3),
              color: i % 3 === 0 ? accent : i % 3 === 1 ? '#fde047' : '#4ade80',
              life: 0,
              maxLife: 1.5,
              gravity: 0.52,
            });
          }
        }
      }
    }
    a.lastOutCount = salidas.length;

    // Sincronizar casilla objetivo del Dado
    if (escenaActiva === 'aventura') {
      const dadoVal = Math.max(1, Math.min(6, Math.round(leerNumVar(variables, ['dado', 'pasos'], 1))));
      a.targetTile = dadoVal;
      if (desactivarAnimacion) a.currentTile = dadoVal;
    }

    // Daño flotante y tope dinámico de HP en RPG
    const heroHp = leerNumVar(variables, ['vida_heroe', 'vida', 'energia'], 100);
    const enemyHp = leerNumVar(variables, ['vida_rival', 'vida_enemigo', 'enemigo'], 80);
    if (heroHp > a.maxHeroHp) a.maxHeroHp = heroHp;
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
  }, [salidas, variables, escenaActiva, desactivarAnimacion, temaMeta.muestras]);

  const liveRef = useRef({
    escenaActiva,
    esCalculadora,
    variables,
    salidas,
    estadoEjec,
    preguntaActiva,
    temaMeta,
  });
  liveRef.current = {
    escenaActiva,
    esCalculadora,
    variables,
    salidas,
    estadoEjec,
    preguntaActiva,
    temaMeta,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId = 0;
    let t = 0;
    let w = 480;
    let h = 252;

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
      const {
        escenaActiva: sc,
        esCalculadora: isCalc,
        variables: vars,
        salidas: outs,
        estadoEjec: est,
        preguntaActiva: preg,
        temaMeta: tm,
      } = liveRef.current;
      const a = animRef.current;
      const cs = window.getComputedStyle(document.documentElement);
      const accent = cs.getPropertyValue('--accent').trim() || tm.muestras[2];
      const sec = cs.getPropertyValue('--logo-spark').trim() || cs.getPropertyValue('--info').trim() || tm.muestras[3];
      const dt = desactivarAnimacion ? 0 : 0.016;

      a.heroJump = Math.max(0, a.heroJump - dt * 2.3);
      a.heroLunge = Math.max(0, a.heroLunge - dt * 2.8);
      a.enemyLunge = Math.max(0, a.enemyLunge - dt * 2.8);
      a.enemyShake = Math.max(0, a.enemyShake - dt * 3.0);
      a.heroShake = Math.max(0, a.heroShake - dt * 3.0);
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

      // ======================== 1. BATALLA RPG POKÉMON GBA ========================
      if (sc === 'rpg') {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, '#0c142c');
        sky.addColorStop(0.45, '#1d3557');
        sky.addColorStop(0.62, '#2a5a6a');
        sky.addColorStop(1, '#143628');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // Luna creciente + estrellas
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(w * 0.48, 26, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#12203f';
        ctx.beginPath();
        ctx.arc(w * 0.48 + 5, 23, 10, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < 20; i += 1) {
          const sx = ((i * 53.7) % 100) / 100 * w;
          const sy = ((i * 23.1 + 4) % 44) / 100 * h;
          const tw = 0.3 + 0.7 * Math.abs(Math.sin(t * 2 + i));
          ctx.fillStyle = `rgba(255,255,255,${tw.toFixed(2)})`;
          ctx.fillRect(Math.round(sx), Math.round(sy), i % 4 === 0 ? 3 : 2, i % 4 === 0 ? 3 : 2);
        }

        // Bosque de pinos pixel en horizonte
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

        // Pradera esmeralda con franjas de hierba
        ctx.fillStyle = '#1b4d33';
        ctx.fillRect(0, h * 0.56, w, h * 0.44);
        ctx.fillStyle = '#225e3f';
        for (let gx = 0; gx < w; gx += 32) {
          ctx.fillRect(gx, h * 0.56, 16, h * 0.44);
        }
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(0, h * 0.56, w, 3);

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
        drawPad(w * 0.25, h * 0.76, 60, 15);
        drawPad(w * 0.74, h * 0.47, 56, 14);

        const sinIniciar = outs.length === 0 && est === 'inactivo';
        const heroHp = Math.max(0, leerNumVar(vars, ['vida_heroe', 'vida', 'energia'], 100));
        const enemyHp = Math.max(0, leerNumVar(vars, ['vida_rival', 'vida_enemigo', 'enemigo'], 80));
        const maxH = Math.max(100, a.maxHeroHp);
        const heroPct = Math.min(1, heroHp / maxH);
        const enemyPct = Math.min(1, enemyHp / 80);

        const ex = w * 0.74 - a.enemyLunge * 34 + Math.sin(t * 32) * a.enemyShake * 8;
        const ey = h * 0.34 + Math.sin(t * 3.8) * 3.5;
        if (enemyHp > 0 || sinIniciar) {
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
          ctx.fillText('★ ¡SLIME DERROTADO! ★', ex, ey);
        }

        const hx = w * 0.25 + a.heroLunge * 40 + Math.sin(t * 32) * a.heroShake * 7;
        const hy = h * 0.63 - Math.sin(a.heroJump * Math.PI) * 14 + Math.sin(t * 4) * 2;
        drawPixelSprite(
          ctx,
          SPRITE_HERO_IDLE,
          hx,
          hy,
          4.3,
          a.heroShake > 0.5 ? { ...heroPalette, p: '#f87171' } : heroPalette,
        );

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
        drawHpCard(w - 164, h - 68, 'CHISPA', 'NV.5', heroHp, maxH, heroPct);

        // Proyectiles de combate (rayo zigzag, llamarada y golpe slime)
        for (let i = a.projectiles.length - 1; i >= 0; i -= 1) {
          const pr = a.projectiles[i];
          pr.p += dt * 2.6;
          if (pr.p >= 1) {
            for (let k = 0; k < 16; k += 1) {
              a.particles.push({
                x: pr.tx,
                y: pr.ty,
                vx: (Math.random() - 0.5) * 0.55,
                vy: (Math.random() - 0.5) * 0.55,
                size: 4 + (k % 2),
                color: k % 2 === 0 ? pr.color : '#ffffff',
                life: 0,
                maxLife: 0.7,
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
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else {
            ctx.fillStyle = pr.color;
            ctx.beginPath();
            ctx.arc(px, py, pr.kind === 'fire' ? 12 : 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fde047';
            ctx.beginPath();
            ctx.arc(px, py, 5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // ======================== 2. ISLA DEL DADO (CON SALTO CASILLA POR CASILLA) ========================
      else if (sc === 'aventura') {
        const dadoFinal = Math.max(1, Math.min(6, Math.round(leerNumVar(vars, ['dado', 'pasos'], 1))));
        a.targetTile = dadoFinal;

        // Secuencia: primero gira el dado, luego Chispa salta casilla por casilla 1 -> 2 -> ... -> dado
        if (a.diceRollTimer > 0) {
          a.diceRollTimer = Math.max(0, a.diceRollTimer - dt);
          a.diceFaceShown = ((Math.floor(t * 18) % 6) + 1);
        } else {
          a.diceFaceShown = dadoFinal;
          if (a.currentTile < a.targetTile) {
            a.tileStepTimer += dt * 4.2;
            if (a.tileStepTimer >= 1) {
              a.tileStepTimer = 0;
              a.currentTile += 1;
              if (a.currentTile === a.targetTile && a.targetTile >= 4) {
                a.starCelebration = 1;
                for (let k = 0; k < 20; k += 1) {
                  a.particles.push({
                    x: 0.15 + ((a.currentTile - 1) / 5) * 0.7,
                    y: 0.45,
                    vx: (Math.random() - 0.5) * 0.45,
                    vy: -0.25 - Math.random() * 0.3,
                    size: 4,
                    color: k % 2 === 0 ? '#fde047' : '#4ade80',
                    life: 0,
                    maxLife: 1.2,
                    gravity: 0.45,
                  });
                }
              }
            }
          } else {
            a.currentTile = a.targetTile;
          }
        }
        a.starCelebration = Math.max(0, a.starCelebration - dt * 0.5);

        const sky = ctx.createLinearGradient(0, 0, 0, h * 0.64);
        sky.addColorStop(0, '#0284c7');
        sky.addColorStop(0.65, '#38bdf8');
        sky.addColorStop(1, '#bae6fd');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(253, 224, 71, 0.22)';
        ctx.beginPath();
        ctx.arc(w * 0.74, 32, 24 + Math.sin(t * 2) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.fillRect(Math.round(w * 0.74 - 11), 21, 22, 22);

        for (let i = 0; i < 4; i += 1) {
          const cx = (((i * 140 + t * 9) % (w + 90)) - 45);
          const cy = 20 + (i % 2) * 20;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.round(cx), cy, 38, 7);
          ctx.fillRect(Math.round(cx) + 7, cy - 5, 22, 6);
        }

        // Mar turquesa + isla + palmeras
        ctx.fillStyle = '#0369a1';
        ctx.fillRect(0, h * 0.55, w, h * 0.45);
        ctx.fillStyle = '#0ea5e9';
        ctx.fillRect(0, h * 0.55, w, 6);
        ctx.fillStyle = 'rgba(224, 242, 254, 0.65)';
        for (let ow = 0; ow < 8; ow += 1) {
          const ox = ((ow * 68 + t * 18) % (w + 30)) - 15;
          ctx.fillRect(Math.round(ox), Math.round(h * 0.85 + (ow % 2) * 7), 22, 3);
        }

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

        const padX = 52;
        const stepW = (w - padX * 2) / 5;
        ctx.fillStyle = '#78350f';
        ctx.fillRect(padX, h * 0.7 - 4, stepW * 5, 8);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(padX, h * 0.7 - 2, stepW * 5, 4);

        for (let i = 1; i <= 6; i += 1) {
          const tx = padX + (i - 1) * stepW;
          const ty = h * 0.7;
          const reached = a.diceRollTimer <= 0 && i <= a.currentTile;
          const isStarGoal = i >= 4;
          ctx.fillStyle = reached ? '#fde047' : isStarGoal ? '#fef9c3' : '#f8fafc';
          ctx.strokeStyle = reached ? '#b45309' : isStarGoal ? '#ca8a04' : '#1e293b';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(tx - 19, ty - 12, 38, 24, 6);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#0f172a';
          ctx.font = '700 11px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(i >= 4 ? `${i}★` : String(i), tx, ty + 4);
        }

        // Cofre en la casilla 6 (solo se abre cuando Chispa llega físicamente a la casilla 6)
        const arrivedAt6 = a.diceRollTimer <= 0 && a.currentTile === 6 && dadoFinal === 6;
        const chestX = padX + 5 * stepW + (arrivedAt6 ? 18 : 0);
        drawPixelSprite(ctx, arrivedAt6 ? SPRITE_CHEST_OPEN : SPRITE_CHEST_CLOSED, chestX, h * 0.55, 3.3, {
          y: '#facc15',
          p: '#b45309',
          g: '#fde047',
          w: '#ffffff',
        });

        // Posición interpolada de Chispa saltando casilla por casilla
        const interpTile =
          a.currentTile < a.targetTile ? a.currentTile - 1 + a.tileStepTimer : a.currentTile - 1;
        const hopArc = a.currentTile < a.targetTile ? Math.sin(a.tileStepTimer * Math.PI) * 24 : 0;
        const heroX = padX + interpTile * stepW - (arrivedAt6 ? 18 : 0);
        const heroY = h * 0.49 - hopArc + Math.sin(t * 4) * 2;
        drawPixelSprite(
          ctx,
          a.currentTile < a.targetTile ? SPRITE_HERO_STEP : SPRITE_HERO_IDLE,
          heroX,
          heroY,
          3.8,
          heroPalette,
        );

        // Estrella dorada flotante si sacó >= 4 y ya llegó a su casilla
        if (a.diceRollTimer <= 0 && a.currentTile === a.targetTile && dadoFinal >= 4) {
          drawPixelSprite(ctx, SPRITE_STAR, heroX, heroY - 36 + Math.sin(t * 5) * 3, 2.5, {
            y: '#fde047',
            w: '#ffffff',
          });
        }

        // Dado 3D pixelado
        ctx.save();
        ctx.translate(42, 38);
        if (a.diceRollTimer > 0) ctx.rotate(t * 12);
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
        for (const [px, py] of pips[a.diceFaceShown] ?? pips[1]) {
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

        // Gradas animadas
        ctx.fillStyle = '#181036';
        ctx.fillRect(0, h * 0.46, w, h * 0.24);
        for (let c = 0; c < 26; c += 1) {
          const cx = (c + 0.5) * (w / 26);
          const hop = Math.abs(Math.sin(t * 4 + c)) * 3;
          ctx.fillStyle = c % 3 === 0 ? '#38bdf8' : c % 3 === 1 ? '#f472b6' : '#fde047';
          ctx.fillRect(Math.round(cx - 3), Math.round(h * 0.58 - hop), 6, 6);
        }

        ctx.fillStyle = '#312e81';
        ctx.fillRect(0, h * 0.68, w, h * 0.32);
        ctx.fillStyle = accent;
        ctx.fillRect(0, h * 0.68, w, 3);

        drawPixelSprite(ctx, SPRITE_HERO_IDLE, w * 0.17, h * 0.58 + Math.sin(t * 4) * 2.5, 3.9, heroPalette);
        drawPixelSprite(ctx, SPRITE_SLIME_KING, w * 0.83, h * 0.58 + Math.cos(t * 4) * 2.5, 3.9, slimePalette, true);

        // Cartas centrales de enfrentamiento
        const drawArenaCard = (cx: number, title: string, choice: number, revealed: boolean, col: string) => {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
          ctx.strokeStyle = col;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.roundRect(cx - 46, h * 0.24, 92, 82, 10);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = col;
          ctx.font = '700 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(title, cx, h * 0.24 + 14);

          const iconY = h * 0.24 + 44 + (preg ? Math.sin(t * 8) * 3 : 0);
          if (revealed && choice === 1) {
            drawPixelSprite(ctx, SPRITE_ROCK, cx, iconY, 3.2, { g: '#94a3b8', l: '#e2e8f0', d: '#475569' });
          } else if (revealed && choice === 2) {
            drawPixelSprite(ctx, SPRITE_PAPER, cx, iconY, 3.2, { w: '#f8fafc', b: '#38bdf8' });
          } else if (revealed && choice === 3) {
            drawPixelSprite(ctx, SPRITE_SCISSORS, cx, iconY, 3.2, { s: '#e2e8f0', r: '#f43f5e' });
          } else {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '700 22px "JetBrains Mono", monospace';
            ctx.fillText('?', cx, iconY + 7);
          }

          ctx.fillStyle = '#f8fafc';
          ctx.font = '700 10px "JetBrains Mono", monospace';
          ctx.fillText(revealed ? labels[choice] ?? 'LISTO' : preg ? 'ELIGE...' : 'LISTO', cx, h * 0.24 + 74);
        };

        const jugElegido = jug >= 1 && jug <= 3;
        drawArenaCard(w * 0.36, 'TU JUGADA', jug, jugElegido, '#38bdf8');
        drawArenaCard(w * 0.64, 'RIVAL', cpu, jugElegido && cpu >= 1 && cpu <= 3, '#f472b6');

        // Marcador superior de resultado
        const banner = /ganaste/i.test(ultimaSalida)
          ? '★ ¡GANASTE EL TORNEO! ★'
          : /empate/i.test(ultimaSalida)
            ? '⚡ ¡EMPATE! ⚡'
            : /perdiste/i.test(ultimaSalida)
              ? '¡RONDA PARA EL RIVAL!'
              : 'TORNEO ARCADE · MEJOR JUGADA';
        ctx.fillStyle = '#fde047';
        ctx.font = '700 12px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(banner, w * 0.5, 22);

        ctx.fillStyle = '#fde047';
        ctx.font = '700 16px "JetBrains Mono", monospace';
        ctx.fillText('VS', w * 0.5, h * 0.46);
      }

      // ======================== 4. BASE ESPACIAL NASA (CON CUENTA REGRESIVA REAL) ========================
      else if (sc === 'cohete') {
        if (a.rocketSeqActive && !desactivarAnimacion) {
          a.rocketSeqTime += dt;
        } else if (desactivarAnimacion && outs.length > 0) {
          a.rocketSeqTime = 4.5;
        }

        // 0.0..2.0s => T-5, T-4, T-3, T-2, T-1 (0.4s cada uno), > 2.0s => ¡DESPEGUE!
        const pasoCuenta = Math.max(0, 5 - Math.floor(a.rocketSeqTime / 0.4));
        const despegando = a.rocketSeqTime >= 2.0;
        if (despegando) {
          a.rocketAlt = Math.min(h * 0.48, (a.rocketSeqTime - 2.0) * 68);
        } else {
          a.rocketAlt = 0;
        }

        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, '#040714');
        sky.addColorStop(0.55, '#0f172a');
        sky.addColorStop(1, '#1e293b');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        const neb = ctx.createRadialGradient(w * 0.75, h * 0.28, 10, w * 0.75, h * 0.28, 95);
        neb.addColorStop(0, 'rgba(139, 92, 246, 0.26)');
        neb.addColorStop(1, 'rgba(139, 92, 246, 0)');
        ctx.fillStyle = neb;
        ctx.fillRect(0, 0, w, h);

        for (let i = 0; i < 30; i += 1) {
          const sx = ((i * 47.3) % 100) / 100 * w;
          const sy = (((i * 29.7 + (despegando ? (a.rocketSeqTime - 2) * 35 : 0)) % 76) / 100) * h;
          const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 2.5 + i));
          ctx.fillStyle = `rgba(255,255,255,${tw.toFixed(2)})`;
          ctx.fillRect(Math.round(sx), Math.round(sy), i % 5 === 0 ? 3 : 2, i % 5 === 0 ? 3 : 2);
        }

        // Saturno + base lunar
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(w * 0.19, h * 0.36, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(w * 0.19, h * 0.36, 28, 7, -0.28, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#334155';
        ctx.fillRect(0, h * 0.76, w, h * 0.24);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(0, h * 0.76, w, 3);

        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(w * 0.82, h * 0.76, 19, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(Math.round(w * 0.82 - 9), Math.round(h * 0.76 - 9), 5, 5);
        ctx.fillRect(Math.round(w * 0.82 + 3), Math.round(h * 0.76 - 9), 5, 5);

        // Torre cuyos brazos se retraen en T-1
        const openRatio = pasoCuenta <= 1 ? 1 : 0;
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(w * 0.5 - 52, h * 0.38, 8, h * 0.38);
        ctx.fillRect(w * 0.5 - 52, h * 0.46, 28 - openRatio * 18, 5);
        ctx.fillRect(w * 0.5 - 52, h * 0.6, 24 - openRatio * 16, 4);

        const rumble = pasoCuenta <= 2 && a.rocketAlt < h * 0.42 ? Math.sin(t * 48) * 2.5 : 0;
        const rx = w * 0.5 + rumble;
        const ry = h * 0.58 - a.rocketAlt;

        // Ignición desde T-2 + humo y despegue
        if (a.rocketSeqActive && pasoCuenta <= 2) {
          const flameH = 18 + Math.sin(t * 36) * 8 + (despegando ? 22 : 0);
          ctx.fillStyle = 'rgba(226, 232, 240, 0.42)';
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

        drawPixelSprite(ctx, SPRITE_ROCKET, rx, ry, 4.1, {
          p: '#f8fafc',
          s: accent,
          w: '#e0f2fe',
          b: '#38bdf8',
          y: '#facc15',
        });

        // Marcador digital NASA arriba izquierda
        const km = Math.round((a.rocketAlt / (h * 0.48)) * 150);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = despegando ? '#4ade80' : '#fde047';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(12, 12, 154, 42, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = despegando ? '#4ade80' : '#fde047';
        ctx.font = '700 15px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(
          !a.rocketSeqActive
            ? 'LISTO EN BASE'
            : km >= 140
              ? '★ ¡EN ÓRBITA!'
              : despegando
                ? '¡DESPEGANDO!'
                : `CUENTA: T-${pasoCuenta}`,
          20,
          31,
        );
        ctx.fillStyle = '#cbd5e1';
        ctx.font = '700 10px "JetBrains Mono", monospace';
        ctx.fillText(`ALTITUD: ${km} km`, 20, 46);
      }

      // ======================== 5. BÓVEDA SECRETA (1..10 VISUAL) & CALCULADORA DIGITAL ========================
      else if (sc === 'boveda') {
        const sky = ctx.createLinearGradient(0, 0, 0, h);
        sky.addColorStop(0, '#0f172a');
        sky.addColorStop(1, '#1e293b');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        if (isCalc) {
          // Modo Calculadora Mágica Digital
          const op = leerNumVar(vars, ['opcion'], 0);
          const n1 = leerNumVar(vars, ['primero'], 0);
          const n2 = leerNumVar(vars, ['segundo'], 0);
          const simbolos: Record<number, string> = { 1: '+', 2: '−', 3: '×', 4: '÷' };
          const opSym = simbolos[op] ?? '?';

          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
          ctx.strokeStyle = accent;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.roundRect(w * 0.5 - 150, h * 0.2, 300, 120, 14);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#94a3b8';
          ctx.font = '700 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('MÁQUINA CALCULADORA CHISPA', w * 0.5, h * 0.2 + 20);

          const resTxt = outs.length >= 2 && /resultado/i.test(outs.at(-2)?.texto ?? '') ? outs.at(-1)?.texto ?? '?' : '?';
          ctx.fillStyle = '#4ade80';
          ctx.font = '700 24px "JetBrains Mono", monospace';
          ctx.fillText(`${n1}  ${opSym}  ${n2}  =  ${resTxt}`, w * 0.5, h * 0.2 + 68);

          ctx.fillStyle = '#fde047';
          ctx.font = '700 11px "JetBrains Mono", monospace';
          ctx.fillText(preg ? `▶ ${preg}` : 'Pulsa Jugar para calcular otra operación', w * 0.5, h * 0.2 + 102);
        } else {
          // Modo Bóveda Secreta 1..10 con descarte visual de pistas
          const intento = leerNumVar(vars, ['intento'], 0);
          const abierta = outs.some((o) => /adivinaste/i.test(o.texto));
          const masGrande = !abierta && /más grande|mayor/i.test(ultimaSalida);
          const masPequeno = !abierta && /más pequeño|menor/i.test(ultimaSalida);

          // Barra superior de números 1 al 10 que apaga los descartados
          const barW = Math.min(w - 28, 360);
          const startX = (w - barW) / 2;
          const cellW = barW / 10;
          for (let n = 1; n <= 10; n += 1) {
            const possible = n >= a.vaultMin && n <= a.vaultMax;
            const isCurrent = n === intento;
            const bx = startX + (n - 1) * cellW + 2;
            ctx.fillStyle = abierta && isCurrent
              ? '#4ade80'
              : isCurrent
                ? '#fde047'
                : possible
                  ? 'rgba(30, 41, 59, 0.95)'
                  : 'rgba(15, 23, 42, 0.4)';
            ctx.strokeStyle = possible ? accent : '#334155';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(bx, 12, cellW - 4, 24, 5);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = (abierta && isCurrent) || isCurrent ? '#0f172a' : possible ? '#f8fafc' : '#475569';
            ctx.font = '700 11px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(String(n), bx + (cellW - 4) / 2, 28);
          }

          a.dialAngle += (intento * 0.62 - a.dialAngle) * 0.12;
          const cx = w * 0.5;
          const cy = h * 0.56;
          ctx.fillStyle = abierta ? '#065f46' : '#334155';
          ctx.strokeStyle = abierta ? '#4ade80' : accent;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(cx, cy, 48, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(a.dialAngle + (abierta ? t : 0));
          ctx.strokeStyle = abierta ? '#fde047' : '#cbd5e1';
          ctx.lineWidth = 3;
          for (let r = 0; r < 6; r += 1) {
            const ang = (r * Math.PI) / 3;
            ctx.beginPath();
            ctx.moveTo(Math.cos(ang) * 14, Math.sin(ang) * 14);
            ctx.lineTo(Math.cos(ang) * 39, Math.sin(ang) * 39);
            ctx.stroke();
          }
          ctx.restore();

          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.roundRect(cx - 24, cy - 15, 48, 30, 8);
          ctx.fill();
          ctx.fillStyle = abierta ? '#4ade80' : '#f8fafc';
          ctx.font = '700 14px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(abierta ? '★ OK' : String(intento || '?'), cx, cy + 5);

          const hintTxt = abierta
            ? '¡BÓVEDA ABIERTA!'
            : masGrande
              ? '↑ BUSCA MÁS GRANDE'
              : masPequeno
                ? '↓ BUSCA MÁS PEQUEÑO'
                : 'ADIVINA DEL 1 AL 10';
          ctx.fillStyle = abierta ? '#4ade80' : masGrande ? '#38bdf8' : masPequeno ? '#fb923c' : '#fde047';
          ctx.font = '700 11px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(hintTxt, 16, h - 34);
        }
      }

      // ======================== 6. PARQUE ALDEA CHISPA 16-BIT (CÓDIGO LIBRE) ========================
      else {
        const sky = ctx.createLinearGradient(0, 0, 0, h * 0.72);
        sky.addColorStop(0, '#1e3a8a');
        sky.addColorStop(0.55, '#38bdf8');
        sky.addColorStop(1, '#bae6fd');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#fde047';
        ctx.fillRect(Math.round(w * 0.78), 18, 22, 22);

        for (let i = 0; i < 4; i += 1) {
          const cx = (((i * 136 + t * 8) % (w + 80)) - 40);
          const cy = 20 + (i % 2) * 20;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(Math.round(cx), cy, 36, 7);
          ctx.fillRect(Math.round(cx) + 8, cy - 5, 20, 6);
        }

        // Montañas en paralaje
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

        ctx.fillStyle = '#16a34a';
        ctx.fillRect(0, h * 0.68, w, h * 0.32);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(0, h * 0.68, w, 4);

        // Casita pixel con humo + árboles + río con puente
        drawPixelCottage(ctx, 84, h * 0.7, t);
        drawPixelTree(ctx, 32, h * 0.72, 1.0);
        drawPixelTree(ctx, w - 42, h * 0.72, 1.05);

        ctx.fillStyle = '#d97706';
        ctx.fillRect(0, h * 0.81, w, 13);
        ctx.fillStyle = '#0ea5e9';
        ctx.fillRect(Math.round(w * 0.66), Math.round(h * 0.68), 38, Math.round(h * 0.32));
        ctx.fillStyle = '#92400e';
        ctx.fillRect(Math.round(w * 0.66 - 6), Math.round(h * 0.79), 50, 16);

        const hx = w * a.heroPosX;
        const hy = h * 0.66 - Math.sin(a.heroJump * Math.PI) * 22 + Math.sin(t * 3.8) * 2;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.3)';
        ctx.beginPath();
        ctx.ellipse(hx, h * 0.83, 18, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        drawPixelSprite(
          ctx,
          moving && Math.floor(t * 10) % 2 === 0 ? SPRITE_HERO_STEP : SPRITE_HERO_IDLE,
          hx,
          hy,
          4.1,
          heroPalette,
        );

        const nombreHero = leerTextoVar(vars, ['nombre', 'piloto', 'heroe'], 'Chispa');
        const msg = preg ? `❓ ${preg}` : ultimaSalida || `¡Hola! Soy ${nombreHero}`;
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

      // Monitores de variables estilo Scratch arriba derecha
      if (sc !== 'rpg' && sc !== 'torneo' && !(sc === 'boveda' && !isCalc) && vars.length > 0) {
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

      // Partículas y textos flotantes
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

      // Barra retro inferior con el mensaje actual o pregunta activa
      const msgBarra = preg ? `❓ ${preg}` : ultimaSalida ? `▶ ${ultimaSalida}` : '';
      if (sc !== 'chispa' && msgBarra) {
        const trimmed = msgBarra.length > 52 ? `${msgBarra.slice(0, 51)}…` : msgBarra;
        ctx.fillStyle = 'rgba(11, 16, 28, 0.92)';
        ctx.fillRect(0, h - 24, w, 24);
        ctx.fillStyle = preg ? '#38bdf8' : accent;
        ctx.fillRect(0, h - 24, w, 1.5);
        ctx.fillStyle = '#f8fafc';
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(trimmed, 10, h - 8);
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

  const handleStageKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const a = animRef.current;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      a.heroTargetX = Math.max(0.12, a.heroTargetX - 0.08);
      a.heroJump = 0.6;
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      a.heroTargetX = Math.min(0.88, a.heroTargetX + 0.08);
      a.heroJump = 0.6;
    } else if (e.key === 'ArrowUp' || e.key === ' ') {
      e.preventDefault();
      a.heroJump = 1;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = Math.round(((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 480);
    const sy = Math.round((0.5 - (e.clientY - rect.top) / Math.max(1, rect.height)) * 360);
    setCoords({ x: sx, y: sy });
  };

  const puedeReiniciar = estadoEjec === 'inactivo' && salidas.length > 0;

  return (
    <div className={`game-stage-shell ${ampliado ? 'is-expanded' : ''}`} data-stage-scene={escenaActiva}>
      {/* Barra superior: Selector real de juegos 2D + Controles estilo Scratch / MakeCode */}
      <div className="game-stage-bar">
        <div className="game-stage-modes" role="group" aria-label="Cargar juego 2D directamente">
          {JUEGOS_RAPIDOS.map((j) => (
            <button
              key={j.id}
              type="button"
              className="stage-mode-pill"
              aria-pressed={escenaActiva === j.id && !(j.id === 'boveda' && esCalculadora)}
              onClick={() => onSeleccionarJuego(j.id)}
              title={j.titulo}
            >
              {j.id === 'boveda' && esCalculadora ? <Calculator size={11} aria-hidden="true" /> : j.icon}
              <span>{j.label}</span>
            </button>
          ))}
        </div>

        <div className="stage-hw-controls">
          {coords && (
            <span className="stage-coords mono" aria-hidden="true">
              X:{coords.x} Y:{coords.y}
            </span>
          )}

          <button
            type="button"
            className="stage-play-pill"
            onClick={onJugar}
            title={puedeReiniciar ? 'Volver a jugar desde el inicio' : 'Iniciar juego 2D'}
          >
            {puedeReiniciar ? <RotateCcw size={12} aria-hidden="true" /> : <Play size={12} aria-hidden="true" />}
            <span>{puedeReiniciar ? 'Volver a jugar' : 'Jugar'}</span>
          </button>

          {estadoEjec !== 'inactivo' && (
            <button
              type="button"
              className="stage-stop-pill"
              onClick={onDetener}
              aria-label="Detener juego"
              title="Detener"
            >
              <Square size={11} aria-hidden="true" />
            </button>
          )}

          <button
            type="button"
            className="stage-size-pill"
            onClick={() => setAmpliado((v) => !v)}
            aria-label={ampliado ? 'Reducir escenario 2D' : 'Ampliar escenario 2D'}
            title={ampliado ? 'Tamaño normal' : 'Ampliar escenario'}
          >
            {ampliado ? <Minimize2 size={12} aria-hidden="true" /> : <Maximize2 size={12} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div className="game-stage-viewport">
        <canvas
          ref={canvasRef}
          className="game-stage-canvas"
          tabIndex={0}
          onClick={handleStageClick}
          onKeyDown={handleStageKeyDown}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCoords(null)}
          aria-label="Escenario interactivo de juego 2D"
          title="Haz clic o usa las flechas del teclado para mover a Chispa"
        />
      </div>

      {/* Mando interactivo acoplado al Escenario 2D cuando el juego espera jugada (también disponible en la Terminal!) */}
      {preguntaActiva && opcionesRapidas.length > 0 && (
        <div className="stage-controller-deck" role="group" aria-label="Elegir jugada en el escenario 2D">
          <span className="stage-controller-label">Tu turno:</span>
          <div className="stage-controller-btns">
            {opcionesRapidas.map((op) => (
              <button
                key={op.val}
                type="button"
                className="quick-choice-btn"
                onClick={() => onElegirOpcion(op.val)}
              >
                {op.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
