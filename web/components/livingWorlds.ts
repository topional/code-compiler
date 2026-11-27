export interface WorldPalette {
  bgR: number;
  bgG: number;
  bgB: number;
  pR: number;
  pG: number;
  pB: number;
  sR: number;
  sG: number;
  sB: number;
  esClaro: boolean;
}

export interface WorldTap {
  x: number;
  y: number;
  born: number;
  seed: number;
}

export interface WorldState {
  // Koi state (2 articulated fish with 12-segment kinematic spines)
  kois: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    angle: number;
    spine: { x: number; y: number }[];
    size: number;
    sec: boolean;
    phase: number;
    speed: number;
    targetX: number;
    targetY: number;
    retargetAt: number;
  }[];
  lilyPads: {
    xNorm: number;
    yNorm: number;
    r: number;
    notch: number;
    hasLotus: boolean;
    phase: number;
  }[];
  // Laguna state (sea turtle + manta ray)
  turtle: { x: number; y: number; angle: number };
  manta: { x: number; y: number; angle: number };
  // Cosmos stars
  galaxyStars: { r: number; arm: number; offset: number; size: number; sec: boolean; speed: number }[];
  // Lluvia streaks + windows + interactive sliding drops
  rainDrops: { x: number; y: number; len: number; speed: number; alpha: number }[];
  cityBuildings: { xNorm: number; wNorm: number; hNorm: number; seed: number }[];
  glassBeads: { x: number; y: number; r: number; vy: number; born: number; trail: { x: number; y: number }[] }[];
  // Offscreen pixel buffer for 1-bit Bayer Dither Dunes
  ditherCanvas: HTMLCanvasElement | null;
  ditherCtx: CanvasRenderingContext2D | null;
}

const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export function crearEstadoMundos(ancho: number, alto: number): WorldState {
  const initKoi = (x: number, y: number, angle: number, size: number, sec: boolean, phase: number) => ({
    x,
    y,
    vx: Math.cos(angle) * 42,
    vy: Math.sin(angle) * 42,
    angle,
    spine: Array.from({ length: 12 }, (_, i) => ({
      x: x - Math.cos(angle) * i * (size * 0.42),
      y: y - Math.sin(angle) * i * (size * 0.42),
    })),
    size,
    sec,
    phase,
    speed: sec ? 36 : 44,
    targetX: x + 180,
    targetY: y + 80,
    retargetAt: 0,
  });

  const ditherCanvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  const ditherCtx = ditherCanvas ? ditherCanvas.getContext('2d') : null;

  return {
    kois: [
      initKoi(ancho * 0.78, alto * 0.24, 2.5, 16, false, 0),
      initKoi(ancho * 0.18, alto * 0.72, -0.45, 14, true, 3.1),
    ],
    lilyPads: [
      { xNorm: 0.91, yNorm: 0.16, r: 34, notch: 2.4, hasLotus: true, phase: 0.3 },
      { xNorm: 0.85, yNorm: 0.22, r: 22, notch: 1.1, hasLotus: false, phase: 1.7 },
      { xNorm: 0.08, yNorm: 0.82, r: 38, notch: -0.6, hasLotus: true, phase: 2.6 },
      { xNorm: 0.14, yNorm: 0.89, r: 24, notch: 0.7, hasLotus: false, phase: 4.1 },
    ],
    turtle: { x: ancho * 0.82, y: alto * 0.28, angle: 2.35 },
    manta: { x: ancho * 0.16, y: alto * 0.76, angle: -0.5 },
    galaxyStars: Array.from({ length: 145 }, (_, i) => ({
      r: 14 + Math.pow((i * 17.3) % 100, 1.18) * 1.15,
      arm: i % 2,
      offset: ((i * 29.7) % 100) / 100 - 0.5,
      size: 1 + (i % 3) * 0.7,
      sec: i % 3 === 0,
      speed: 0.24 / (1 + ((i * 17.3) % 100) * 0.018),
    })),
    rainDrops: Array.from({ length: 95 }, (_, i) => ({
      x: ((i * 67.3) % 100) / 100,
      y: ((i * 43.1) % 100) / 100,
      len: 14 + (i % 5) * 7,
      speed: 0.36 + (i % 6) * 0.075,
      alpha: 0.14 + (i % 4) * 0.06,
    })),
    cityBuildings: Array.from({ length: 24 }, (_, i) => ({
      xNorm: i / 24,
      wNorm: 1 / 24 + 0.008,
      hNorm: 0.08 + (((i * 37 + 13) % 17) / 17) * 0.17,
      seed: i * 19 + 7,
    })),
    glassBeads: [],
    ditherCanvas,
    ditherCtx,
  };
}

export function registrarToqueMundo(
  modo: string,
  state: WorldState,
  x: number,
  y: number,
  tiempo: number,
) {
  if (modo === 'koi') {
    // Atraer al pez koi más cercano hacia el toque (como comida en un estanque)
    let best = state.kois[0];
    let bestD = Infinity;
    for (const k of state.kois) {
      const d = Math.hypot(k.x - x, k.y - y);
      if (d < bestD) {
        bestD = d;
        best = k;
      }
    }
    if (best) {
      best.targetX = x;
      best.targetY = y;
      best.retargetAt = tiempo + 4.5;
    }
  } else if (modo === 'lluvia') {
    // Crear gota gruesa que resbala por el cristal + 3 microgotas
    state.glassBeads.push({
      x,
      y,
      r: 5.5,
      vy: 14,
      born: tiempo,
      trail: [{ x, y }],
    });
    for (let i = 0; i < 3; i += 1) {
      const ang = (i / 3) * Math.PI * 2 + x * 0.05;
      state.glassBeads.push({
        x: x + Math.cos(ang) * (10 + i * 5),
        y: y + Math.sin(ang) * (8 + i * 4),
        r: 2.4 + (i % 2) * 0.9,
        vy: 8 + i * 4,
        born: tiempo,
        trail: [],
      });
    }
    if (state.glassBeads.length > 26) {
      state.glassBeads.splice(0, state.glassBeads.length - 26);
    }
  }
}

