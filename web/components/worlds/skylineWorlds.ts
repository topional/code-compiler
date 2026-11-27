import type { Point2D, WorldPalette, WorldTap } from './types';

export interface SkylineWorldState {
  galaxyStars: { r: number; arm: number; offset: number; size: number; sec: boolean; speed: number }[];
  bgStars: { x: number; y: number; r: number; fase: number; sec: boolean; flare: boolean }[];
  milkyWayDust: { u: number; spread: number; size: number; sec: boolean; alpha: number }[];
  rainDrops: { x: number; y: number; len: number; speed: number; alpha: number; near: boolean }[];
  cityFar: { xNorm: number; wNorm: number; hNorm: number }[];
  cityBack: { xNorm: number; wNorm: number; hNorm: number; seed: number; hasSpire: boolean; hasTank: boolean }[];
  cityFront: { xNorm: number; wNorm: number; hNorm: number; seed: number; hasSign: boolean }[];
  glassBeads: { x: number; y: number; r: number; vy: number; born: number; trail: Point2D[] }[];
}

export function crearEstadoHorizonte(): SkylineWorldState {
  return {
    galaxyStars: Array.from({ length: 240 }, (_, i) => ({
      r: 10 + Math.pow((i * 13.7) % 100, 1.18) * 1.16,
      arm: i % 2,
      offset: ((i * 29.7) % 100) / 100 - 0.5,
      size: 0.8 + (i % 4) * 0.58,
      sec: i % 3 === 0,
      speed: 0.24 / (1 + ((i * 13.7) % 100) * 0.017),
    })),
    bgStars: Array.from({ length: 165 }, (_, i) => ({
      x: ((i * 73.1 + 11) % 100) / 100,
      y: ((i * 41.7 + 7) % 74) / 100,
      r: 0.7 + (i % 3) * 0.55,
      fase: i * 0.63,
      sec: i % 4 === 0,
      flare: i % 11 === 0,
    })),
    milkyWayDust: Array.from({ length: 160 }, (_, i) => ({
      u: ((i * 19.3 + 3) % 100) / 100,
      spread: (((i * 37.1) % 100) / 100 - 0.5) * 130,
      size: 0.7 + (i % 3) * 0.65,
      sec: i % 2 === 0,
      alpha: 0.14 + (i % 5) * 0.075,
    })),
    rainDrops: Array.from({ length: 125 }, (_, i) => ({
      x: ((i * 67.3) % 100) / 100,
      y: ((i * 43.1) % 100) / 100,
      len: i % 3 === 0 ? 24 + (i % 4) * 6 : 12 + (i % 4) * 4,
      speed: i % 3 === 0 ? 0.56 + (i % 4) * 0.08 : 0.32 + (i % 5) * 0.055,
      alpha: i % 3 === 0 ? 0.24 : 0.12 + (i % 3) * 0.03,
      near: i % 3 === 0,
    })),
    cityFar: Array.from({ length: 28 }, (_, i) => ({
      xNorm: i / 28,
      wNorm: 1 / 28 + 0.01,
      hNorm: 0.14 + (((i * 23 + 9) % 17) / 17) * 0.24,
    })),
    cityBack: Array.from({ length: 22 }, (_, i) => ({
      xNorm: i / 22,
      wNorm: 1 / 22 + 0.012,
      hNorm: 0.1 + (((i * 29 + 7) % 15) / 15) * 0.22,
      seed: i * 31 + 5,
      hasSpire: i % 4 === 1,
      hasTank: i % 6 === 3,
    })),
    cityFront: Array.from({ length: 18 }, (_, i) => ({
      xNorm: i / 18,
      wNorm: 1 / 18 + 0.008,
      hNorm: 0.06 + (((i * 37 + 13) % 13) / 13) * 0.14,
      seed: i * 19 + 11,
      hasSign: i % 4 === 2,
    })),
    glassBeads: [],
  };
}

export function registrarToqueHorizonte(
  modo: string,
  state: SkylineWorldState,
  x: number,
  y: number,
  tiempo: number,
) {
  if (modo === 'lluvia') {
    state.glassBeads.push({
      x,
      y,
      r: 6.2,
      vy: 15,
      born: tiempo,
      trail: [{ x, y }],
    });
    for (let i = 0; i < 5; i += 1) {
      const ang = (i / 5) * Math.PI * 2 + x * 0.05;
      state.glassBeads.push({
        x: x + Math.cos(ang) * (10 + i * 4),
        y: y + Math.sin(ang) * (8 + i * 4),
        r: 2.2 + (i % 2) * 1.1,
        vy: 8 + i * 3.8,
        born: tiempo,
        trail: [],
      });
    }
    if (state.glassBeads.length > 32) {
      state.glassBeads.splice(0, state.glassBeads.length - 32);
    }
  }
}

