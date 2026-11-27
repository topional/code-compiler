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

  // 5. Agujero Negro Gargantua (arriba a la derecha) con Doppler beaming relativista + arcos de lente
  const bhX = ancho * (0.89 + (mouse.x - 0.5) * 0.03);
  const bhY = alto * (0.2 + (mouse.y - 0.5) * 0.03);
  const bhR = Math.min(ancho, alto) * 0.068;

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
// 4. VECTOR 3D — Sol Synthwave alto a la derecha + montañas 3D de alto relieve + malla cruzada + sonar
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

  const horizonY = alto * 0.55;

  // 1. Cielo estrellado discreto sobre el horizonte
  for (let i = 0; i < 64; i += 1) {
    const st = state.bgStars[i];
    const sy = st.y * horizonY * 1.08;
    if (sy > horizonY - 12) continue;
    const tw = 0.3 + 0.7 * Math.sin(t * 1.7 + st.fase);
    ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${(tw * (esClaro ? 0.34 : 0.42)).toFixed(3)})`;
    ctx.fillRect(st.x * ancho, sy, 1.5, 1.5);
  }

  // 2. Balizas geométricas low-poly (octaedros 3D girando en los márgenes superiores)
  dibujarOctaedro3D(
    ctx,
    ancho * 0.07,
    alto * 0.21 + Math.sin(t * 0.9) * 8,
    21,
    t * 0.45,
    t * 0.75,
    `${sR}, ${sG}, ${sB}`,
    esClaro ? 0.36 : 0.42,
  );
  dibujarOctaedro3D(
    ctx,
    ancho * 0.48,
    alto * 0.14 + Math.cos(t * 0.85) * 7,
    17,
    -t * 0.5,
    t * 0.65,
    `${pR}, ${pG}, ${pB}`,
    esClaro ? 0.34 : 0.4,
  );

  // 3. Sol Retro Synthwave completo, alto y a la derecha con cortes horizontales clásicos
  const sunX = ancho * (0.9 + (mouse.x - 0.5) * 0.04);
  const sunR = Math.min(ancho, alto) * 0.115;
  const sunY = alto * 0.19;

  const sunHalo = ctx.createRadialGradient(sunX, sunY, sunR * 0.35, sunX, sunY, sunR * 2.9);
  sunHalo.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.26 : 0.3})`);
  sunHalo.addColorStop(0.55, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.1 : 0.13})`);
  sunHalo.addColorStop(1, `rgba(${bgR}, ${bgG}, ${bgB}, 0)`);
  ctx.fillStyle = sunHalo;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR * 2.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.clip();
  const sunGrad = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY + sunR);
  sunGrad.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.76 : 0.88})`);
  sunGrad.addColorStop(0.65, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.48 : 0.58})`);
  sunGrad.addColorStop(1, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.34 : 0.44})`);
  ctx.fillStyle = sunGrad;
  ctx.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);
  // Cortes horizontales estilo osciloscopio retro en la mitad inferior del sol
  ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
  for (let i = 0; i < 6; i += 1) {
    const sy = sunY + sunR * (0.04 + i * 0.16);
    ctx.fillRect(sunX - sunR, sy, sunR * 2, 2 + i * 1.15);
  }
  ctx.restore();

  // Resplandor atmosférico sobre el horizonte
  const horG = ctx.createLinearGradient(0, horizonY - 72, 0, horizonY + 14);
  horG.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, 0)`);
  horG.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.16 : 0.19})`);
  ctx.fillStyle = horG;
  ctx.fillRect(0, horizonY - 72, ancho, 86);

  // 4. Malla 3D de montañas de ALTO RELIEVE en perspectiva real (combina proyección fov/wz + líneas cruzadas)
  const rows = 18;
  const cols = 34;
  const fov = Math.min(ancho, alto) * 0.74;
  const speedZ = t * 1.25;
  const zOffset = speedZ % 1;
  const rowIndexShift = Math.floor(speedZ);
  const scanRow = rows - ((t * 5.5) % rows);

  const project = (wx: number, wy: number, wz: number) => {
    const scale = fov / Math.max(0.65, wz);
    return {
      x: ancho * 0.5 + (wx - (mouse.x - 0.5) * 3.4) * scale,
      y: horizonY + (wy + 2.35) * scale,
    };
  };

  // Precalcular todas las filas de atrás hacia adelante para dibujar líneas longitudinales + transversales
  const meshRows: { x: number; y: number; boost: number; ridge: number }[][] = [];
  for (let r = rows; r >= 1; r -= 1) {
    const wz = r - zOffset + 1.15;
    const worldRow = r + rowIndexShift;
    const pts: { x: number; y: number; boost: number; ridge: number }[] = [];

    for (let c = 0; c <= cols; c += 1) {
      const u = c / cols - 0.5;
      const wx = u * 27;
      // Valle legible en el centro + cordilleras montañosas muy pronunciadas en ambos costados
      const valley = Math.min(1, Math.pow(Math.abs(u) * 2.25, 1.25));
      const rawWave =
        Math.sin(wx * 0.4 + worldRow * 0.36) * 1.35 +
        Math.cos(wx * 0.82 - worldRow * 0.24) * 0.82 +
        Math.sin((wx + worldRow) * 0.26) * 0.95;
      const ridge = Math.max(-0.35, rawWave) * (0.48 + valley * 1.48);

      const baseP = project(wx, -ridge, wz);

      // Sonar sísmico 3D exclusivo al tocar: levanta físicamente los picos montañosos
      let boost = 0;
      for (const tap of taps) {
        const p = (t - tap.born) / 2.2;
        if (p < 0 || p > 1) continue;
        const d = Math.hypot(baseP.x - tap.x, baseP.y - tap.y);
        const wave = 14 + p * 430;
        const band = Math.abs(d - wave);
        if (band < 68) {
          boost = Math.max(boost, (1 - band / 68) * (1 - p));
        }
      }

      const lifted = boost > 0.02 ? project(wx, -(ridge + boost * 1.85), wz) : baseP;
      pts.push({ x: lifted.x, y: lifted.y, boost, ridge });
    }
    meshRows.push(pts);
  }

  for (let i = 0; i < meshRows.length; i += 1) {
    const pts = meshRows[i];
    const r = rows - i; // r=rows (fondo) -> r=1 (frente)
    const depth = 1 - r / (rows + 1);
    const isScan = Math.abs(r - scanRow) < 1.1;

    // Polígono de oclusión con el fondo del tema (algoritmo del pintor)
    ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, alto + 12);
    for (let c = 0; c < pts.length; c += 1) ctx.lineTo(pts[c].x, pts[c].y);
    ctx.lineTo(pts[pts.length - 1].x, alto + 12);
    ctx.closePath();
    ctx.fill();

    // Líneas longitudinales 3D conectando hacia la fila trasera
    if (i > 0) {
      const back = meshRows[i - 1];
      ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${(0.14 + depth * 0.3).toFixed(3)})`;
      ctx.lineWidth = 0.8 + depth * 0.45;
      ctx.beginPath();
      for (let c = 0; c < pts.length; c += 2) {
        ctx.moveTo(back[c].x, back[c].y);
        ctx.lineTo(pts[c].x, pts[c].y);
      }
      ctx.stroke();
    }

    // Cresta montañosa transversal con brillo de escáner
    const col = isScan ? `${pR}, ${pG}, ${pB}` : r % 3 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    const alpha = isScan ? 0.85 : (esClaro ? 0.24 : 0.26) + depth * 0.48;
    ctx.strokeStyle = `rgba(${col}, ${alpha.toFixed(3)})`;
    ctx.lineWidth = isScan ? 2.2 : 1.0 + depth * 0.75;
    ctx.beginPath();
    for (let c = 0; c < pts.length; c += 1) {
      if (c === 0) ctx.moveTo(pts[c].x, pts[c].y);
      else ctx.lineTo(pts[c].x, pts[c].y);
    }
    ctx.stroke();

    // Nodos brillantes en cimas pronunciadas o en la onda del sonar sísmico
    for (let c = 1; c < pts.length - 1; c += 2) {
      if (pts[c].boost > 0.16) {
        ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${Math.min(0.96, pts[c].boost * 1.15).toFixed(3)})`;
        ctx.save();
        ctx.translate(pts[c].x, pts[c].y);
        ctx.rotate(Math.PI * 0.25);
        ctx.fillRect(-3.2, -3.2, 6.4, 6.4);
        ctx.restore();
      } else if (i % 2 === 0 && pts[c].ridge > 1.85) {
        ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${(0.35 + depth * 0.42).toFixed(3)})`;
        ctx.fillRect(pts[c].x - 1.5, pts[c].y - 1.5, 3, 3);
      }
    }
  }

  // Onda elíptica visual del pulso sísmico
  for (const tap of taps) {
    const p = (t - tap.born) / 2.2;
    if (p < 0 || p > 1) continue;
    const fade = 1 - p;
    const wave = 14 + p * 430;
    ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.68).toFixed(3)})`;
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.ellipse(tap.x, tap.y, wave, wave * 0.36, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ============================================================================
// 5. LLUVIA NEÓN — Rascacielos arquitectónicos escalonados + monorriel + lluvia + gotas en cristal
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

  // Colores arquitectónicos sólidos bien integrados con el tema (siluetas reales de edificios)
  const farFill = esClaro
    ? `rgb(${Math.max(0, bgR - 22)}, ${Math.max(0, bgG - 20)}, ${Math.max(0, bgB - 14)})`
    : `rgb(${Math.max(0, bgR - 5)}, ${Math.max(0, bgG - 5)}, ${Math.max(0, bgB - 3)})`;
  const midFill = esClaro
    ? `rgb(${Math.max(0, bgR - 38)}, ${Math.max(0, bgG - 34)}, ${Math.max(0, bgB - 24)})`
    : `rgb(${Math.max(0, bgR - 9)}, ${Math.max(0, bgG - 9)}, ${Math.max(0, bgB - 6)})`;
  const frontFill = esClaro
    ? `rgb(${Math.max(0, bgR - 56)}, ${Math.max(0, bgG - 52)}, ${Math.max(0, bgB - 38)})`
    : `rgb(${Math.max(0, Math.round(bgR * 0.45))}, ${Math.max(0, Math.round(bgG * 0.45))}, ${Math.max(0, Math.round(bgB * 0.55))})`;

  // 1. Destello lejano muy sutil en las nubes altas
  const boltPhase = t % 11.4;
  if (boltPhase < 0.14 || (boltPhase > 0.22 && boltPhase < 0.3)) {
    const fg = ctx.createRadialGradient(ancho * 0.22, alto * 0.06, 10, ancho * 0.22, alto * 0.06, ancho * 0.45);
    fg.addColorStop(0, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.1 : 0.13})`);
    fg.addColorStop(1, `rgba(${bgR}, ${bgG}, ${bgB}, 0)`);
    ctx.fillStyle = fg;
    ctx.fillRect(0, 0, ancho, alto * 0.45);
  }

  // 2. Resplandor neón urbano elevándose desde detrás del skyline (siluetea los rascacielos)
  const haze = ctx.createLinearGradient(0, alto * 0.56, 0, alto);
  haze.addColorStop(0, `rgba(${bgR}, ${bgG}, ${bgB}, 0)`);
  haze.addColorStop(0.55, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.12 : 0.15})`);
  haze.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.16 : 0.2})`);
  ctx.fillStyle = haze;
  ctx.fillRect(0, alto * 0.56, ancho, alto * 0.44);

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

    const u = (t * (0.2 + c * 0.08) + c * 0.33) % 1;
    const inv = 1 - u;
    const px = u * ancho;
    const py = inv * inv * yL + 2 * inv * u * ((yL + yR) * 0.5 + sag) + u * u * yR;
    const col = c % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    ctx.fillStyle = `rgba(${col}, 0.9)`;
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Horizonte lejano: torres escalonadas suaves detrás de la niebla
  for (let i = 0; i < state.cityFar.length; i += 1) {
    const b = state.cityFar[i];
    const bx = Math.round(b.xNorm * ancho);
    const bw = Math.round(b.wNorm * ancho) + 2;
    const bh = Math.round(b.hNorm * alto);
    const by = alto - bh;
    ctx.fillStyle = farFill;
    ctx.fillRect(bx, by, bw, bh);
    // Remate escalonado superior en torres pares
    if (i % 2 === 0) {
      const capW = Math.round(bw * 0.56);
      ctx.fillRect(bx + Math.round((bw - capW) * 0.5), by - 14, capW, 14);
    }
    ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.14 : 0.13})`;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh);
  }

  // 5. Plano intermedio: rascacielos arquitectónicos reales (Art Déco escalonados, techos inclinados y agujas)
  for (let i = 0; i < state.cityBack.length; i += 1) {
    const b = state.cityBack[i];
    const bx = Math.round(b.xNorm * ancho);
    const bw = Math.round(b.wNorm * ancho) + 2;
    const bh = Math.round(b.hNorm * alto);
    const by = alto - bh;
    const style = i % 3; // 0 = escalonado Art-Deco, 1 = techo diagonal futurista, 2 = torre con corona iluminada

    ctx.fillStyle = midFill;
    if (style === 1) {
      // Techo inclinado biselado moderno
      const slant = 22;
      ctx.beginPath();
      ctx.moveTo(bx, alto);
      ctx.lineTo(bx, by + slant);
      ctx.lineTo(bx + bw, by);
      ctx.lineTo(bx + bw, alto);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.34 : 0.36})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(bx, by + slant);
      ctx.lineTo(bx + bw, by);
      ctx.stroke();
    } else {
      ctx.fillRect(bx, by, bw, bh);
      // Retranqueo arquitectónico (setback) + penthouse
      const tier1W = Math.round(bw * 0.68);
      const tier1X = bx + Math.round((bw - tier1W) * 0.5);
      ctx.fillRect(tier1X, by - 16, tier1W, 16);
      if (style === 0) {
        const tier2W = Math.round(bw * 0.36);
        const tier2X = bx + Math.round((bw - tier2W) * 0.5);
        ctx.fillRect(tier2X, by - 28, tier2W, 12);
      }
      // Cornisa luminosa de azotea
      ctx.fillStyle = `rgba(${style === 2 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`}, ${esClaro ? 0.45 : 0.48})`;
      ctx.fillRect(bx, by, bw, 2);
      ctx.fillRect(tier1X, by - 16, tier1W, 1.5);
    }

    // Luz de borde lateral (rim light) que da volumen real a cada edificio
    ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.24 : 0.22})`;
    ctx.fillRect(bx, by + (style === 1 ? 22 : 0), 1.5, bh);

    // Aguja de telecomunicaciones con baliza parpadeante o tanque de azotea
    if (b.hasSpire) {
      const sx = bx + Math.round(bw * 0.5);
      const spireBase = style === 0 ? by - 28 : style === 1 ? by + 4 : by - 16;
      ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, 0.52)`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(sx, spireBase);
      ctx.lineTo(sx, spireBase - 34);
      ctx.stroke();
      const blink = 0.25 + 0.75 * Math.sin(t * 3.8 + b.seed);
      ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${blink.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(sx, spireBase - 36, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (b.hasTank && style !== 1) {
      ctx.fillStyle = frontFill;
      ctx.fillRect(bx + Math.round(bw * 0.24), by - 26, Math.round(bw * 0.3), 10);
      ctx.fillRect(bx + Math.round(bw * 0.3), by - 16, 2, 5);
      ctx.fillRect(bx + Math.round(bw * 0.46), by - 16, 2, 5);
    }

    // Pisos de oficinas estructurados en hileras limpias (con pilares oscuros entre ventanas)
    const winStart = by + (style === 1 ? 28 : 10);
    for (let wy = winStart; wy < alto - 18; wy += 11) {
      const floorLit = ((Math.floor(wy) * 7 + b.seed) % 11) === 0;
      for (let wx = bx + 6; wx < bx + bw - 9; wx += 9) {
        const hash = (Math.floor(wx) * 19 + Math.floor(wy) * 13 + b.seed) % 17;
        if (floorLit || hash < 5) {
          const isWarm = hash === 0 || (floorLit && hash % 3 === 0);
          const col = isWarm ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
          ctx.fillStyle = `rgba(${col}, ${floorLit ? (esClaro ? 0.52 : 0.58) : (esClaro ? 0.28 : 0.34)})`;
          ctx.fillRect(wx, wy, 5, 4.5);
        }
      }
    }
  }

  // 6. Monorriel elevado deslizándose suavemente por el viaducto urbano con pilares
  const railY = alto - 52;
  ctx.fillStyle = frontFill;
  ctx.fillRect(0, railY, ancho, 5);
  for (let px = 40; px < ancho; px += 120) {
    ctx.fillRect(px, railY + 5, 8, 52);
  }
  ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, 0.32)`;
  ctx.fillRect(0, railY, ancho, 1.2);

  const trainX = (((t * 0.14) % 1.35) - 0.18) * ancho;
  const trainLen = 148;
  const trailG = ctx.createLinearGradient(trainX - 90, railY, trainX, railY);
  trailG.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, 0)`);
  trailG.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, 0.45)`);
  ctx.fillStyle = trailG;
  ctx.fillRect(trainX - 90, railY - 6, 90, 5);
  ctx.fillStyle = frontFill;
  ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, 0.55)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(trainX, railY - 12, trainLen, 11, [4, 7, 1, 1]);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, 0.94)`;
  for (let w = 0; w < 8; w += 1) {
    ctx.fillRect(trainX + 10 + w * 16, railY - 9, 10, 4);
  }
  ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
  ctx.fillRect(trainX + trainLen - 5, railY - 6.5, 5, 2.5);

  // 7. Primer plano de edificios bajos con fachadas nítidas y letreros neón verticales
  for (let i = 0; i < state.cityFront.length; i += 1) {
    const b = state.cityFront[i];
    const bx = Math.round(b.xNorm * ancho);
    const bw = Math.round(b.wNorm * ancho) + 1;
    const bh = Math.round(b.hNorm * alto);
    const by = alto - bh;

    ctx.fillStyle = frontFill;
    ctx.fillRect(bx, by, bw, bh);
    // Cornisa superior definida
    ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.34 : 0.32})`;
    ctx.fillRect(bx, by, bw, 1.8);
    // Ventanas estructuradas del bloque frontal
    for (let wy = by + 9; wy < alto - 10; wy += 10) {
      for (let wx = bx + 6; wx < bx + bw - 8; wx += 10) {
        const h = (Math.floor(wx) * 11 + Math.floor(wy) * 17 + b.seed) % 13;
        if (h < 3) {
          const col = h === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
          ctx.fillStyle = `rgba(${col}, ${esClaro ? 0.36 : 0.44})`;
          ctx.fillRect(wx, wy, 5.5, 4);
        }
      }
    }

    // Chispitas de lluvia golpeando las azoteas
    if (!estatico && (Math.floor(t * 14) + b.seed) % 9 === 0) {
      const sx = bx + ((b.seed * 7) % Math.max(8, bw));
      ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, 0.58)`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx - 3, by - 3);
      ctx.lineTo(sx, by);
      ctx.lineTo(sx + 3, by - 3);
      ctx.stroke();
    }

    // Letrero neón holográfico vertical fijado a la fachada
    if (b.hasSign) {
      const sx = bx + Math.round(bw * 0.16);
      const sy = by + 10;
      const flicker = Math.sin(t * 8 + b.seed) > -0.78 ? 1 : 0.32;
      const col = b.seed % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
      ctx.strokeStyle = `rgba(${col}, ${(0.82 * flicker).toFixed(3)})`;
      ctx.fillStyle = `rgba(${col}, ${(0.18 * flicker).toFixed(3)})`;
      ctx.lineWidth = 1.4;
      ctx.fillRect(sx, sy, 10, 32);
      ctx.strokeRect(sx, sy, 10, 32);
      ctx.fillStyle = `rgba(${col}, ${(0.9 * flicker).toFixed(3)})`;
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
