import type { Point2D, WorldPalette, WorldTap } from './types';

export interface SkylineWorldState {
  galaxyStars: { r: number; arm: number; offset: number; size: number; sec: boolean; speed: number }[];
  bgStars: { x: number; y: number; r: number; fase: number; sec: boolean }[];
  rainDrops: { x: number; y: number; len: number; speed: number; alpha: number }[];
  cityBack: { xNorm: number; wNorm: number; hNorm: number; seed: number; hasSpire: boolean }[];
  cityFront: { xNorm: number; wNorm: number; hNorm: number; seed: number; hasSign: boolean }[];
  glassBeads: { x: number; y: number; r: number; vy: number; born: number; trail: Point2D[] }[];
  birds: { xNorm: number; yNorm: number; vel: number; fase: number; size: number }[];
}

export function crearEstadoHorizonte(): SkylineWorldState {
  return {
    galaxyStars: Array.from({ length: 185 }, (_, i) => ({
      r: 12 + Math.pow((i * 17.3) % 100, 1.18) * 1.18,
      arm: i % 2,
      offset: ((i * 29.7) % 100) / 100 - 0.5,
      size: 0.9 + (i % 3) * 0.72,
      sec: i % 3 === 0,
      speed: 0.25 / (1 + ((i * 17.3) % 100) * 0.018),
    })),
    bgStars: Array.from({ length: 120 }, (_, i) => ({
      x: ((i * 73.1 + 11) % 100) / 100,
      y: ((i * 41.7 + 7) % 72) / 100,
      r: 0.75 + (i % 3) * 0.55,
      fase: i * 0.63,
      sec: i % 4 === 0,
    })),
    rainDrops: Array.from({ length: 105 }, (_, i) => ({
      x: ((i * 67.3) % 100) / 100,
      y: ((i * 43.1) % 100) / 100,
      len: 15 + (i % 5) * 7,
      speed: 0.38 + (i % 6) * 0.075,
      alpha: 0.13 + (i % 4) * 0.055,
    })),
    cityBack: Array.from({ length: 22 }, (_, i) => ({
      xNorm: i / 22,
      wNorm: 1 / 22 + 0.012,
      hNorm: 0.1 + (((i * 29 + 7) % 15) / 15) * 0.22,
      seed: i * 31 + 5,
      hasSpire: i % 4 === 1,
    })),
    cityFront: Array.from({ length: 18 }, (_, i) => ({
      xNorm: i / 18,
      wNorm: 1 / 18 + 0.008,
      hNorm: 0.06 + (((i * 37 + 13) % 13) / 13) * 0.14,
      seed: i * 19 + 11,
      hasSign: i % 5 === 2,
    })),
    glassBeads: [],
    birds: Array.from({ length: 7 }, (_, i) => ({
      xNorm: ((i * 17 + 8) % 100) / 100,
      yNorm: 0.18 + (i % 4) * 0.08,
      vel: 0.018 + (i % 3) * 0.008,
      fase: i * 1.1,
      size: 6 + (i % 3) * 2.5,
    })),
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
      r: 5.8,
      vy: 14,
      born: tiempo,
      trail: [{ x, y }],
    });
    for (let i = 0; i < 4; i += 1) {
      const ang = (i / 4) * Math.PI * 2 + x * 0.05;
      state.glassBeads.push({
        x: x + Math.cos(ang) * (10 + i * 4),
        y: y + Math.sin(ang) * (8 + i * 4),
        r: 2.3 + (i % 2) * 0.9,
        vy: 8 + i * 3.5,
        born: tiempo,
        trail: [],
      });
    }
    if (state.glassBeads.length > 28) {
      state.glassBeads.splice(0, state.glassBeads.length - 28);
    }
  }
}