function dibujarEstrellaConDestello(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  col: string,
  alpha: number,
  flare: boolean,
) {
  ctx.fillStyle = `rgba(${col}, ${alpha.toFixed(3)})`;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  if (flare) {
    const len = r * 5.2;
    ctx.strokeStyle = `rgba(${col}, ${(alpha * 0.55).toFixed(3)})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x - len, y);
    ctx.lineTo(x + len, y);
    ctx.moveTo(x, y - len);
    ctx.lineTo(x, y + len);
    ctx.stroke();
  }
}

// ============================================================================
// 3. COSMOS — Nebulosas + estrellas con difracción + Galaxia Espiral + Gargantua Doppler + cometa
// ============================================================================
export function dibujarCosmos(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  t: number,
  pal: WorldPalette,
  taps: WorldTap[],
  state: SkylineWorldState,
  mouse: Point2D,
) {
  const { bgR, bgG, bgB, pR, pG, pB, sR, sG, sB, esClaro } = pal;
  ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
  ctx.fillRect(0, 0, ancho, alto);

  // 1. Tres nubes de nebulosa cósmica volumétricas con deriva lenta
  const nebulae = [
    { x: 0.16, y: 0.78, rx: 0.42, col: `${sR}, ${sG}, ${sB}`, a: esClaro ? 0.13 : 0.16 },
    { x: 0.86, y: 0.78, rx: 0.36, col: `${pR}, ${pG}, ${pB}`, a: esClaro ? 0.12 : 0.15 },
    { x: 0.52, y: 0.14, rx: 0.32, col: `${sR}, ${sG}, ${sB}`, a: esClaro ? 0.08 : 0.09 },
  ];
  for (const nb of nebulae) {
    const nx = ancho * nb.x + (mouse.x - 0.5) * 18;
    const ny = alto * nb.y + (mouse.y - 0.5) * 14;
    const rad = Math.max(ancho, alto) * nb.rx;
    const ng = ctx.createRadialGradient(nx, ny, 8, nx, ny, rad);
    ng.addColorStop(0, `rgba(${nb.col}, ${nb.a})`);
    ng.addColorStop(0.55, `rgba(${nb.col}, ${(nb.a * 0.35).toFixed(3)})`);
    ng.addColorStop(1, `rgba(${nb.col}, 0)`);
    ctx.fillStyle = ng;
    ctx.fillRect(0, 0, ancho, alto);
  }

  // 2. Campo de 165 estrellas con picos de difracción (+) en las más brillantes
  for (const st of state.bgStars) {
    const sx = st.x * ancho + (mouse.x - 0.5) * -10 * st.r;
    const sy = st.y * alto * 1.32 + (mouse.y - 0.5) * -8 * st.r;
    const tw = 0.35 + 0.65 * Math.sin(t * 1.9 + st.fase);
    const col = st.sec ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    dibujarEstrellaConDestello(ctx, sx, sy, st.r, col, tw * (esClaro ? 0.52 : 0.66), st.flare);
  }

  // 3. Estrella fugaz ambiental periódica cruzando el cielo superior
  const shootCycle = t % 6.5;
  if (shootCycle < 1.1) {
    const sp = shootCycle / 1.1;
    const sx0 = ancho * 0.24 + sp * ancho * 0.38;
    const sy0 = alto * 0.08 + sp * alto * 0.14;
    const fade = Math.sin(sp * Math.PI);
    const sg = ctx.createLinearGradient(sx0 - 95, sy0 - 34, sx0, sy0);
    sg.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, 0)`);
    sg.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.78).toFixed(3)})`);
    ctx.strokeStyle = sg;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(sx0 - 95, sy0 - 34);
    ctx.lineTo(sx0, sy0);
    ctx.stroke();
    ctx.fillStyle = `rgba(255, 255, 255, ${(fade * 0.92).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(sx0, sy0, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Galaxia espiral barrada rotatoria (esquina inferior izquierda, 240 estrellas)
  const gx = ancho * (0.14 + (mouse.x - 0.5) * -0.024);
  const gy = alto * (0.81 + (mouse.y - 0.5) * -0.024);
  ctx.save();
  ctx.translate(gx, gy);
  ctx.rotate(-0.32);
  ctx.scale(1.18, 0.56);

  const gCore = ctx.createRadialGradient(0, 0, 2, 0, 0, 125);
  gCore.addColorStop(0, `rgba(255, 255, 255, ${esClaro ? 0.42 : 0.52})`);
  gCore.addColorStop(0.18, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.34 : 0.44})`);
  gCore.addColorStop(0.58, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.14 : 0.18})`);
  gCore.addColorStop(1, `rgba(${sR}, ${sG}, ${sB}, 0)`);
  ctx.fillStyle = gCore;
  ctx.beginPath();
  ctx.arc(0, 0, 125, 0, Math.PI * 2);
  ctx.fill();

  for (const st of state.galaxyStars) {
    const ang = st.arm * Math.PI + st.r * 0.036 + t * st.speed + st.offset * 0.72;
    const sx = Math.cos(ang) * st.r;
    const sy = Math.sin(ang) * st.r;
    const col = st.sec ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    const a = Math.max(0.12, (1 - st.r / 255) * (esClaro ? 0.74 : 0.88));
    ctx.fillStyle = `rgba(${col}, ${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(sx, sy, st.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 5. Agujero Negro Gargantua (abajo derecha, despejado) con Doppler beaming relativista + arcos de lente
  const bhX = ancho * (0.865 + (mouse.x - 0.5) * 0.03);
  const bhY = alto * (0.8 + (mouse.y - 0.5) * 0.03);
  const bhR = Math.min(ancho, alto) * 0.064;

  ctx.save();
  ctx.translate(bhX, bhY);
  ctx.rotate(-0.24);

  // Halo gravitacional ambiental
  const bhGlow = ctx.createRadialGradient(0, 0, bhR * 0.9, 0, 0, bhR * 4.5);
  bhGlow.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.24 : 0.3})`);
  bhGlow.addColorStop(0.45, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.1 : 0.14})`);
  bhGlow.addColorStop(1, `rgba(${bgR}, ${bgG}, ${bgB}, 0)`);
  ctx.fillStyle = bhGlow;
  ctx.beginPath();
  ctx.arc(0, 0, bhR * 4.5, 0, Math.PI * 2);
  ctx.fill();

  // Arcos superior e inferior de lente gravitacional
  for (let band = 0; band < 7; band += 1) {
    const rBand = bhR * (1.2 + band * 0.12);
    const col = band % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    ctx.strokeStyle = `rgba(${col}, ${(0.52 - band * 0.065).toFixed(3)})`;
    ctx.lineWidth = 2.7 - band * 0.28;
    ctx.beginPath();
    ctx.arc(0, 0, rBand, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(${col}, ${(0.3 - band * 0.036).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(0, 0, rBand * 0.94, 0, Math.PI);
    ctx.stroke();
  }

  // Disco de acreción trasero
  for (let band = 0; band < 9; band += 1) {
    const rx = bhR * (1.5 + band * 0.32);
    const ry = rx * 0.24;
    const col = band % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    ctx.strokeStyle = `rgba(${col}, ${(0.54 - band * 0.05).toFixed(3)})`;
    ctx.lineWidth = 2.4 - band * 0.18;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
  }

  // Horizonte de sucesos + doble anillo de fotones
  ctx.fillStyle = esClaro ? '#0a0d16' : '#020308';
  ctx.beginPath();
  ctx.arc(0, 0, bhR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(255, 255, 255, ${esClaro ? 0.55 : 0.72})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, bhR * 1.02, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, 0.95)`;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(0, 0, bhR * 1.06, 0, Math.PI * 2);
  ctx.stroke();

  // Disco de acreción delantero con gradiente Doppler (lado izquierdo más incandescente)
  for (let band = 0; band < 9; band += 1) {
    const rx = bhR * (1.5 + band * 0.32);
    const ry = rx * 0.24;
    const doppler = ctx.createLinearGradient(-rx, 0, rx, 0);
    const baseA = 0.78 - band * 0.068;
    const col = band % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    doppler.addColorStop(0, `rgba(255, 255, 255, ${(baseA * 0.95).toFixed(3)})`);
    doppler.addColorStop(0.28, `rgba(${col}, ${baseA.toFixed(3)})`);
    doppler.addColorStop(1, `rgba(${col}, ${(baseA * 0.42).toFixed(3)})`);
    ctx.strokeStyle = doppler;
    ctx.lineWidth = 3.0 - band * 0.22;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI);
    ctx.stroke();

    // Nodos de plasma supercaliente orbitando
    const pAng = (t * (1.5 - band * 0.1) + band * 1.25) % (Math.PI * 2);
    if (Math.sin(pAng) > -0.1) {
      ctx.fillStyle = band % 3 === 0 ? 'rgba(255, 255, 255, 0.92)' : `rgba(${col}, 0.92)`;
      ctx.beginPath();
      ctx.arc(Math.cos(pAng) * rx, Math.sin(pAng) * ry, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // 6. Animación exclusiva de toque: Anillo de Einstein + lluvia de 9 meteoros relativistas curvados
  for (const tap of taps) {
    const p = (t - tap.born) / 2.4;
    if (p < 0 || p > 1) continue;
    const fade = 1 - p;

    const ringR = 14 + p * 140;
    ctx.strokeStyle = `rgba(255, 255, 255, ${(fade * 0.45).toFixed(3)})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(tap.x, tap.y, ringR * 0.94, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${(fade * 0.85).toFixed(3)})`;
    ctx.lineWidth = 2.2 * fade;
    ctx.beginPath();
    ctx.arc(tap.x, tap.y, ringR, 0, Math.PI * 2);
    ctx.stroke();

    for (let k = 0; k < 9; k += 1) {
      const baseAng = (k / 9) * Math.PI * 2 + tap.seed;
      const curve = p * 0.82;
      const dist = 14 + p * (155 + (k % 3) * 44);
      const col = k % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
      const ex = tap.x + Math.cos(baseAng + curve) * dist;
      const ey = tap.y + Math.sin(baseAng + curve) * dist;
      const tx0 = tap.x + Math.cos(baseAng + curve * 0.6) * Math.max(4, dist - 48);
      const ty0 = tap.y + Math.sin(baseAng + curve * 0.6) * Math.max(4, dist - 48);
      ctx.strokeStyle = `rgba(${col}, ${(fade * 0.9).toFixed(3)})`;
      ctx.lineWidth = 1.9;
      ctx.beginPath();
      ctx.moveTo(tx0, ty0);
      ctx.lineTo(ex, ey);
      ctx.stroke();
      ctx.fillStyle = `rgba(255, 255, 255, ${(fade * 0.95).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function dibujarOctaedro3D(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  rx: number,
  ry: number,
  col: string,
  alpha: number,
) {
  const verts: [number, number, number][] = [
    [0, -1, 0],
    [1, 0, 0],
    [0, 0, 1],
    [-1, 0, 0],
    [0, 0, -1],
    [0, 1, 0],
  ];
  const edges: [number, number][] = [
    [0, 1], [0, 2], [0, 3], [0, 4],
    [5, 1], [5, 2], [5, 3], [5, 4],
    [1, 2], [2, 3], [3, 4], [4, 1],
  ];
  const cosY = Math.cos(ry);
  const sinY = Math.sin(ry);
  const cosX = Math.cos(rx);
  const sinX = Math.sin(rx);
  const proj = verts.map(([x, y, z]) => {
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;
    const y2 = y * cosX - z1 * sinX;
    return { x: cx + x1 * size, y: cy + y2 * size };
  });

  ctx.strokeStyle = `rgba(${col}, ${alpha.toFixed(3)})`;
  ctx.lineWidth = 1.15;
  ctx.beginPath();
  for (const [a, b] of edges) {
    ctx.moveTo(proj[a].x, proj[a].y);
    ctx.lineTo(proj[b].x, proj[b].y);
  }
  ctx.stroke();
}

// ============================================================================
// 4. VECTOR 3D — Sol Synthwave segmentado + octaedros 3D + cañón wireframe con oclusión + sonar 3D
// ============================================================================
export function dibujarMontanasVector(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  t: number,
  pal: WorldPalette,
  taps: WorldTap[],
  state: SkylineWorldState,
  mouse: Point2D,
) {
  const { bgR, bgG, bgB, pR, pG, pB, sR, sG, sB, esClaro } = pal;
  ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
  ctx.fillRect(0, 0, ancho, alto);

  const horizonY = alto * 0.62;
  const vanishX = ancho * (0.5 + (mouse.x - 0.5) * 0.08);

  // 1. Cielo estrellado discreto sobre el horizonte
  for (let i = 0; i < 60; i += 1) {
    const st = state.bgStars[i];
    const sy = st.y * horizonY * 1.1;
    if (sy > horizonY - 14) continue;
    const tw = 0.3 + 0.7 * Math.sin(t * 1.7 + st.fase);
    ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${(tw * (esClaro ? 0.34 : 0.4)).toFixed(3)})`;
    ctx.fillRect(st.x * ancho, sy, 1.5, 1.5);
  }

  // 2. Balizas geométricas low-poly (octaedros 3D reales girando suavemente en los márgenes)
  dibujarOctaedro3D(ctx, ancho * 0.075, alto * 0.22 + Math.sin(t * 0.9) * 8, 22, t * 0.45, t * 0.75, `${sR}, ${sG}, ${sB}`, esClaro ? 0.36 : 0.42);
  dibujarOctaedro3D(ctx, ancho * 0.94, alto * 0.24 + Math.cos(t * 0.8) * 8, 19, -t * 0.5, t * 0.65, `${pR}, ${pG}, ${pB}`, esClaro ? 0.36 : 0.42);

  // 3. Sol Retro Synthwave segmentado con bandas horizontales en el horizonte izquierdo-bajo
  const sunX = ancho * 0.13;
  const sunY = horizonY - 4;
  const sunR = Math.min(ancho, alto) * 0.095;
  const sunHalo = ctx.createRadialGradient(sunX, sunY, sunR * 0.4, sunX, sunY, sunR * 2.8);
  sunHalo.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.2 : 0.24})`);
  sunHalo.addColorStop(0.55, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.08 : 0.1})`);
  sunHalo.addColorStop(1, `rgba(${bgR}, ${bgG}, ${bgB}, 0)`);
  ctx.fillStyle = sunHalo;
  ctx.fillRect(0, 0, ancho, horizonY + 30);

  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, Math.PI, Math.PI * 2);
  ctx.clip();
  const sunGrad = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY);
  sunGrad.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.72 : 0.82})`);
  sunGrad.addColorStop(1, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.42 : 0.52})`);
  ctx.fillStyle = sunGrad;
  ctx.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR);
  // Cortes horizontales retro synthwave
  ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
  for (let sl = 0; sl < 6; sl += 1) {
    const sy = sunY - sunR * (0.1 + sl * 0.13);
    const sh = 1.6 + (5 - sl) * 0.7;
    ctx.fillRect(sunX - sunR, sy, sunR * 2, sh);
  }
  ctx.restore();

  // Resplandor horizontal del horizonte
  const horG = ctx.createLinearGradient(0, horizonY - 60, 0, horizonY + 12);
  horG.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, 0)`);
  horG.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.15 : 0.18})`);
  ctx.fillStyle = horG;
  ctx.fillRect(0, horizonY - 60, ancho, 72);

  // 4. Malla 3D de cañón montañoso en perspectiva (líneas transversales + longitudinales + oclusión real)
  const rows = 20;
  const cols = 38;
  const speed = t * 1.18;
  const scanRow = (t * 6.5) % rows;
  const mesh: Point2D[][] = [];

  for (let r = 0; r < rows; r += 1) {
    const zNorm = (r + (speed % 1)) / rows;
    const persp = Math.pow(zNorm, 1.85);
    const yBase = horizonY + persp * (alto - horizonY + 86);
    const rowIdx = Math.floor(speed) - r;
    const rowPts: Point2D[] = [];

    for (let c = 0; c <= cols; c += 1) {
      const u = c / cols;
      const worldX = (u - 0.5) * 2.55;
      const sx = vanishX + worldX * (ancho * (0.34 + persp * 0.92));

      // Cañón central más despejado para texto, cordilleras escarpadas en ambos costados
      const valley = Math.pow(Math.min(1, Math.abs(worldX) * 0.92), 1.62);
      const ridge =
        (Math.sin(worldX * 4.4 + rowIdx * 0.38) * 0.55 +
          Math.cos(worldX * 8.6 - rowIdx * 0.25) * 0.35 +
          Math.sin(worldX * 14 + rowIdx * 0.16) * 0.15 +
          0.92) *
        valley *
        (46 + persp * 175);

      // Deformación física 3D por pulso sísmico al tocar el fondo
      let sonarLift = 0;
      for (const tap of taps) {
        const p = (t - tap.born) / 2.2;
        if (p < 0 || p > 1) continue;
        const d = Math.hypot(sx - tap.x, yBase - ridge - tap.y);
        const wave = 16 + p * 440;
        if (Math.abs(d - wave) < 42) {
          sonarLift += Math.cos(((d - wave) / 42) * (Math.PI * 0.5)) * (1 - p) * 34;
        }
      }

      rowPts.push({ x: sx, y: yBase - ridge - sonarLift });
    }
    mesh.push(rowPts);
  }

  // Dibujar de atrás hacia adelante con algoritmo del pintor (oclusión limpia)
  for (let r = 0; r < rows; r += 1) {
    const pts = mesh[r];
    const zNorm = r / rows;
    const isScan = Math.abs(r - scanRow) < 1.15;

    ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, alto + 10);
    for (let c = 0; c <= cols; c += 1) ctx.lineTo(pts[c].x, pts[c].y);
    ctx.lineTo(pts[cols].x, alto + 10);
    ctx.closePath();
    ctx.fill();

    // Líneas longitudinales que conectan esta fila con la anterior
    if (r > 0) {
      const prev = mesh[r - 1];
      ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${(0.12 + zNorm * 0.28).toFixed(3)})`;
      ctx.lineWidth = 0.85 + zNorm * 0.45;
      ctx.beginPath();
      for (let c = 0; c <= cols; c += 2) {
        ctx.moveTo(prev[c].x, prev[c].y);
        ctx.lineTo(pts[c].x, pts[c].y);
      }
      ctx.stroke();
    }

    // Cresta transversal con brillo de escáner
    const col = isScan ? `${pR}, ${pG}, ${pB}` : r % 3 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    const alpha = isScan ? 0.82 : (esClaro ? 0.22 : 0.24) + zNorm * 0.44;
    ctx.strokeStyle = `rgba(${col}, ${alpha.toFixed(3)})`;
    ctx.lineWidth = isScan ? 2.2 : 1.0 + zNorm * 0.65;
    ctx.beginPath();
    for (let c = 0; c <= cols; c += 1) {
      if (c === 0) ctx.moveTo(pts[c].x, pts[c].y);
      else ctx.lineTo(pts[c].x, pts[c].y);
    }
    ctx.stroke();

    // Nodos brillantes de vértice sobre las cimas altas
    if (r % 2 === 0) {
      for (let c = 2; c < cols; c += 4) {
        if (pts[c].y < horizonY - 12) {
          ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${(0.35 + zNorm * 0.45).toFixed(3)})`;
          ctx.fillRect(pts[c].x - 1.5, pts[c].y - 1.5, 3, 3);
        }
      }
    }
  }

  // 5. Pulso sísmico 3D interactivo al tocar (ilumina nodos de malla en diamante)
  for (const tap of taps) {
    const p = (t - tap.born) / 2.2;
    if (p < 0 || p > 1) continue;
    const fade = 1 - p;
    const wave = 16 + p * 440;

    ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.72).toFixed(3)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(tap.x, tap.y, wave, wave * 0.38, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.94).toFixed(3)})`;
    for (let r = 0; r < rows; r += 2) {
      for (let c = 0; c <= cols; c += 2) {
        const pt = mesh[r][c];
        const d = Math.hypot(pt.x - tap.x, pt.y - tap.y);
        if (Math.abs(d - wave) < 26) {
          ctx.save();
          ctx.translate(pt.x, pt.y);
          ctx.rotate(Math.PI * 0.25);
          ctx.fillRect(-3, -3, 6, 6);
          ctx.restore();
        }
      }
    }
  }
}

// ============================================================================
// 5. LLUVIA NEÓN — Metrópolis 3 capas + monorriel luminoso + carteles + lluvia con salpicaduras + gotas
// ============================================================================
export function dibujarLluviaNeon(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  t: number,
  pal: WorldPalette,
  taps: WorldTap[],
  state: SkylineWorldState,
  estatico: boolean,
) {
  const { bgR, bgG, bgB, pR, pG, pB, sR, sG, sB, esClaro } = pal;
  ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
  ctx.fillRect(0, 0, ancho, alto);

  // 1. Destello atmosférico ocasional muy sutil de relámpago lejano en las nubes altas
  const boltPhase = t % 11.4;
  if (boltPhase < 0.14 || (boltPhase > 0.22 && boltPhase < 0.3)) {
    const fg = ctx.createRadialGradient(ancho * 0.22, alto * 0.06, 10, ancho * 0.22, alto * 0.06, ancho * 0.45);
    fg.addColorStop(0, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.1 : 0.13})`);
    fg.addColorStop(1, `rgba(${bgR}, ${bgG}, ${bgB}, 0)`);
    ctx.fillStyle = fg;
    ctx.fillRect(0, 0, ancho, alto * 0.45);
  }

  // 2. Resplandor neón urbano elevándose desde la avenida inferior
  const haze = ctx.createLinearGradient(0, alto * 0.62, 0, alto);
  haze.addColorStop(0, `rgba(${bgR}, ${bgG}, ${bgB}, 0)`);
  haze.addColorStop(0.6, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.1 : 0.12})`);
  haze.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.14 : 0.18})`);
  ctx.fillStyle = haze;
  ctx.fillRect(0, alto * 0.62, ancho, alto * 0.38);

  // 3. Cables catenarios superiores con pulsos de datos veloces
  for (let c = 0; c < 3; c += 1) {
    const yL = alto * (0.09 + c * 0.055);
    const yR = alto * (0.14 + c * 0.048);
    const sag = 34 + c * 15;
    ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.16 : 0.16})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, yL);
    ctx.quadraticCurveTo(ancho * 0.5, (yL + yR) * 0.5 + sag, ancho, yR);
    ctx.stroke();

    const u = ((t * (0.2 + c * 0.08) + c * 0.33) % 1);
    const inv = 1 - u;
    const px = u * ancho;
    const py = inv * inv * yL + 2 * inv * u * ((yL + yR) * 0.5 + sag) + u * u * yR;
    const col = c % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    ctx.fillStyle = `rgba(${col}, 0.9)`;
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Capa lejana (3er plano) de megatorres envueltas en neblina
  ctx.fillStyle = esClaro ? `rgba(${sR}, ${sG}, ${sB}, 0.09)` : 'rgba(6, 10, 20, 0.36)';
  for (const b of state.cityFar) {
    const bx = b.xNorm * ancho;
    const bw = b.wNorm * ancho;
    const bh = b.hNorm * alto;
    ctx.fillRect(bx, alto - bh, bw, bh);
  }

  // 5. Capa intermedia de rascacielos con agujas, balizas parpadeantes y tanques de agua
  for (const b of state.cityBack) {
    const bx = b.xNorm * ancho;
    const bw = b.wNorm * ancho;
    const bh = b.hNorm * alto;
    const by = alto - bh;

    ctx.fillStyle = esClaro ? `rgba(${sR}, ${sG}, ${sB}, 0.14)` : 'rgba(8, 12, 22, 0.54)';
    ctx.fillRect(bx, by, bw, bh);

    // Borde superior iluminado por el neón
    ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.24 : 0.26})`;
    ctx.fillRect(bx, by, bw, 1.5);

    if (b.hasSpire) {
      const sx = bx + bw * 0.5;
      ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, 0.42)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(sx, by);
      ctx.lineTo(sx, by - 36);
      ctx.stroke();
      const blink = 0.25 + 0.75 * Math.sin(t * 3.8 + b.seed);
      ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${blink.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(sx, by - 38, 2.4, 0, Math.PI * 2);
      ctx.fill();
    } else if (b.hasTank) {
      ctx.fillStyle = esClaro ? `rgba(${sR}, ${sG}, ${sB}, 0.22)` : 'rgba(12, 18, 32, 0.7)';
      ctx.fillRect(bx + bw * 0.28, by - 14, bw * 0.34, 10);
      ctx.fillRect(bx + bw * 0.34, by - 4, 2, 4);
      ctx.fillRect(bx + bw * 0.52, by - 4, 2, 4);
    }

    // Ventanas encendidas
    for (let wy = by + 10; wy < alto - 22; wy += 12) {
      for (let wx = bx + 6; wx < bx + bw - 8; wx += 10) {
        const h = (Math.floor(wx) * 19 + Math.floor(wy) * 13 + b.seed) % 19;
        if (h < 4) {
          const col = h === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
          ctx.fillStyle = `rgba(${col}, ${esClaro ? 0.34 : 0.4})`;
          ctx.fillRect(wx, wy, 4.2, 6);
        }
      }
    }
  }

  // 6. Monorriel elevado deslizándose suavemente por el viaducto urbano
  const railY = alto - 56;
  ctx.fillStyle = esClaro ? `rgba(${sR}, ${sG}, ${sB}, 0.22)` : 'rgba(10, 15, 28, 0.76)';
  ctx.fillRect(0, railY, ancho, 4);
  const trainX = (((t * 0.14) % 1.35) - 0.18) * ancho;
  const trainLen = 140;
  // Estela luminosa del tren
  const trailG = ctx.createLinearGradient(trainX - 85, railY, trainX, railY);
  trailG.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, 0)`);
  trailG.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, 0.45)`);
  ctx.fillStyle = trailG;
  ctx.fillRect(trainX - 85, railY - 6, 85, 5);
  // Vagones + ventanas iluminadas
  ctx.fillStyle = esClaro ? `rgba(${sR}, ${sG}, ${sB}, 0.55)` : 'rgba(16, 22, 38, 0.94)';
  ctx.beginPath();
  ctx.roundRect(trainX, railY - 11, trainLen, 10, [4, 6, 1, 1]);
  ctx.fill();
  ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, 0.92)`;
  for (let w = 0; w < 8; w += 1) {
    ctx.fillRect(trainX + 10 + w * 15, railY - 8.5, 9, 3.8);
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillRect(trainX + trainLen - 5, railY - 6, 5, 2.5);

  // 7. Capa frontal de edificios + carteles neón holográficos verticales
  for (const b of state.cityFront) {
    const bx = b.xNorm * ancho;
    const bw = b.wNorm * ancho;
    const bh = b.hNorm * alto;
    const by = alto - bh;

    ctx.fillStyle = esClaro ? `rgba(${pR}, ${pG}, ${pB}, 0.13)` : 'rgba(4, 7, 15, 0.78)';
    ctx.fillRect(bx, by, bw, bh);

    // Chispitas de lluvia golpeando los techos
    if (!estatico && ((Math.floor(t * 14) + b.seed) % 9 === 0)) {
      const sx = bx + ((b.seed * 7) % Math.max(8, Math.floor(bw)));
      ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, 0.55)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx - 3, by - 3);
      ctx.lineTo(sx, by);
      ctx.lineTo(sx + 3, by - 3);
      ctx.stroke();
    }

    if (b.hasSign) {
      const sx = bx + bw * 0.2;
      const sy = by + 10;
      const flicker = Math.sin(t * 8 + b.seed) > -0.78 ? 1 : 0.3;
      const col = b.seed % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
      ctx.strokeStyle = `rgba(${col}, ${(0.76 * flicker).toFixed(3)})`;
      ctx.fillStyle = `rgba(${col}, ${(0.18 * flicker).toFixed(3)})`;
      ctx.lineWidth = 1.4;
      ctx.fillRect(sx, sy, 10, 32);
      ctx.strokeRect(sx, sy, 10, 32);
      // Glifos horizontales tipo letrero neón
      ctx.fillStyle = `rgba(${col}, ${(0.88 * flicker).toFixed(3)})`;
      for (let g = 0; g < 4; g += 1) {
        ctx.fillRect(sx + 2.5, sy + 5 + g * 6.5, 5, 2);
      }
    }
  }

  // 8. Lluvia diagonal en 2 planos de profundidad
  ctx.lineCap = 'round';
  for (const d of state.rainDrops) {
    const ry = (((d.y + (estatico ? 0 : t * d.speed)) % 1.15) - 0.08) * alto;
    const rx = (((d.x - (estatico ? 0 : t * d.speed * 0.22)) % 1.15) + 1.15) % 1.15 * ancho - 40;
    const col = d.near ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;
    ctx.strokeStyle = `rgba(${col}, ${(d.alpha * (esClaro ? 1.05 : 1)).toFixed(3)})`;
    ctx.lineWidth = d.near ? 1.2 : 0.85;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - d.len * 0.22, ry + d.len);
    ctx.stroke();
  }

  // 9. Gotas refractivas resbalando por el cristal al tocar el fondo
  const dt = estatico ? 0 : 0.016;
  for (let i = state.glassBeads.length - 1; i >= 0; i -= 1) {
    const gb = state.glassBeads[i];
    const age = t - gb.born;
    if (age > 4.2 || gb.y > alto + 20) {
      state.glassBeads.splice(i, 1);
      continue;
    }
    if (!estatico) {
      gb.vy = Math.min(108, gb.vy + 22 * dt);
      gb.y += gb.vy * dt;
      gb.x += Math.sin(t * 7 + gb.r * 3) * 11 * dt;
      if (gb.r > 4) {
        gb.trail.push({ x: gb.x, y: gb.y });
        if (gb.trail.length > 26) gb.trail.shift();
      }
    }
    const fade = Math.max(0, 1 - age / 4.2);

    if (gb.trail.length > 1) {
      ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${(fade * 0.42).toFixed(3)})`;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let ti = 0; ti < gb.trail.length; ti += 1) {
        if (ti === 0) ctx.moveTo(gb.trail[ti].x, gb.trail[ti].y);
        else ctx.lineTo(gb.trail[ti].x, gb.trail[ti].y);
      }
      ctx.stroke();
    }

    ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.34).toFixed(3)})`;
    ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${(fade * 0.92).toFixed(3)})`;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.ellipse(gb.x, gb.y, gb.r * 0.86, gb.r * 1.18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 255, 255, ${(fade * 0.88).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(gb.x - gb.r * 0.28, gb.y - gb.r * 0.32, gb.r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }

  // Corona de impacto inicial al tocar
  for (const tap of taps) {
    const p = (t - tap.born) / 1.1;
    if (p < 0 || p > 1) continue;
    const fade = 1 - p;
    ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.65).toFixed(3)})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(tap.x, tap.y, 10 + p * 36, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ============================================================================
// 6. ACRÓPOLIS ESTELAR — Vía Láctea + astrolabio + 4 constelaciones + Partenón con antorchas y cipreses
// ============================================================================
export function dibujarAcropolisEstelar(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  t: number,
  pal: WorldPalette,
  taps: WorldTap[],
  state: SkylineWorldState,
) {
  const { bgR, bgG, bgB, pR, pG, pB, sR, sG, sB, esClaro } = pal;
  ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
  ctx.fillRect(0, 0, ancho, alto);

  // 1. Banda luminosa diagonal de la Vía Láctea con polvo estelar
  ctx.save();
  ctx.translate(ancho * 0.5, alto * 0.34);
  ctx.rotate(-0.34);
  const mw = ctx.createLinearGradient(0, -105, 0, 105);
  mw.addColorStop(0, `rgba(${sR}, ${sG}, ${sB}, 0)`);
  mw.addColorStop(0.5, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.12 : 0.13})`);
  mw.addColorStop(1, `rgba(${sR}, ${sG}, ${sB}, 0)`);
  ctx.fillStyle = mw;
  ctx.fillRect(-ancho * 0.85, -105, ancho * 1.7, 210);

  // 160 cúmulos finos de estrellas dentro de la Vía Láctea
  for (const d of state.milkyWayDust) {
    const mx = (d.u - 0.5) * ancho * 1.4;
    const my = d.spread;
    const col = d.sec ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;
    ctx.fillStyle = `rgba(${col}, ${(d.alpha * (esClaro ? 0.9 : 1)).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(mx, my, d.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 2. Arcos de astrolabio celeste girando lentamente en las esquinas superiores
  for (const [cx, cy, rad, dir] of [
    [ancho * 0.04, alto * 0.08, 128, 1],
    [ancho * 0.96, alto * 0.12, 110, -1],
  ] as const) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(t * 0.035 * dir);
    ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.16 : 0.15})`;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // Marcas de grado cada 15°
    for (let deg = 0; deg < 24; deg += 1) {
      const a = (deg / 24) * Math.PI * 2;
      const inner = deg % 3 === 0 ? rad - 7 : rad - 3.5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
      ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 3. Campo de estrellas centelleantes con picos de difracción en las principales
  for (const st of state.bgStars) {
    const tw = 0.35 + 0.65 * Math.sin(t * 1.7 + st.fase);
    const col = st.sec ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    dibujarEstrellaConDestello(
      ctx,
      st.x * ancho,
      st.y * alto,
      st.r,
      col,
      tw * (esClaro ? 0.46 : 0.6),
      st.flare,
    );
  }

  // 4. Cuatro constelaciones griegas doradas (Casiopea, Orión, Osa Menor y Cisne)
  const constellations: [number, number][][] = [
    [[0.06, 0.17], [0.11, 0.24], [0.16, 0.19], [0.22, 0.26], [0.27, 0.18]], // Casiopea
    [[0.77, 0.13], [0.83, 0.17], [0.89, 0.12], [0.84, 0.26], [0.88, 0.33], [0.94, 0.27]], // Orión
    [[0.06, 0.63], [0.12, 0.66], [0.18, 0.62], [0.24, 0.69], [0.29, 0.65]], // Osa Menor
    [[0.44, 0.11], [0.5, 0.16], [0.56, 0.12], [0.5, 0.22]], // Cisne
  ];
  for (const pts of constellations) {
    ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.24 : 0.26})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    pts.forEach(([nx, ny], idx) => {
      if (idx === 0) ctx.moveTo(nx * ancho, ny * alto);
      else ctx.lineTo(nx * ancho, ny * alto);
    });
    ctx.stroke();

    for (const [nx, ny] of pts) {
      const x = nx * ancho;
      const y = ny * alto;
      const sg = ctx.createRadialGradient(x, y, 0.5, x, y, 10);
      sg.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.58 : 0.72})`);
      sg.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, 0)`);
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 5. Colina rocosa de la Acrópolis + cipreses mediterráneos + Partenón dórico detallado
  const hillBase = alto;
  const templeX = ancho * 0.84;
  const templeY = alto - 34;

  // Silueta de la colina
  ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.15 : 0.16})`;
  ctx.beginPath();
  ctx.moveTo(ancho * 0.54, hillBase);
  ctx.quadraticCurveTo(ancho * 0.68, templeY + 4, ancho * 0.75, templeY);
  ctx.lineTo(ancho * 0.94, templeY);
  ctx.quadraticCurveTo(ancho * 0.99, templeY + 8, ancho, hillBase);
  ctx.closePath();
  ctx.fill();

  // Cipreses mediterráneos estilizados flanqueando la ladera
  for (const [cxOff, ch] of [
    [-112, 34],
    [-98, 44],
    [94, 38],
    [108, 28],
  ] as const) {
    const cx = templeX + cxOff;
    const cy = templeY + 6;
    ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.26 : 0.25})`;
    ctx.beginPath();
    ctx.moveTo(cx, cy - ch);
    ctx.quadraticCurveTo(cx + 6.5, cy - ch * 0.35, cx + 4, cy);
    ctx.lineTo(cx - 4, cy);
    ctx.quadraticCurveTo(cx - 6.5, cy - ch * 0.35, cx, cy - ch);
    ctx.closePath();
    ctx.fill();
  }

  // Resplandor cálido interior de los braseros sagrados del templo
  const torchPulse = 0.84 + 0.16 * Math.sin(t * 4.5);
  const tGlow = ctx.createRadialGradient(templeX, templeY - 26, 4, templeX, templeY - 26, 118 * torchPulse);
  tGlow.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.28 : 0.36})`);
  tGlow.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, 0)`);
  ctx.fillStyle = tGlow;
  ctx.beginPath();
  ctx.arc(templeX, templeY - 26, 118 * torchPulse, 0, Math.PI * 2);
  ctx.fill();

  const tw = 152;
  const colH = 48;
  ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.36 : 0.36})`;
  ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.66 : 0.7})`;
  ctx.lineWidth = 1.3;

  // Crepidoma escalonado de 3 peldaños
  ctx.fillRect(templeX - tw * 0.54, templeY - 4, tw * 1.08, 4);
  ctx.fillRect(templeX - tw * 0.51, templeY - 8, tw * 1.02, 4);
  ctx.fillRect(templeX - tw * 0.48, templeY - 11, tw * 0.96, 3);

  // 8 columnas dóricas con capiteles y acanalado
  for (let i = 0; i < 8; i += 1) {
    const cx = templeX - tw * 0.44 + (i / 7) * (tw * 0.88);
    ctx.fillRect(cx - 3.6, templeY - 11 - colH, 7.2, colH);
    ctx.fillRect(cx - 5.2, templeY - 11 - colH - 2.5, 10.4, 3); // capitel
  }

  // Arquitrabe + friso con triglifos
  const roofY = templeY - 11 - colH - 2.5;
  ctx.fillRect(templeX - tw * 0.5, roofY - 10, tw, 10);
  ctx.strokeStyle = `rgba(${bgR}, ${bgG}, ${bgB}, 0.35)`;
  ctx.lineWidth = 1;
  for (let tr = 0; tr < 14; tr += 1) {
    const trx = templeX - tw * 0.46 + (tr / 13) * (tw * 0.92);
    ctx.beginPath();
    ctx.moveTo(trx, roofY - 8);
    ctx.lineTo(trx, roofY - 2);
    ctx.stroke();
  }

  // Frontón triangular clásico con tímpano interior
  ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.72 : 0.76})`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(templeX - tw * 0.55, roofY - 10);
  ctx.lineTo(templeX, roofY - 34);
  ctx.lineTo(templeX + tw * 0.55, roofY - 10);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Dos llamas sagradas titilando en los extremos del templo
  for (const side of [-1, 1]) {
    const bx = templeX + side * (tw * 0.58);
    const by = templeY - 12;
    ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, 0.9)`;
    ctx.beginPath();
    ctx.ellipse(bx, by - 4 * torchPulse, 2.4, 4.5 * torchPulse, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Animación exclusiva de toque: Estrella fugaz arqueada + anillo astrolabio + mini-constelación
  for (const tap of taps) {
    const p = (t - tap.born) / 2.5;
    if (p < 0 || p > 1) continue;
    const fade = 1 - p;

    const sx = tap.x - 190 + p * 380;
    const sy = tap.y - 75 + p * 125 - Math.sin(p * Math.PI) * 32;
    const tx0 = sx - 96;
    const ty0 = sy - 34;

    const sg = ctx.createLinearGradient(tx0, ty0, sx, sy);
    sg.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, 0)`);
    sg.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.96).toFixed(3)})`);
    ctx.strokeStyle = sg;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(tx0, ty0);
    ctx.lineTo(sx, sy);
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 255, 255, ${(fade * 0.96).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Anillo astrolabio con marcas + 5 estrellitas nacientes en el punto clicado
    const rad = 10 + p * 54;
    ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${(fade * 0.62).toFixed(3)})`;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.arc(tap.x, tap.y, rad, 0, Math.PI * 2);
    ctx.stroke();

    for (let k = 0; k < 5; k += 1) {
      const a = (k / 5) * Math.PI * 2 + tap.seed + p * 0.5;
      const kx = tap.x + Math.cos(a) * rad * 0.72;
      const ky = tap.y + Math.sin(a) * rad * 0.72;
      ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.85).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(kx, ky, 2.0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