// ============================================================================
// 1. ESTANQUE KOI (Anthropic Koi Mosaic — peces articulados + nenúfares + ondas)
// ============================================================================
export function dibujarEstanqueKoi(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  t: number,
  pal: WorldPalette,
  taps: WorldTap[],
  state: WorldState,
  mouse: { x: number; y: number },
  estatico: boolean,
) {
  const { bgR, bgG, bgB, pR, pG, pB, sR, sG, sB, esClaro } = pal;
  ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
  ctx.fillRect(0, 0, ancho, alto);

  // Sutil brillo de agua en mosaico (cáusticas suaves)
  const tile = ancho < 640 ? 28 : 24;
  const cols = Math.ceil(ancho / tile);
  const rows = Math.ceil(alto / tile);
  for (let r = 0; r < rows; r += 1) {
    const cy = r * tile + tile * 0.5;
    for (let c = 0; c < cols; c += 1) {
      const cx = c * tile + tile * 0.5;
      const caustic =
        Math.sin(c * 0.34 + t * 0.65) * Math.cos(r * 0.31 - t * 0.52) +
        Math.sin((c + r) * 0.2 + t * 0.4) * 0.5;
      let alpha = caustic > 0.65 ? (caustic - 0.65) * (esClaro ? 0.08 : 0.09) : 0;

      // Ondas de agua en mosaico al tocar
      for (const tap of taps) {
        const p = (t - tap.born) / 2.6;
        if (p < 0 || p > 1) continue;
        const d = Math.hypot(cx - tap.x, cy - tap.y);
        const w1 = Math.abs(d - (12 + p * 290));
        const w2 = Math.abs(d - Math.max(0, p * 290 - 48));
        if (w1 < 22) alpha = Math.max(alpha, (1 - w1 / 22) * (1 - p) * (esClaro ? 0.24 : 0.3));
        if (w2 < 18) alpha = Math.max(alpha, (1 - w2 / 18) * (1 - p) * (esClaro ? 0.16 : 0.2));
      }

      if (alpha > 0.012) {
        ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${alpha.toFixed(3)})`;
        ctx.fillRect(c * tile + 2, r * tile + 2, tile - 4, tile - 4);
      }
    }
  }

  // Actualizar física cinemática de cada pez Koi (espina dorsal de 12 segmentos)
  for (const koi of state.kois) {
    if (!estatico) {
      if (t > koi.retargetAt || Math.hypot(koi.targetX - koi.x, koi.targetY - koi.y) < 38) {
        // Nadar sobre todo por los márgenes y diagonales elegantes
        const esquina = Math.floor((t * 0.3 + koi.phase) % 4);
        const puntos = [
          [ancho * 0.84, alto * 0.24],
          [ancho * 0.16, alto * 0.78],
          [ancho * 0.86, alto * 0.78],
          [ancho * 0.18, alto * 0.22],
        ];
        const pt = puntos[(esquina + (koi.sec ? 2 : 0)) % 4];
        koi.targetX = pt[0] + Math.sin(t + koi.phase) * 70;
        koi.targetY = pt[1] + Math.cos(t * 0.8 + koi.phase) * 55;
        koi.retargetAt = t + 5.2;
      }

      const desired = Math.atan2(koi.targetY - koi.y, koi.targetX - koi.x);
      let diff = desired - koi.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      koi.angle += diff * 0.032;

      const sway = Math.sin(t * 4.8 + koi.phase) * 0.1;
      const moveAng = koi.angle + sway;
      koi.x += Math.cos(moveAng) * koi.speed * 0.016;
      koi.y += Math.sin(moveAng) * koi.speed * 0.016;

      // Mantener dentro del lienzo con margen amplio
      if (koi.x < -60) koi.x = ancho + 50;
      if (koi.x > ancho + 60) koi.x = -50;
      if (koi.y < -60) koi.y = alto + 50;
      if (koi.y > alto + 60) koi.y = -50;

      // Resolver espina articulada segmento por segmento
      koi.spine[0].x = koi.x;
      koi.spine[0].y = koi.y;
      const segLen = koi.size * 0.48;
      for (let i = 1; i < koi.spine.length; i += 1) {
        const prev = koi.spine[i - 1];
        const cur = koi.spine[i];
        const ang = Math.atan2(cur.y - prev.y, cur.x - prev.x);
        const wave = Math.sin(t * 6.2 - i * 0.58 + koi.phase) * (i * 0.018);
        cur.x = prev.x + Math.cos(ang + wave) * segLen;
        cur.y = prev.y + Math.sin(ang + wave) * segLen;
      }
    }

    // Sombra suave bajo el pez en el fondo del estanque
    ctx.save();
    for (let i = koi.spine.length - 1; i >= 0; i -= 1) {
      const seg = koi.spine[i];
      const u = i / (koi.spine.length - 1);
      const rad = koi.size * Math.sin(Math.pow(1 - u, 0.72) * Math.PI * 0.85) * 0.72;
      ctx.fillStyle = esClaro ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.28)';
      ctx.beginPath();
      ctx.arc(seg.x + 8, seg.y + 12, Math.max(2, rad), 0, Math.PI * 2);
      ctx.fill();
    }

    const bodyCol = koi.sec ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;
    const spotCol = koi.sec ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    const pearlCol = esClaro ? '255, 255, 255' : '244, 248, 255';

    // Aletas pectorales ondeantes (en segmento 2)
    const sh = koi.spine[2];
    const headAng = Math.atan2(koi.spine[0].y - sh.y, koi.spine[0].x - sh.x);
    const finFlutter = Math.sin(t * 5.2 + koi.phase) * 0.25;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(sh.x, sh.y);
      ctx.rotate(headAng + side * (1.15 + finFlutter));
      ctx.fillStyle = `rgba(${bodyCol}, ${esClaro ? 0.34 : 0.42})`;
      ctx.beginPath();
      ctx.ellipse(koi.size * 0.65, 0, koi.size * 0.75, koi.size * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Cola en abanico translúcida (en último segmento)
    const tail = koi.spine[koi.spine.length - 1];
    const preTail = koi.spine[koi.spine.length - 2];
    const tailAng = Math.atan2(tail.y - preTail.y, tail.x - preTail.x);
    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(tailAng);
    ctx.fillStyle = `rgba(${bodyCol}, ${esClaro ? 0.36 : 0.45})`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(koi.size * 0.75, -koi.size * 0.65, koi.size * 1.15, -koi.size * 0.45);
    ctx.quadraticCurveTo(koi.size * 0.55, 0, koi.size * 1.15, koi.size * 0.45);
    ctx.quadraticCurveTo(koi.size * 0.75, koi.size * 0.65, 0, 0);
    ctx.fill();
    ctx.restore();

    // Cuerpo segmentado estilo mosaico pixel-art orgánico con manchas calico
    for (let i = koi.spine.length - 1; i >= 0; i -= 1) {
      const seg = koi.spine[i];
      const u = i / (koi.spine.length - 1);
      const rad = Math.max(2.6, koi.size * Math.sin(Math.pow(1 - u, 0.7) * Math.PI * 0.85) * 0.74);
      const esMancha = i === 1 || i === 4 || i === 5 || i === 8;
      const esPerla = i === 2 || i === 6 || i === 7;
      ctx.fillStyle = esPerla
        ? `rgba(${pearlCol}, ${esClaro ? 0.72 : 0.62})`
        : esMancha
          ? `rgba(${bodyCol}, ${esClaro ? 0.78 : 0.82})`
          : `rgba(${spotCol}, ${esClaro ? 0.62 : 0.68})`;
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ojos discretos en la cabeza
    const hd = koi.spine[0];
    ctx.fillStyle = esClaro ? 'rgba(15,23,42,0.75)' : 'rgba(6,10,20,0.9)';
    for (const side of [-1, 1]) {
      const ex = hd.x + Math.cos(headAng + side * 0.7) * (koi.size * 0.42);
      const ey = hd.y + Math.sin(headAng + side * 0.7) * (koi.size * 0.42);
      ctx.beginPath();
      ctx.arc(ex, ey, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Nenúfares flotantes con flores de loto en las esquinas
  for (const pad of state.lilyPads) {
    const px = pad.xNorm * ancho + Math.sin(t * 0.6 + pad.phase) * 6;
    const py = pad.yNorm * alto + Math.cos(t * 0.5 + pad.phase) * 5;
    const rot = pad.notch + Math.sin(t * 0.35 + pad.phase) * 0.14;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);
    // Hoja de nenúfar con muesca
    ctx.fillStyle = esClaro ? 'rgba(34, 139, 94, 0.24)' : 'rgba(52, 211, 153, 0.16)';
    ctx.strokeStyle = esClaro ? 'rgba(20, 108, 70, 0.35)' : 'rgba(52, 211, 153, 0.32)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, pad.r, 0.28, Math.PI * 2 - 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Flor de loto de 8 pétalos en los nenúfares principales
    if (pad.hasLotus) {
      const petalR = pad.r * 0.34;
      for (let k = 0; k < 8; k += 1) {
        const a = (k / 8) * Math.PI * 2 + t * 0.08;
        ctx.save();
        ctx.rotate(a);
        ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.52 : 0.58})`;
        ctx.beginPath();
        ctx.ellipse(petalR * 0.7, 0, petalR * 0.75, petalR * 0.32, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, 0.8)`;
      ctx.beginPath();
      ctx.arc(0, 0, pad.r * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Anillos de agua nítidos sobre la superficie al tocar
  for (const tap of taps) {
    const p = (t - tap.born) / 2.6;
    if (p < 0 || p > 1) continue;
    const fade = 1 - p;
    for (let ring = 0; ring < 3; ring += 1) {
      const rp = Math.max(0, p - ring * 0.12);
      if (rp <= 0) continue;
      const rad = 10 + rp * 230;
      const col = ring % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
      ctx.strokeStyle = `rgba(${col}, ${(fade * (0.62 - ring * 0.15)).toFixed(3)})`;
      ctx.lineWidth = 1.8 - ring * 0.35;
      ctx.beginPath();
      ctx.arc(tap.x, tap.y, rad, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Sutil brillo en el cursor
  const gCursor = ctx.createRadialGradient(
    mouse.x * ancho,
    mouse.y * alto,
    0,
    mouse.x * ancho,
    mouse.y * alto,
    110,
  );
  gCursor.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.07 : 0.08})`);
  gCursor.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, 0)`);
  ctx.fillStyle = gCursor;
  ctx.fillRect(0, 0, ancho, alto);
}

// ============================================================================
// 2. LAGUNA TORTUGA (Anthropic Honu Lagoon + Night Reef — tortuga + mantarraya)
// ============================================================================
export function dibujarLagunaTortuga(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  t: number,
  pal: WorldPalette,
  taps: WorldTap[],
  state: WorldState,
  estatico: boolean,
) {
  const { bgR, bgG, bgB, pR, pG, pB, sR, sG, sB, esClaro } = pal;
  ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
  ctx.fillRect(0, 0, ancho, alto);

  // Banco de arena / arrecife suave en esquina inferior derecha
  const islX = ancho * 0.94;
  const islY = alto * 0.88;
  const islR = Math.min(ancho, alto) * 0.32;
  const sandGrad = ctx.createRadialGradient(islX, islY, islR * 0.15, islX, islY, islR);
  sandGrad.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.22 : 0.16})`);
  sandGrad.addColorStop(0.55, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.12 : 0.1})`);
  sandGrad.addColorStop(1, `rgba(${sR}, ${sG}, ${sB}, 0)`);
  ctx.fillStyle = sandGrad;
  ctx.beginPath();
  ctx.arc(islX, islY, islR, 0, Math.PI * 2);
  ctx.fill();

  // Red de cáusticas luminosas de agua (ondas cruzadas suaves)
  ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.12 : 0.14})`;
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 9; i += 1) {
    const cx = ancho * (0.1 + ((i * 19.7) % 85) / 100) + Math.sin(t * 0.5 + i) * 28;
    const cy = alto * (0.12 + ((i * 27.3) % 78) / 100) + Math.cos(t * 0.45 + i * 1.3) * 24;
    const r = 46 + Math.sin(t * 0.9 + i) * 14;
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 1.35, r * 0.72, i * 0.5 + t * 0.08, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Actualizar trayectoria de la Tortuga Marina (Honu)
  const turAng = t * 0.18;
  if (!estatico) {
    const nx = ancho * (0.76 + Math.cos(turAng) * 0.16);
    const ny = alto * (0.28 + Math.sin(turAng * 1.4) * 0.16);
    state.turtle.angle = Math.atan2(ny - state.turtle.y, nx - state.turtle.x);
    state.turtle.x = nx;
    state.turtle.y = ny;
  }

  // Dibujar Tortuga Marina articulada (caparazón hexagonal + 4 aletas remando)
  ctx.save();
  ctx.translate(state.turtle.x, state.turtle.y);
  ctx.rotate(state.turtle.angle);
  const flap = Math.sin(t * 3.1) * 0.55;
  const tCol = `${pR}, ${pG}, ${pB}`;
  const tRim = `${sR}, ${sG}, ${sB}`;

  // Sombra
  ctx.fillStyle = esClaro ? 'rgba(0,0,0,0.07)' : 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(8, 12, 22, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Aletas delanteras (brazada)
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(8, side * 12);
    ctx.rotate(side * (0.45 + flap));
    ctx.fillStyle = `rgba(${tRim}, ${esClaro ? 0.52 : 0.62})`;
    ctx.beginPath();
    ctx.ellipse(4, side * 12, 7, 17, side * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Aletas traseras
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(-16, side * 9);
    ctx.rotate(side * (-0.3 - flap * 0.35));
    ctx.fillStyle = `rgba(${tRim}, ${esClaro ? 0.44 : 0.54})`;
    ctx.beginPath();
    ctx.ellipse(-5, side * 5, 6, 10, side * -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Cabeza
  ctx.fillStyle = `rgba(${tRim}, ${esClaro ? 0.64 : 0.74})`;
  ctx.beginPath();
  ctx.ellipse(24, 0, 8.5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Caparazón con patrón de escamas
  ctx.fillStyle = `rgba(${tCol}, ${esClaro ? 0.68 : 0.74})`;
  ctx.strokeStyle = `rgba(${tRim}, ${esClaro ? 0.75 : 0.85})`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 21, 15.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = `rgba(${bgR}, ${bgG}, ${bgB}, 0.55)`;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(0, 0, 12, 8.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Mantarraya bioluminiscente planeando en la parte inferior izquierda
  const manAng = t * 0.14 + 1.8;
  if (!estatico) {
    const mx = ancho * (0.2 + Math.cos(manAng) * 0.15);
    const my = alto * (0.72 + Math.sin(manAng * 1.3) * 0.15);
    state.manta.angle = Math.atan2(my - state.manta.y, mx - state.manta.x);
    state.manta.x = mx;
    state.manta.y = my;
  }

  ctx.save();
  ctx.translate(state.manta.x, state.manta.y);
  ctx.rotate(state.manta.angle);
  const wingWave = Math.sin(t * 2.8) * 6;
  ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.36 : 0.42})`;
  ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.62 : 0.76})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(22, 0);
  ctx.quadraticCurveTo(6, -24 - wingWave, -10, -34 - wingWave);
  ctx.quadraticCurveTo(-12, -10, -20, 0);
  ctx.quadraticCurveTo(-12, 10, -10, 34 + wingWave);
  ctx.quadraticCurveTo(6, 24 + wingWave, 22, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Cola fina de mantarraya
  ctx.beginPath();
  ctx.moveTo(-20, 0);
  ctx.quadraticCurveTo(-34, Math.sin(t * 4) * 5, -50, Math.sin(t * 4 + 1) * 7);
  ctx.stroke();
  ctx.restore();

  // Animación exclusiva de toque: Cardumen de 12 peces bioluminiscentes + burbujas
  for (const tap of taps) {
    const p = (t - tap.born) / 2.5;
    if (p < 0 || p > 1) continue;
    const fade = 1 - p;

    for (let k = 0; k < 12; k += 1) {
      const baseA = (k / 12) * Math.PI * 2 + tap.seed;
      const dist = 16 + Math.pow(p, 0.78) * (155 + (k % 3) * 45);
      const wiggle = Math.sin(t * 10 + k * 1.4) * 8 * p;
      const fx = tap.x + Math.cos(baseA) * dist - Math.sin(baseA) * wiggle;
      const fy = tap.y + Math.sin(baseA) * dist + Math.cos(baseA) * wiggle;
      const col = k % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;

      ctx.save();
      ctx.translate(fx, fy);
      ctx.rotate(baseA);
      ctx.fillStyle = `rgba(${col}, ${(fade * 0.88).toFixed(3)})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, 5.5, 2.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-4.5, 0);
      ctx.lineTo(-9, -3);
      ctx.lineTo(-9, 3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Burbujas ascendentes en el punto del toque
    for (let b = 0; b < 5; b += 1) {
      const bx = tap.x + Math.sin(b * 2.1 + tap.seed) * 18;
      const by = tap.y - p * (60 + b * 22);
      ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${(fade * 0.65).toFixed(3)})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(bx, by, 2 + (b % 3) * 1.2, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// ============================================================================
// 3. COSMOS (markimoo09 — Agujero Negro con disco de acreción + Galaxia Espiral)
// ============================================================================
export function dibujarCosmos(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  t: number,
  pal: WorldPalette,
  taps: WorldTap[],
  state: WorldState,
  mouse: { x: number; y: number },
) {
  const { bgR, bgG, bgB, pR, pG, pB, sR, sG, sB, esClaro } = pal;
  ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
  ctx.fillRect(0, 0, ancho, alto);

  // Nebulosa dual suave
  const neb1 = ctx.createRadialGradient(ancho * 0.82, alto * 0.24, 0, ancho * 0.82, alto * 0.24, Math.max(ancho, alto) * 0.45);
  neb1.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.14 : 0.17})`);
  neb1.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, 0)`);
  ctx.fillStyle = neb1;
  ctx.fillRect(0, 0, ancho, alto);

  const neb2 = ctx.createRadialGradient(ancho * 0.16, alto * 0.78, 0, ancho * 0.16, alto * 0.78, Math.max(ancho, alto) * 0.4);
  neb2.addColorStop(0, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.14 : 0.16})`);
  neb2.addColorStop(1, `rgba(${sR}, ${sG}, ${sB}, 0)`);
  ctx.fillStyle = neb2;
  ctx.fillRect(0, 0, ancho, alto);

  // Galaxia espiral inclinada (abajo izquierda)
  const gx = ancho * (0.16 - (mouse.x - 0.5) * 0.03);
  const gy = alto * (0.78 - (mouse.y - 0.5) * 0.03);
  ctx.save();
  ctx.translate(gx, gy);
  ctx.rotate(-0.32);
  ctx.scale(1, 0.52);
  for (const st of state.galaxyStars) {
    const theta = st.arm * Math.PI + st.r * 0.042 + t * st.speed + st.offset * 0.9;
    const sx = Math.cos(theta) * st.r;
    const sy = Math.sin(theta) * st.r;
    const col = st.sec ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;
    const a = Math.max(0.15, (1 - st.r / 240) * (esClaro ? 0.72 : 0.82));
    ctx.fillStyle = `rgba(${col}, ${a.toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(sx, sy, st.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Agujero Negro Gargantua (arriba derecha) con disco de acreción y lente gravitacional
  const bhX = ancho * (0.84 + (mouse.x - 0.5) * 0.03);
  const bhY = alto * (0.24 + (mouse.y - 0.5) * 0.03);
  const bhR = Math.min(ancho, alto) * 0.068;

  ctx.save();
  ctx.translate(bhX, bhY);
  ctx.rotate(-0.24);

  // Arco superior e inferior de lente gravitacional
  for (let band = 0; band < 5; band += 1) {
    const rBand = bhR * (1.28 + band * 0.14);
    const col = band % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    ctx.strokeStyle = `rgba(${col}, ${(0.45 - band * 0.07).toFixed(3)})`;
    ctx.lineWidth = 2.6 - band * 0.35;
    ctx.beginPath();
    ctx.arc(0, 0, rBand, Math.PI, Math.PI * 2);
    ctx.stroke();
  }

  // Disco de acreción parte trasera
  for (let band = 0; band < 7; band += 1) {
    const rx = bhR * (1.6 + band * 0.36);
    const ry = rx * 0.24;
    const col = band % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    ctx.strokeStyle = `rgba(${col}, ${(0.5 - band * 0.055).toFixed(3)})`;
    ctx.lineWidth = 2.4 - band * 0.22;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
  }

  // Horizonte de sucesos + anillo de fotones
  ctx.fillStyle = esClaro ? `rgb(${Math.max(0, bgR - 220)}, ${Math.max(0, bgG - 220)}, ${Math.max(0, bgB - 220)})` : '#020308';
  ctx.beginPath();
  ctx.arc(0, 0, bhR, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, 0.9)`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, bhR * 1.04, 0, Math.PI * 2);
  ctx.stroke();

  // Disco de acreción parte delantera (pasa por delante del agujero negro)
  for (let band = 0; band < 7; band += 1) {
    const rx = bhR * (1.6 + band * 0.36);
    const ry = rx * 0.24;
    const col = band % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    ctx.strokeStyle = `rgba(${col}, ${(0.68 - band * 0.075).toFixed(3)})`;
    ctx.lineWidth = 2.8 - band * 0.24;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI);
    ctx.stroke();
  }
  ctx.restore();

  // Animación exclusiva de toque: Anillo de lente gravitacional + 6 meteoros curvados hacia el agujero negro
  for (const tap of taps) {
    const p = (t - tap.born) / 2.4;
    if (p < 0 || p > 1) continue;
    const fade = 1 - p;

    // Onda de distorsión gravitacional
    const rLens = 14 + p * 185;
    ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${(fade * 0.72).toFixed(3)})`;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(tap.x, tap.y, rLens, 0, Math.PI * 2);
    ctx.stroke();

    // 6 meteoros con trayectoria curvada por la gravedad del agujero negro
    for (let k = 0; k < 6; k += 1) {
      const ang = (k / 6) * Math.PI * 2 + tap.seed;
      const col = k % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
      const reach = p * (190 + (k % 3) * 50);
      const pull = p * p * 0.32;
      const hx = tap.x + Math.cos(ang) * reach + (bhX - tap.x) * pull;
      const hy = tap.y + Math.sin(ang) * reach + (bhY - tap.y) * pull;

      const tailP = Math.max(0, p - 0.14);
      const tReach = tailP * (190 + (k % 3) * 50);
      const tPull = tailP * tailP * 0.32;
      const tx = tap.x + Math.cos(ang) * tReach + (bhX - tap.x) * tPull;
      const ty = tap.y + Math.sin(ang) * tReach + (bhY - tap.y) * tPull;

      ctx.strokeStyle = `rgba(${col}, ${(fade * 0.92).toFixed(3)})`;
      ctx.lineWidth = 2.2 * fade + 0.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(hx, hy);
      ctx.stroke();

      ctx.fillStyle = `rgba(${col}, ${(fade * 0.95).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(hx, hy, 2.4 * fade + 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// ============================================================================
// 4. MONTAÑAS VECTOR (Anthropic Vector Range — malla 3D perspectiva + sonar)
// ============================================================================
export function dibujarMontanasVector(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  t: number,
  pal: WorldPalette,
  taps: WorldTap[],
  mouse: { x: number; y: number },
) {
  const { bgR, bgG, bgB, pR, pG, pB, sR, sG, sB, esClaro } = pal;
  ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
  ctx.fillRect(0, 0, ancho, alto);

  // Sol/luna retro vector con cortes horizontales sobre el horizonte
  const horizonY = alto * 0.54;
  const sunX = ancho * (0.78 + (mouse.x - 0.5) * 0.04);
  const sunY = horizonY - Math.min(ancho, alto) * 0.15;
  const sunR = Math.min(ancho, alto) * 0.11;

  ctx.save();
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.clip();
  const sunGrad = ctx.createLinearGradient(sunX, sunY - sunR, sunX, sunY + sunR);
  sunGrad.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.34 : 0.42})`);
  sunGrad.addColorStop(1, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.16 : 0.22})`);
  ctx.fillStyle = sunGrad;
  ctx.fillRect(sunX - sunR, sunY - sunR, sunR * 2, sunR * 2);
  // Cortes horizontales estilo osciloscopio retro
  ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
  for (let i = 0; i < 6; i += 1) {
    const sy = sunY + sunR * (0.05 + i * 0.16);
    ctx.fillRect(sunX - sunR, sy, sunR * 2, 2 + i * 1.1);
  }
  ctx.restore();

  // Malla 3D en perspectiva de montañas (pintadas de atrás hacia adelante con oclusión)
  const rows = 18;
  const cols = 30;
  const fov = Math.min(ancho, alto) * 0.72;
  const speedZ = t * 1.35;
  const zOffset = speedZ % 1;
  const rowIndexShift = Math.floor(speedZ);

  const project = (wx: number, wy: number, wz: number) => {
    const scale = fov / Math.max(0.6, wz);
    return {
      x: ancho * 0.5 + (wx - (mouse.x - 0.5) * 3.5) * scale,
      y: horizonY + (wy + 2.4) * scale,
    };
  };

  for (let r = rows; r >= 1; r -= 1) {
    const wz = r - zOffset + 1.2;
    const worldRow = r + rowIndexShift;
    const pts: { x: number; y: number; boost: number }[] = [];

    for (let c = 0; c <= cols; c += 1) {
      const u = c / cols - 0.5;
      const wx = u * 26;
      // Valle suave en el centro para legibilidad + picos dramáticos en los costados
      const valley = Math.min(1, Math.abs(u) * 2.4);
      const ridge =
        (Math.sin(wx * 0.42 + worldRow * 0.38) * 1.25 +
          Math.cos(wx * 0.85 - worldRow * 0.24) * 0.72 +
          Math.sin((wx + worldRow) * 0.28) * 0.85) *
        (0.45 + valley * 1.15);

      const baseP = project(wx, -Math.max(-0.5, ridge), wz);

      // Sonar sísmico 3D exclusivo al tocar el fondo
      let boost = 0;
      for (const tap of taps) {
        const p = (t - tap.born) / 2.2;
        if (p < 0 || p > 1) continue;
        const d = Math.hypot(baseP.x - tap.x, baseP.y - tap.y);
        const wave = 12 + p * 420;
        const band = Math.abs(d - wave);
        if (band < 68) {
          boost = Math.max(boost, (1 - band / 68) * (1 - p));
        }
      }

      const lifted = boost > 0.02 ? project(wx, -Math.max(-0.5, ridge + boost * 1.65), wz) : baseP;
      pts.push({ x: lifted.x, y: lifted.y, boost });
    }

    // Polígono de oclusión con el fondo del tema para ocultar montañas lejanas
    ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, alto + 10);
    for (let c = 0; c < pts.length; c += 1) {
      ctx.lineTo(pts[c].x, pts[c].y);
    }
    ctx.lineTo(pts[pts.length - 1].x, alto + 10);
    ctx.closePath();
    ctx.fill();

    // Cresta wireframe con brillo de escáner
    const depthAlpha = Math.max(0.08, (1 - r / rows) * (esClaro ? 0.36 : 0.44));
    const isScanRow = Math.abs((t * 6) % rows - r) < 1.1;

    for (let c = 0; c < pts.length - 1; c += 1) {
      const a = pts[c];
      const b = pts[c + 1];
      const bMax = Math.max(a.boost, b.boost);
      const col = bMax > 0.08 || isScanRow ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;
      const lineA = Math.min(0.95, depthAlpha + (isScanRow ? 0.35 : 0) + bMax * 0.72);
      ctx.strokeStyle = `rgba(${col}, ${lineA.toFixed(3)})`;
      ctx.lineWidth = bMax > 0.12 || isScanRow ? 2 : 1.1;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
}

// ============================================================================
// 5. DUNAS DITHER (Anthropic Dither Dunes — matriz Bayer 4×4 1-bit auténtica)
// ============================================================================
export function dibujarDunasDither(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  t: number,
  pal: WorldPalette,
  taps: WorldTap[],
  state: WorldState,
  mouse: { x: number; y: number },
) {
  const { bgR, bgG, bgB, pR, pG, pB, sR, sG, sB, esClaro } = pal;
  if (!state.ditherCanvas || !state.ditherCtx) return;

  // Buffer de baja resolución pixelada (escala 4×) para dithering 1-bit súper nítido
  const scale = ancho < 640 ? 5 : 4;
  const bw = Math.max(80, Math.ceil(ancho / scale));
  const bh = Math.max(60, Math.ceil(alto / scale));
  if (state.ditherCanvas.width !== bw || state.ditherCanvas.height !== bh) {
    state.ditherCanvas.width = bw;
    state.ditherCanvas.height = bh;
  }

  const dctx = state.ditherCtx;
  const img = dctx.createImageData(bw, bh);
  const data = img.data;

  const sunX = bw * (0.8 + (mouse.x - 0.5) * 0.05);
  const sunY = bh * 0.24;
  const sunR = Math.min(bw, bh) * 0.16;

  // Precomputar alturas de 3 capas de dunas paralaje
  const dune1 = new Float32Array(bw);
  const dune2 = new Float32Array(bw);
  const dune3 = new Float32Array(bw);
  for (let x = 0; x < bw; x += 1) {
    const u = x / bw;
    dune1[x] = bh * (0.56 + Math.sin(u * 4.2 + t * 0.12) * 0.06 + Math.cos(u * 8.1) * 0.025);
    dune2[x] = bh * (0.69 + Math.sin(u * 3.4 - t * 0.18 + 1.4) * 0.07 + Math.cos(u * 6.5) * 0.02);
    dune3[x] = bh * (0.83 + Math.sin(u * 5.0 + t * 0.26 + 2.7) * 0.065);
  }

  // Precalcular toques escalados al buffer pixelado
  const scaledTaps = taps
    .map((tp) => ({
      x: tp.x / scale,
      y: tp.y / scale,
      p: (t - tp.born) / 2.2,
    }))
    .filter((tp) => tp.p >= 0 && tp.p <= 1);

  for (let y = 0; y < bh; y += 1) {
    const bayerRow = BAYER_4X4[y & 3];
    for (let x = 0; x < bw; x += 1) {
      const idx = (y * bw + x) * 4;
      const threshold = (bayerRow[x & 3] + 0.5) / 16;

      // Intensidad del sol/luna dithered + capas de dunas
      const dSun = Math.hypot(x - sunX, y - sunY);
      let primaryProb = 0;
      let secondaryProb = 0;

      if (dSun < sunR * 2.2) {
        primaryProb = Math.max(primaryProb, Math.pow(Math.max(0, 1 - dSun / (sunR * 2.2)), 1.35) * 0.72);
      }

      if (y >= dune3[x]) {
        const depth = Math.min(1, (y - dune3[x]) / (bh * 0.16));
        primaryProb = Math.max(primaryProb, 0.35 + depth * 0.34);
      } else if (y >= dune2[x]) {
        const depth = Math.min(1, (y - dune2[x]) / (bh * 0.18));
        secondaryProb = Math.max(secondaryProb, 0.24 + depth * 0.3);
      } else if (y >= dune1[x]) {
        const depth = Math.min(1, (y - dune1[x]) / (bh * 0.2));
        primaryProb = Math.max(primaryProb, 0.14 + depth * 0.2);
      }

      // Animación exclusiva de toque: Espejismo dithered en 1-bit + chispas de arena
      for (const tp of scaledTaps) {
        const dist = Math.hypot(x - tp.x, y - tp.y);
        const waveR = 5 + tp.p * 78;
        const band = Math.abs(dist - waveR);
        if (band < 14) {
          const boost = (1 - band / 14) * (1 - tp.p) * 0.9;
          if (dist < waveR) secondaryProb = Math.max(secondaryProb, boost);
          else primaryProb = Math.max(primaryProb, boost);
        }
      }

      // Mezclar tinta sobre el fondo manteniendo suavidad editorial
      const mixA = esClaro ? 0.42 : 0.48;
      if (primaryProb > threshold && primaryProb >= secondaryProb) {
        data[idx] = Math.round(bgR + (pR - bgR) * mixA);
        data[idx + 1] = Math.round(bgG + (pG - bgG) * mixA);
        data[idx + 2] = Math.round(bgB + (pB - bgB) * mixA);
        data[idx + 3] = 255;
      } else if (secondaryProb > threshold) {
        data[idx] = Math.round(bgR + (sR - bgR) * mixA);
        data[idx + 1] = Math.round(bgG + (sG - bgG) * mixA);
        data[idx + 2] = Math.round(bgB + (sB - bgB) * mixA);
        data[idx + 3] = 255;
      } else {
        data[idx] = bgR;
        data[idx + 1] = bgG;
        data[idx + 2] = bgB;
        data[idx + 3] = 255;
      }
    }
  }

  dctx.putImageData(img, 0, 0);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(state.ditherCanvas, 0, 0, ancho, alto);
  ctx.restore();
}

// ============================================================================
// 6. LLUVIA NEÓN (Rainy Window + Wired Dusk — lluvia, skyline, cables + gotas)
// ============================================================================
export function dibujarLluviaNeon(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  t: number,
  pal: WorldPalette,
  taps: WorldTap[],
  state: WorldState,
  estatico: boolean,
) {
  const { bgR, bgG, bgB, pR, pG, pB, sR, sG, sB, esClaro } = pal;
  ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
  ctx.fillRect(0, 0, ancho, alto);

  // Horizonte crepuscular bokeh suave
  const skyGrad = ctx.createLinearGradient(0, 0, 0, alto);
  skyGrad.addColorStop(0, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.08 : 0.1})`);
  skyGrad.addColorStop(0.65, `rgba(${bgR}, ${bgG}, ${bgB}, 0)`);
  skyGrad.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.14 : 0.16})`);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, ancho, alto);

  // Cables de luz catenarios en la parte superior con pulsos eléctricos (Wired Dusk)
  for (let w = 0; w < 2; w += 1) {
    const yL = alto * (0.12 + w * 0.06);
    const yR = alto * (0.16 + w * 0.07);
    const sag = alto * (0.23 + w * 0.07);
    const col = w === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    ctx.strokeStyle = `rgba(${col}, ${esClaro ? 0.22 : 0.24})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, yL);
    ctx.quadraticCurveTo(ancho * 0.5, sag, ancho, yR);
    ctx.stroke();

    // Pulso de señal viajando por el cable
    const u = (t * (0.24 + w * 0.11) + w * 0.45) % 1;
    const inv = 1 - u;
    const px = inv * inv * 0 + 2 * inv * u * (ancho * 0.5) + u * u * ancho;
    const py = inv * inv * yL + 2 * inv * u * sag + u * u * yR;
    ctx.fillStyle = `rgba(${col}, 0.85)`;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Silueta de ciudad pixelada al fondo inferior con ventanas encendidas
  for (const b of state.cityBuildings) {
    const bx = b.xNorm * ancho;
    const bw = b.wNorm * ancho;
    const bh = b.hNorm * alto;
    const by = alto - bh;

    ctx.fillStyle = esClaro ? `rgba(${sR}, ${sG}, ${sB}, 0.12)` : 'rgba(6, 10, 20, 0.48)';
    ctx.fillRect(bx, by, bw, bh);

    // Ventanas encendidas discretas
    const colsW = Math.max(2, Math.floor(bw / 14));
    const rowsW = Math.max(2, Math.floor(bh / 18));
    for (let r = 0; r < rowsW; r += 1) {
      for (let c = 0; c < colsW; c += 1) {
        const h = (b.seed + r * 11 + c * 7) % 10;
        if (h < 3) {
          const lit = h === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
          const flicker = 0.28 + 0.18 * Math.sin(t * 1.4 + b.seed + r);
          ctx.fillStyle = `rgba(${lit}, ${flicker.toFixed(3)})`;
          ctx.fillRect(bx + 5 + c * 12, by + 8 + r * 15, 5, 7);
        }
      }
    }
  }

  // Lluvia diagonal cayendo sobre la ventana
  ctx.lineWidth = 1.1;
  ctx.lineCap = 'round';
  for (const d of state.rainDrops) {
    const ry = (((d.y + (estatico ? 0 : t * d.speed)) % 1) + 1) % 1 * alto;
    const rx = (((d.x - (estatico ? 0 : t * d.speed * 0.22)) % 1) + 1) % 1 * ancho;
    ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${(d.alpha * (esClaro ? 1.1 : 1)).toFixed(3)})`;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx - d.len * 0.22, ry + d.len);
    ctx.stroke();
  }

  // Animación exclusiva de toque: Salpicadura + gotas físicas resbalando por el cristal
  for (const tap of taps) {
    const p = (t - tap.born) / 1.1;
    if (p < 0 || p > 1) continue;
    const fade = 1 - p;
    ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.65).toFixed(3)})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(tap.x, tap.y, 6 + p * 38, 0, Math.PI * 2);
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
      bead.vy = Math.min(95, bead.vy + 1.4);
      bead.y += bead.vy * 0.016;
      bead.x += Math.sin(t * 5 + i) * 0.35;
      if (bead.r > 4) {
        bead.trail.push({ x: bead.x, y: bead.y });
        if (bead.trail.length > 28) bead.trail.shift();
      }
    }
    const fade = age > 3.2 ? (4.2 - age) : 1;

    // Estela húmeda en el cristal
    if (bead.trail.length > 1) {
      ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${(fade * 0.34).toFixed(3)})`;
      ctx.lineWidth = bead.r * 0.55;
      ctx.beginPath();
      for (let k = 0; k < bead.trail.length; k += 1) {
        const pt = bead.trail[k];
        if (k === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
    }

    // Gota translúcida con reflejo especular
    ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * (esClaro ? 0.42 : 0.5)).toFixed(3)})`;
    ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${(fade * 0.78).toFixed(3)})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(bead.x, bead.y, bead.r * 0.88, bead.r * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 255, 255, ${(fade * 0.75).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(bead.x - bead.r * 0.28, bead.y - bead.r * 0.32, bead.r * 0.24, 0, Math.PI * 2);
    ctx.fill();
  }
}