// ============================================================================
// 5. COSMOS GARGANTUA — Agujero Negro con Doppler + Galaxia Espiral + Meteoros
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

  // Polvo nebular dual
  const neb1 = ctx.createRadialGradient(ancho * 0.84, alto * 0.24, 0, ancho * 0.84, alto * 0.24, Math.max(ancho, alto) * 0.44);
  neb1.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.14 : 0.18})`);
  neb1.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, 0)`);
  ctx.fillStyle = neb1;
  ctx.fillRect(0, 0, ancho, alto);

  const neb2 = ctx.createRadialGradient(ancho * 0.15, alto * 0.78, 0, ancho * 0.15, alto * 0.78, Math.max(ancho, alto) * 0.42);
  neb2.addColorStop(0, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.14 : 0.16})`);
  neb2.addColorStop(1, `rgba(${sR}, ${sG}, ${sB}, 0)`);
  ctx.fillStyle = neb2;
  ctx.fillRect(0, 0, ancho, alto);

  // Estrellas de campo profundo titilando
  for (const st of state.bgStars) {
    const tw = 0.3 + 0.7 * Math.sin(t * 1.9 + st.fase);
    const col = st.sec ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;
    ctx.fillStyle = `rgba(${col}, ${(tw * (esClaro ? 0.34 : 0.48)).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(st.x * ancho, st.y * alto, st.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Galaxia espiral inclinada con núcleo brillante (abajo izquierda)
  const gx = ancho * (0.16 - (mouse.x - 0.5) * 0.03);
  const gy = alto * (0.78 - (mouse.y - 0.5) * 0.03);
  ctx.save();
  ctx.translate(gx, gy);
  ctx.rotate(-0.32);
  ctx.scale(1, 0.5);
  const coreG = ctx.createRadialGradient(0, 0, 0, 0, 0, 62);
  coreG.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.45 : 0.55})`);
  coreG.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, 0)`);
  ctx.fillStyle = coreG;
  ctx.beginPath();
  ctx.arc(0, 0, 62, 0, Math.PI * 2);
  ctx.fill();

  for (const st of state.galaxyStars) {
    const theta = st.arm * Math.PI + st.r * 0.042 + t * st.speed + st.offset * 0.9;
    const sx = Math.cos(theta) * st.r;
    const sy = Math.sin(theta) * st.r;
    const col = st.sec ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;
    const a = Math.max(0.14, (1 - st.r / 250) * (esClaro ? 0.74 : 0.86));
    ctx.fillStyle = `rgba(${col}, ${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(sx, sy, st.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Agujero Negro Gargantua (abajo derecha, despejado) con disco asimétrico Doppler + arcos de lente
  const bhX = ancho * (0.87 + (mouse.x - 0.5) * 0.03);
  const bhY = alto * (0.8 + (mouse.y - 0.5) * 0.03);
  const bhR = Math.min(ancho, alto) * 0.062;

  ctx.save();
  ctx.translate(bhX, bhY);
  ctx.rotate(-0.24);

  // Arcos superior e inferior de lente gravitacional
  for (let band = 0; band < 6; band += 1) {
    const rBand = bhR * (1.22 + band * 0.13);
    const col = band % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    ctx.strokeStyle = `rgba(${col}, ${(0.48 - band * 0.068).toFixed(3)})`;
    ctx.lineWidth = 2.6 - band * 0.3;
    ctx.beginPath();
    ctx.arc(0, 0, rBand, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = `rgba(${col}, ${(0.28 - band * 0.04).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(0, 0, rBand * 0.94, 0, Math.PI);
    ctx.stroke();
  }

  // Disco de acreción trasero
  for (let band = 0; band < 8; band += 1) {
    const rx = bhR * (1.55 + band * 0.34);
    const ry = rx * 0.24;
    const col = band % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    ctx.strokeStyle = `rgba(${col}, ${(0.52 - band * 0.052).toFixed(3)})`;
    ctx.lineWidth = 2.4 - band * 0.2;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
  }

  // Horizonte de sucesos + anillo de fotones
  ctx.fillStyle = esClaro ? '#0b0e17' : '#020308';
  ctx.beginPath();
  ctx.arc(0, 0, bhR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, 0.94)`;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 0, bhR * 1.04, 0, Math.PI * 2);
  ctx.stroke();

  // Disco de acreción delantero + plasma brillante orbitando
  for (let band = 0; band < 8; band += 1) {
    const rx = bhR * (1.55 + band * 0.34);
    const ry = rx * 0.24;
    const col = band % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    ctx.strokeStyle = `rgba(${col}, ${(0.72 - band * 0.072).toFixed(3)})`;
    ctx.lineWidth = 2.9 - band * 0.24;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI);
    ctx.stroke();

    const pAng = (t * (1.4 - band * 0.1) + band * 1.2) % (Math.PI * 2);
    if (Math.sin(pAng) > -0.1) {
      ctx.fillStyle = `rgba(${col}, 0.9)`;
      ctx.beginPath();
      ctx.arc(Math.cos(pAng) * rx, Math.sin(pAng) * ry, 2.0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // Animación exclusiva de toque: Lente gravitacional + 8 meteoros curvados al agujero negro
  for (const tap of taps) {
    const p = (t - tap.born) / 2.4;
    if (p < 0 || p > 1) continue;
    const fade = 1 - p;

    const rLens = 14 + p * 195;
    ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${(fade * 0.72).toFixed(3)})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(tap.x, tap.y, rLens, 0, Math.PI * 2);
    ctx.stroke();

    for (let k = 0; k < 8; k += 1) {
      const ang = (k / 8) * Math.PI * 2 + tap.seed;
      const col = k % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
      const reach = p * (195 + (k % 3) * 48);
      const pull = p * p * 0.34;
      const hx = tap.x + Math.cos(ang) * reach + (bhX - tap.x) * pull;
      const hy = tap.y + Math.sin(ang) * reach + (bhY - tap.y) * pull;

      const tailP = Math.max(0, p - 0.15);
      const tReach = tailP * (195 + (k % 3) * 48);
      const tPull = tailP * tailP * 0.34;
      const tx = tap.x + Math.cos(ang) * tReach + (bhX - tap.x) * tPull;
      const ty = tap.y + Math.sin(ang) * tReach + (bhY - tap.y) * tPull;

      ctx.strokeStyle = `rgba(${col}, ${(fade * 0.94).toFixed(3)})`;
      ctx.lineWidth = 2.3 * fade + 0.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(hx, hy);
      ctx.stroke();

      ctx.fillStyle = `rgba(${col}, ${(fade * 0.96).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(hx, hy, 2.5 * fade + 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ============================================================================
// 6. VECTOR 3D — Malla reticulada completa (latitud + longitud) + sol retro + sonar
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

  // Estrellas discretas en el cielo superior
  for (let i = 0; i < 48; i += 1) {
    const st = state.bgStars[i];
    const tw = 0.35 + 0.65 * Math.sin(t * 1.6 + st.fase);
    ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${(tw * 0.32).toFixed(3)})`;
    ctx.fillRect(st.x * ancho, st.y * alto * 0.72, 1.8, 1.8);
  }

  // Sol retro con halo atmosférico y cortes horizontales sobre el horizonte
  const horizonY = alto * 0.54;
  const sunX = ancho * (0.79 + (mouse.x - 0.5) * 0.04);
  const sunY = horizonY - Math.min(ancho, alto) * 0.14;
  const sunR = Math.min(ancho, alto) * 0.115;

  const halo = ctx.createRadialGradient(sunX, sunY, sunR * 0.5, sunX, sunY, sunR * 2.8);
  halo.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.18 : 0.22})`);
  halo.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, 0)`);
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR * 2.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.clip();
  const sunGrad = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY + sunR);
  sunGrad.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.38 : 0.48})`);
  sunGrad.addColorStop(1, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.18 : 0.24})`);
  ctx.fillStyle = sunGrad;
  ctx.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);
  ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
  for (let i = 0; i < 6; i += 1) {
    const sy = sunY + sunR * (0.04 + i * 0.16);
    ctx.fillRect(sunX - sunR, sy, sunR * 2, 2 + i * 1.15);
  }
  ctx.restore();

  // Malla 3D en perspectiva con líneas horizontales Y longitudinales + oclusión
  const rows = 18;
  const cols = 30;
  const fov = Math.min(ancho, alto) * 0.72;
  const speedZ = t * 1.3;
  const zOffset = speedZ % 1;
  const rowIndexShift = Math.floor(speedZ);

  const project = (wx: number, wy: number, wz: number) => {
    const scale = fov / Math.max(0.6, wz);
    return {
      x: ancho * 0.5 + (wx - (mouse.x - 0.5) * 3.5) * scale,
      y: horizonY + (wy + 2.4) * scale,
    };
  };

  let prevRow: { x: number; y: number; boost: number }[] | null = null;

  for (let r = rows; r >= 1; r -= 1) {
    const wz = r - zOffset + 1.2;
    const worldRow = r + rowIndexShift;
    const pts: { x: number; y: number; boost: number }[] = [];

    for (let c = 0; c <= cols; c += 1) {
      const u = c / cols - 0.5;
      const wx = u * 26;
      const valley = Math.min(1, Math.abs(u) * 2.4);
      const ridge =
        (Math.sin(wx * 0.42 + worldRow * 0.38) * 1.3 +
          Math.cos(wx * 0.85 - worldRow * 0.24) * 0.75 +
          Math.sin((wx + worldRow) * 0.28) * 0.85) *
        (0.42 + valley * 1.2);

      const baseP = project(wx, -Math.max(-0.45, ridge), wz);

      let boost = 0;
      for (const tap of taps) {
        const p = (t - tap.born) / 2.2;
        if (p < 0 || p > 1) continue;
        const d = Math.hypot(baseP.x - tap.x, baseP.y - tap.y);
        const wave = 12 + p * 440;
        const band = Math.abs(d - wave);
        if (band < 70) {
          boost = Math.max(boost, (1 - band / 70) * (1 - p));
        }
      }

      const lifted = boost > 0.02 ? project(wx, -Math.max(-0.45, ridge + boost * 1.75), wz) : baseP;
      pts.push({ x: lifted.x, y: lifted.y, boost });
    }

    // Oclusión
    ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, alto + 12);
    for (let c = 0; c < pts.length; c += 1) ctx.lineTo(pts[c].x, pts[c].y);
    ctx.lineTo(pts[pts.length - 1].x, alto + 12);
    ctx.closePath();
    ctx.fill();

    const depthAlpha = Math.max(0.08, (1 - r / rows) * (esClaro ? 0.36 : 0.44));
    const isScanRow = Math.abs((t * 6) % rows - r) < 1.1;

    // Líneas longitudinales conectando con la fila trasera (retícula 3D real)
    if (prevRow) {
      for (let c = 0; c < pts.length; c += 2) {
        const a = prevRow[c];
        const b = pts[c];
        const bMax = Math.max(a.boost, b.boost);
        ctx.strokeStyle = `rgba(${bMax > 0.1 ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`}, ${(depthAlpha * 0.58 + bMax * 0.5).toFixed(3)})`;
        ctx.lineWidth = 0.85;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    // Líneas de cresta horizontales + vértices brillantes en el sonar
    for (let c = 0; c < pts.length - 1; c += 1) {
      const a = pts[c];
      const b = pts[c + 1];
      const bMax = Math.max(a.boost, b.boost);
      const col = bMax > 0.08 || isScanRow ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;
      const lineA = Math.min(0.96, depthAlpha + (isScanRow ? 0.38 : 0) + bMax * 0.72);
      ctx.strokeStyle = `rgba(${col}, ${lineA.toFixed(3)})`;
      ctx.lineWidth = bMax > 0.12 || isScanRow ? 2.1 : 1.1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();

      if (a.boost > 0.35 && c % 2 === 0) {
        ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${(a.boost * 0.95).toFixed(3)})`;
        ctx.fillRect(a.x - 2, a.y - 2, 4, 4);
      }
    }

    prevRow = pts;
  }
}

// ============================================================================
// 7. LLUVIA NEÓN (Neo-Tokyo + Wired Dusk — 2 capas skyline + antenas + neón + cristal)
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

  const skyGrad = ctx.createLinearGradient(0, 0, 0, alto);
  skyGrad.addColorStop(0, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.08 : 0.11})`);
  skyGrad.addColorStop(0.62, `rgba(${bgR}, ${bgG}, ${bgB}, 0)`);
  skyGrad.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.15 : 0.18})`);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, ancho, alto);

  // Cables de alta tensión catenarios en la parte superior con pulsos de datos
  for (let w = 0; w < 2; w += 1) {
    const yL = alto * (0.11 + w * 0.055);
    const yR = alto * (0.15 + w * 0.065);
    const sag = alto * (0.22 + w * 0.065);
    const col = w === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    ctx.strokeStyle = `rgba(${col}, ${esClaro ? 0.22 : 0.25})`;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(0, yL);
    ctx.quadraticCurveTo(ancho * 0.5, sag, ancho, yR);
    ctx.stroke();

    const u = (t * (0.25 + w * 0.12) + w * 0.45) % 1;
    const inv = 1 - u;
    const px = inv * inv * 0 + 2 * inv * u * (ancho * 0.5) + u * u * ancho;
    const py = inv * inv * yL + 2 * inv * u * sag + u * u * yR;
    ctx.fillStyle = `rgba(${col}, 0.92)`;
    ctx.beginPath();
    ctx.arc(px, py, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Capa trasera de rascacielos con antenas y balizas parpadeantes
  for (const b of state.cityBack) {
    const bx = b.xNorm * ancho;
    const bw = b.wNorm * ancho;
    const bh = b.hNorm * alto;
    const by = alto - bh;

    ctx.fillStyle = esClaro ? `rgba(${sR}, ${sG}, ${sB}, 0.09)` : 'rgba(8, 13, 25, 0.42)';
    ctx.fillRect(bx, by, bw, bh);

    if (b.hasSpire) {
      const ax = bx + bw * 0.5;
      ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.28 : 0.34})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(ax, by);
      ctx.lineTo(ax, by - 26);
      ctx.stroke();
      const blink = 0.25 + 0.75 * Math.max(0, Math.sin(t * 3.2 + b.seed));
      ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${blink.toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(ax, by - 27, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Capa frontal de edificios con ventanas, letreros de neón verticales y reflejo de charco
  for (const b of state.cityFront) {
    const bx = b.xNorm * ancho;
    const bw = b.wNorm * ancho;
    const bh = b.hNorm * alto;
    const by = alto - bh;

    ctx.fillStyle = esClaro ? `rgba(${sR}, ${sG}, ${sB}, 0.15)` : 'rgba(5, 8, 17, 0.62)';
    ctx.fillRect(bx, by, bw, bh);

    const colsW = Math.max(2, Math.floor(bw / 14));
    const rowsW = Math.max(2, Math.floor(bh / 16));
    for (let r = 0; r < rowsW; r += 1) {
      for (let c = 0; c < colsW; c += 1) {
        const h = (b.seed + r * 11 + c * 7) % 10;
        if (h < 3) {
          const lit = h === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
          const flicker = 0.3 + 0.18 * Math.sin(t * 1.4 + b.seed + r);
          ctx.fillStyle = `rgba(${lit}, ${flicker.toFixed(3)})`;
          ctx.fillRect(bx + 5 + c * 12, by + 8 + r * 14, 5, 7);
        }
      }
    }

    // Letrero de neón vertical en edificios destacados
    if (b.hasSign) {
      const sx = bx + bw - 9;
      const sy = by + 12;
      const sh = Math.min(48, bh * 0.55);
      const col = b.seed % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
      ctx.strokeStyle = `rgba(${col}, 0.75)`;
      ctx.fillStyle = `rgba(${col}, 0.22)`;
      ctx.lineWidth = 1.2;
      ctx.fillRect(sx, sy, 7, sh);
      ctx.strokeRect(sx, sy, 7, sh);
    }
  }

  // Lluvia diagonal
  ctx.lineWidth = 1.1;
  ctx.lineCap = 'round';
  for (const d of state.rainDrops) {
    const ry = (((d.y + (estatico ? 0 : t * d.speed)) % 1) + 1) % 1 * alto;
    const rx = (((d.x - (estatico ? 0 : t * d.speed * 0.22)) % 1) + 1) % 1 * ancho;
    ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${(d.alpha * (esClaro ? 1.15 : 1)).toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - d.len * 0.22, ry + d.len);
    ctx.stroke();
  }

  // Salpicadura + gotas físicas resbalando por el cristal al tocar
  for (const tap of taps) {
    const p = (t - tap.born) / 1.1;
    if (p < 0 || p > 1) continue;
    const fade = 1 - p;
    ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.68).toFixed(3)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(tap.x, tap.y, 6 + p * 40, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let i = state.glassBeads.length - 1; i >= 0; i -= 1) {
    const bead = state.glassBeads[i];
    const age = t - bead.born;
    if (age > 4.2 || bead.y > alto + 20) {
      state.glassBeads.splice(i, 1);
      continue;
    }
    if (!estatico) {
      bead.vy = Math.min(98, bead.vy + 1.45);
      bead.y += bead.vy * 0.016;
      bead.x += Math.sin(t * 5 + i) * 0.35;
      if (bead.r > 4) {
        bead.trail.push({ x: bead.x, y: bead.y });
        if (bead.trail.length > 30) bead.trail.shift();
      }
    }
    const fade = age > 3.2 ? 4.2 - age : 1;

    if (bead.trail.length > 1) {
      ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${(fade * 0.36).toFixed(3)})`;
      ctx.lineWidth = bead.r * 0.55;
      ctx.beginPath();
      for (let k = 0; k < bead.trail.length; k += 1) {
        const pt = bead.trail[k];
        if (k === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    }

    ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * (esClaro ? 0.42 : 0.52)).toFixed(3)})`;
    ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${(fade * 0.82).toFixed(3)})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(bead.x, bead.y, bead.r * 0.88, bead.r * 1.16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 255, 255, ${(fade * 0.78).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(bead.x - bead.r * 0.28, bead.y - bead.r * 0.32, bead.r * 0.24, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ============================================================================
// 8. ACRÓPOLIS ESTELAR (Starry Acropolis — Partenón griego + constelaciones + meteoro)
// ============================================================================
const CONSTELACIONES: [number, number][][] = [
  // Casiopea (arriba izquierda)
  [
    [0.06, 0.16],
    [0.11, 0.21],
    [0.15, 0.15],
    [0.2, 0.22],
    [0.25, 0.17],
  ],
  // Orión (arriba derecha)
  [
    [0.82, 0.12],
    [0.9, 0.14],
    [0.86, 0.23],
    [0.83, 0.24],
    [0.89, 0.22],
    [0.92, 0.33],
    [0.8, 0.34],
  ],
  // Osa Menor (centro-bajo izquierdo)
  [
    [0.06, 0.62],
    [0.11, 0.58],
    [0.16, 0.61],
    [0.21, 0.65],
    [0.25, 0.62],
    [0.24, 0.69],
    [0.2, 0.7],
  ],
];

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

  // Banda diagonal de la Vía Láctea
  ctx.save();
  ctx.translate(ancho * 0.5, alto * 0.35);
  ctx.rotate(-0.42);
  const mw = ctx.createLinearGradient(0, -140, 0, 140);
  mw.addColorStop(0, `rgba(${sR}, ${sG}, ${sB}, 0)`);
  mw.addColorStop(0.5, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.09 : 0.1})`);
  mw.addColorStop(1, `rgba(${sR}, ${sG}, ${sB}, 0)`);
  ctx.fillStyle = mw;
  ctx.fillRect(-ancho, -140, ancho * 2, 280);
  ctx.restore();

  // Estrellas de fondo titilando
  for (const st of state.bgStars) {
    const tw = 0.3 + 0.7 * Math.sin(t * 1.7 + st.fase);
    const col = st.sec ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;
    ctx.fillStyle = `rgba(${col}, ${(tw * (esClaro ? 0.34 : 0.44)).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(st.x * ancho, st.y * alto, st.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Constelaciones mitológicas griegas conectadas en oro / acento
  for (let ci = 0; ci < CONSTELACIONES.length; ci += 1) {
    const stars = CONSTELACIONES[ci];
    ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.28 : 0.32})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < stars.length; i += 1) {
      const sx = stars[i][0] * ancho;
      const sy = stars[i][1] * alto;
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    for (let i = 0; i < stars.length; i += 1) {
      const sx = stars[i][0] * ancho;
      const sy = stars[i][1] * alto;
      const pulse = 0.6 + 0.4 * Math.sin(t * 2.2 + i + ci);
      ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${(pulse * 0.9).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 2.3 + (i === 0 ? 1 : 0), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Colina rocosa de la Acrópolis en el borde inferior derecho + Partenón con 8 columnas dóricas
  const hillBase = alto;
  const tx = ancho * 0.84;
  const templeY = alto - 34;

  ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.14 : 0.14})`;
  ctx.beginPath();
  ctx.moveTo(ancho * 0.52, hillBase);
  ctx.quadraticCurveTo(ancho * 0.72, alto - 44, tx, templeY + 2);
  ctx.lineTo(ancho, templeY + 12);
  ctx.lineTo(ancho, hillBase);
  ctx.closePath();
  ctx.fill();

  // Templo del Partenón (basamento, 8 columnas estriadas, arquitrabe y frontón triangular)
  const tw = 128;
  const colH = 38;
  ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.24 : 0.22})`;
  ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.56 : 0.62})`;
  ctx.lineWidth = 1.25;

  // Estilóbato (3 escalones)
  ctx.fillRect(tx - tw * 0.55, templeY - 4, tw * 1.1, 6);
  ctx.strokeRect(tx - tw * 0.55, templeY - 4, tw * 1.1, 6);

  // 8 columnas dóricas con capitel
  for (let c = 0; c < 8; c += 1) {
    const cx = tx - tw * 0.46 + (c / 7) * (tw * 0.92);
    ctx.fillRect(cx - 3.2, templeY - 4 - colH, 6.4, colH);
    ctx.fillRect(cx - 5, templeY - 4 - colH - 3, 10, 3);
  }

  // Arquitrabe y frontón triangular
  const roofY = templeY - 4 - colH - 3;
  ctx.fillRect(tx - tw * 0.54, roofY - 7, tw * 1.08, 7);
  ctx.beginPath();
  ctx.moveTo(tx - tw * 0.58, roofY - 7);
  ctx.lineTo(tx, roofY - 26);
  ctx.lineTo(tx + tw * 0.58, roofY - 7);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Resplandor cálido de antorchas dentro del templo
  const torchGlow = ctx.createRadialGradient(tx, templeY - 20, 2, tx, templeY - 20, 56);
  const flick = 0.22 + 0.07 * Math.sin(t * 7.5);
  torchGlow.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${flick.toFixed(3)})`);
  torchGlow.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, 0)`);
  ctx.fillStyle = torchGlow;
  ctx.beginPath();
  ctx.arc(tx, templeY - 20, 56, 0, Math.PI * 2);
  ctx.fill();

  // Animación exclusiva de toque: Estrella fugaz arqueada + destello de constelación mítica
  for (const tap of taps) {
    const p = (t - tap.born) / 2.2;
    if (p < 0 || p > 1) continue;
    const fade = 1 - p;

    // Estrella fugaz atravesando desde el clic
    const dir = tap.x > ancho * 0.5 ? -1 : 1;
    const mx = tap.x + dir * p * 280;
    const my = tap.y + p * 105 + p * p * 30;
    const tp = Math.max(0, p - 0.18);
    const mtx = tap.x + dir * tp * 280;
    const mty = tap.y + tp * 105 + tp * tp * 30;

    const grad = ctx.createLinearGradient(mtx, mty, mx, my);
    grad.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, 0)`);
    grad.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.95).toFixed(3)})`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(mtx, mty);
    ctx.lineTo(mx, my);
    ctx.stroke();

    // Estrella de 4 puntas en la cabeza del meteoro
    ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${(fade * 0.95).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(mx, my, 3.2 * fade + 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Anillo dorado astronómico en el origen del toque
    ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.55).toFixed(3)})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(tap.x, tap.y, 8 + p * 44, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// ============================================================================
// 9. BAHÍA LÁSER (Marina Bay — Supertrees + SkyPark + reflejos + show de láseres)
// ============================================================================
export function dibujarBahiaLaser(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  t: number,
  pal: WorldPalette,
  taps: WorldTap[],
) {
  const { bgR, bgG, bgB, pR, pG, pB, sR, sG, sB, esClaro } = pal;
  ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
  ctx.fillRect(0, 0, ancho, alto);

  const waterY = alto - 58;

  // Show de rayos láser volumétricos barriendo el cielo nocturno desde los márgenes
  const laserOrigins = [ancho * 0.12, ancho * 0.88];
  for (let o = 0; o < laserOrigins.length; o += 1) {
    const ox = laserOrigins[o];
    for (let b = 0; b < 3; b += 1) {
      const ang = -Math.PI * 0.5 + Math.sin(t * (0.45 + b * 0.18) + o * 2.1 + b) * 0.65;
      const len = Math.max(ancho, alto) * 0.95;
      const ex = ox + Math.cos(ang) * len;
      const ey = waterY + Math.sin(ang) * len;
      const col = (o + b) % 2 === 0 ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;
      const lg = ctx.createLinearGradient(ox, waterY, ex, ey);
      lg.addColorStop(0, `rgba(${col}, ${esClaro ? 0.22 : 0.24})`);
      lg.addColorStop(0.6, `rgba(${col}, ${esClaro ? 0.07 : 0.08})`);
      lg.addColorStop(1, `rgba(${col}, 0)`);
      ctx.strokeStyle = lg;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(ox, waterY - 24);
      ctx.lineTo(ex, ey);
      ctx.stroke();
    }
  }

  // 4 Supertrees futuristas con copas acanaladas luminosas (márgenes izquierdo y derecho)
  const trees = [
    { x: ancho * 0.07, h: 92, w: 34, sec: false },
    { x: ancho * 0.15, h: 68, w: 26, sec: true },
    { x: ancho * 0.85, h: 74, w: 28, sec: true },
    { x: ancho * 0.93, h: 98, w: 36, sec: false },
  ];
  for (const tr of trees) {
    const col = tr.sec ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;
    const topY = waterY - tr.h;
    ctx.strokeStyle = `rgba(${col}, ${esClaro ? 0.5 : 0.56})`;
    ctx.fillStyle = `rgba(${col}, ${esClaro ? 0.14 : 0.14})`;
    ctx.lineWidth = 1.4;

    // Tronco hiperbólico
    ctx.beginPath();
    ctx.moveTo(tr.x - 10, waterY);
    ctx.quadraticCurveTo(tr.x - 4, waterY - tr.h * 0.5, tr.x - tr.w, topY);
    ctx.lineTo(tr.x + tr.w, topY);
    ctx.quadraticCurveTo(tr.x + 4, waterY - tr.h * 0.5, tr.x + 10, waterY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Copa luminosa de costillas
    for (let rib = -3; rib <= 3; rib += 1) {
      ctx.beginPath();
      ctx.moveTo(tr.x, waterY - tr.h * 0.35);
      ctx.quadraticCurveTo(tr.x + rib * 5, topY + 12, tr.x + (rib / 3) * tr.w, topY - 4);
      ctx.stroke();
    }
  }

  // Silueta icónica de 3 torres con SkyPark curvo en el centro-derecha del horizonte
  const sx = ancho * 0.72;
  ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.16 : 0.18})`;
  for (const off of [-24, 0, 24]) {
    ctx.fillRect(sx + off - 6, waterY - 64, 12, 64);
  }
  ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.6 : 0.72})`;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.moveTo(sx - 38, waterY - 65);
  ctx.quadraticCurveTo(sx + 4, waterY - 72, sx + 44, waterY - 68);
  ctx.stroke();

  // Reflejos ondulantes en el agua debajo de la línea de horizonte
  ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.24 : 0.26})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, waterY);
  ctx.lineTo(ancho, waterY);
  ctx.stroke();

  for (let r = 0; r < 14; r += 1) {
    const ry = waterY + 6 + r * 3.8;
    const wobble = Math.sin(t * 2.4 + r * 0.8) * 14;
    const col = r % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    ctx.strokeStyle = `rgba(${col}, ${((1 - r / 14) * 0.28).toFixed(3)})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(ancho * 0.05 + wobble, ry);
    ctx.lineTo(ancho * 0.2 + wobble, ry);
    ctx.moveTo(ancho * 0.68 - wobble, ry);
    ctx.lineTo(ancho * 0.96 - wobble, ry);
    ctx.stroke();
  }

  // Animación exclusiva de toque: Convergencia de abanico láser + fuente luminosa
  for (const tap of taps) {
    const p = (t - tap.born) / 2.2;
    if (p < 0 || p > 1) continue;
    const fade = 1 - p;

    // 2 haces láser convergiendo desde los Supertrees al punto clicado
    for (const ox of laserOrigins) {
      ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.62).toFixed(3)})`;
      ctx.lineWidth = 2.2 * fade;
      ctx.beginPath();
      ctx.moveTo(ox, waterY - 82);
      ctx.lineTo(tap.x, tap.y);
      ctx.stroke();
    }

    // Abanico de 8 rayos prismáticos abriéndose desde el punto tocado
    for (let k = 0; k < 8; k += 1) {
      const ang = (k / 8) * Math.PI * 2 + p * 0.6 + tap.seed;
      const len = 18 + p * 145;
      const col = k % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
      ctx.strokeStyle = `rgba(${col}, ${(fade * 0.82).toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(tap.x, tap.y);
      ctx.lineTo(tap.x + Math.cos(ang) * len, tap.y + Math.sin(ang) * len);
      ctx.stroke();
    }
  }
}

// ============================================================================
// 10. PUENTE COSTA (Coast Road — puente colgante costero + niebla + aves + mar)
// ============================================================================
export function dibujarPuenteCosta(
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

  const seaY = alto - 48;

  // Resplandor de atardecer / amanecer costero en el horizonte izquierdo
  const sunX = ancho * 0.16;
  const sunY = seaY - 12;
  const sunG = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, Math.min(ancho, alto) * 0.36);
  sunG.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.24 : 0.28})`);
  sunG.addColorStop(0.5, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.1 : 0.12})`);
  sunG.addColorStop(1, `rgba(${bgR}, ${bgG}, ${bgB}, 0)`);
  ctx.fillStyle = sunG;
  ctx.fillRect(0, 0, ancho, alto);

  // Acantilados costeros a los lados
  ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.14 : 0.16})`;
  ctx.beginPath();
  ctx.moveTo(0, alto);
  ctx.lineTo(0, seaY - 58);
  ctx.quadraticCurveTo(ancho * 0.12, seaY - 50, ancho * 0.22, seaY);
  ctx.lineTo(ancho * 0.22, alto);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(ancho, alto);
  ctx.lineTo(ancho, seaY - 64);
  ctx.quadraticCurveTo(ancho * 0.88, seaY - 54, ancho * 0.78, seaY);
  ctx.lineTo(ancho * 0.78, alto);
  ctx.closePath();
  ctx.fill();

  // Puente colgante costero con 2 torres, cable parabólico principal y tirantes verticales
  const deckY = seaY - 38;
  const towerL = ancho * 0.26;
  const towerR = ancho * 0.74;
  const towerTop = deckY - 68;

  ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.45 : 0.5})`;
  ctx.lineWidth = 2.4;
  // Calzada horizontal
  ctx.beginPath();
  ctx.moveTo(0, deckY);
  ctx.lineTo(ancho, deckY);
  ctx.stroke();

  // Torres gemelas del puente
  for (const tx of [towerL, towerR]) {
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(tx - 6, seaY + 4);
    ctx.lineTo(tx - 4, towerTop);
    ctx.moveTo(tx + 6, seaY + 4);
    ctx.lineTo(tx + 4, towerTop);
    ctx.stroke();
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(tx - 5, towerTop + 14);
    ctx.lineTo(tx + 5, towerTop + 14);
    ctx.moveTo(tx - 5, towerTop + 34);
    ctx.lineTo(tx + 5, towerTop + 34);
    ctx.stroke();
  }

  // Cable parabólico principal + tirantes verticales
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(0, deckY);
  ctx.quadraticCurveTo(towerL * 0.55, deckY - 12, towerL, towerTop);
  ctx.quadraticCurveTo(ancho * 0.5, deckY + 26, towerR, towerTop);
  ctx.quadraticCurveTo(towerR + (ancho - towerR) * 0.45, deckY - 12, ancho, deckY);
  ctx.stroke();

  ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.22 : 0.26})`;
  ctx.lineWidth = 1;
  const cables = 16;
  for (let i = 1; i < cables; i += 1) {
    const u = i / cables;
    const cx = towerL + u * (towerR - towerL);
    const inv = 1 - u;
    const cy = inv * inv * towerTop + 2 * inv * u * (deckY + 26) + u * u * towerTop;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, deckY);
    ctx.stroke();
  }

  // Bancos de niebla costera respirando suavemente sobre el agua
  for (let f = 0; f < 3; f += 1) {
    const fx = ancho * (0.25 + f * 0.25) + Math.sin(t * 0.25 + f * 1.9) * 55;
    const fy = seaY - 10 + (f % 2) * 14;
    const fg = ctx.createRadialGradient(fx, fy, 10, fx, fy, 160);
    fg.addColorStop(0, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.14 : 0.14})`);
    fg.addColorStop(1, `rgba(${sR}, ${sG}, ${sB}, 0)`);
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.ellipse(fx, fy, 180, 42, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Olas suaves y reflejo del sol en el mar
  for (let w = 0; w < 8; w += 1) {
    const wy = seaY + 6 + w * 5.2;
    const shift = Math.sin(t * 1.6 + w * 0.9) * 12;
    ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${((1 - w / 8) * 0.34).toFixed(3)})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(sunX - 38 + w * 3 + shift, wy);
    ctx.lineTo(sunX + 38 - w * 3 + shift, wy);
    ctx.stroke();
  }

  // Pelícanos / aves marinas planeando por el cielo costero
  ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.52 : 0.58})`;
  ctx.lineWidth = 1.4;
  for (const b of state.birds) {
    const bx = (((b.xNorm + (estatico ? 0 : t * b.vel)) % 1.1) - 0.05) * ancho;
    const by = b.yNorm * alto + Math.sin(t * 1.6 + b.fase) * 10;
    const flap = Math.sin(t * 4.2 + b.fase) * (b.size * 0.55);
    ctx.beginPath();
    ctx.moveTo(bx - b.size, by + flap);
    ctx.quadraticCurveTo(bx - b.size * 0.4, by - b.size * 0.45, bx, by);
    ctx.quadraticCurveTo(bx + b.size * 0.4, by - b.size * 0.45, bx + b.size, by + flap);
    ctx.stroke();
  }

  // Animación exclusiva de toque: Bandada de 7 aves levantando vuelo + pulso de luz por el puente
  for (const tap of taps) {
    const p = (t - tap.born) / 2.6;
    if (p < 0 || p > 1) continue;
    const fade = 1 - p;

    // Pulso luminoso corriendo por el cable principal del puente
    const u = Math.min(1, p * 1.3);
    const inv = 1 - u;
    const lx = towerL + u * (towerR - towerL);
    const ly = inv * inv * towerTop + 2 * inv * u * (deckY + 26) + u * u * towerTop;
    ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.95).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(lx, ly, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Bandada de 7 aves alzando el vuelo desde el punto tocado
    ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.9).toFixed(3)})`;
    ctx.lineWidth = 1.6;
    for (let k = 0; k < 7; k += 1) {
      const ang = -Math.PI * 0.72 + (k / 6) * (Math.PI * 0.44);
      const dist = 12 + p * (170 + (k % 3) * 42);
      const bx = tap.x + Math.cos(ang) * dist;
      const by = tap.y + Math.sin(ang) * dist;
      const sz = 6 + (k % 2) * 2.5;
      const fl = Math.sin(t * 9 + k * 1.2) * 3.5;
      ctx.beginPath();
      ctx.moveTo(bx - sz, by + fl);
      ctx.quadraticCurveTo(bx - sz * 0.4, by - sz * 0.5, bx, by);
      ctx.quadraticCurveTo(bx + sz * 0.4, by - sz * 0.5, bx + sz, by + fl);
      ctx.stroke();
    }
  }
}
