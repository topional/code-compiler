import type { Point2D, WorldPalette, WorldTap } from './types';

export interface NatureWorldState {
  kois: {
    x: number;
    y: number;
    angle: number;
    spine: Point2D[];
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
  fireflies: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    fase: number;
    sec: boolean;
    r: number;
    trail: Point2D[];
  }[];
  lanterns: { x: number; y: number; born: number; sway: number }[];
  grassBlades: { xNorm: number; h: number; lean: number; fase: number; hasFlower: boolean }[];
}

export function crearEstadoNaturaleza(ancho: number, alto: number): NatureWorldState {
  const initKoi = (x: number, y: number, angle: number, size: number, sec: boolean, phase: number) => ({
    x,
    y,
    angle,
    spine: Array.from({ length: 14 }, (_, i) => ({
      x: x - Math.cos(angle) * i * (size * 0.42),
      y: y - Math.sin(angle) * i * (size * 0.42),
    })),
    size,
    sec,
    phase,
    speed: sec ? 34 : 42,
    targetX: x + 160,
    targetY: y + 60,
    retargetAt: 0,
  });

  return {
    kois: [
      initKoi(ancho * 0.78, alto * 0.24, 2.5, 16.5, false, 0),
      initKoi(ancho * 0.16, alto * 0.72, -0.45, 14.5, true, 2.7),
      initKoi(ancho * 0.88, alto * 0.8, 3.6, 12.5, false, 5.1),
    ],
    lilyPads: [
      { xNorm: 0.92, yNorm: 0.15, r: 38, notch: 2.3, hasLotus: true, phase: 0.3 },
      { xNorm: 0.86, yNorm: 0.22, r: 24, notch: 1.1, hasLotus: false, phase: 1.7 },
      { xNorm: 0.07, yNorm: 0.82, r: 42, notch: -0.6, hasLotus: true, phase: 2.6 },
      { xNorm: 0.14, yNorm: 0.9, r: 26, notch: 0.7, hasLotus: false, phase: 4.1 },
      { xNorm: 0.05, yNorm: 0.22, r: 22, notch: 0.2, hasLotus: false, phase: 5.2 },
    ],
    fireflies: Array.from({ length: 44 }, (_, i) => {
      const ang = (i / 44) * Math.PI * 2;
      return {
        x: (((i * 43.7 + 13) % 100) / 100) * Math.max(320, ancho),
        y: (((i * 29.3 + 19) % 100) / 100) * Math.max(320, alto),
        vx: Math.cos(ang) * 32,
        vy: Math.sin(ang) * 32,
        fase: i * 0.77,
        sec: i % 3 === 0,
        r: 2.0 + (i % 3) * 0.85,
        trail: [],
      };
    }),
    lanterns: [],
    grassBlades: Array.from({ length: 58 }, (_, i) => ({
      xNorm: (i + 0.3) / 58,
      h: 22 + ((i * 17 + 5) % 8) * 6,
      lean: ((i % 5) - 2) * 3.5,
      fase: i * 0.41,
      hasFlower: i % 9 === 2,
    })),
  };
}

export function registrarToqueNaturaleza(
  modo: string,
  state: NatureWorldState,
  x: number,
  y: number,
  tiempo: number,
) {
  if (modo === 'koi') {
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
      best.retargetAt = tiempo + 4.8;
    }
  } else if (modo === 'luciernagas') {
    state.lanterns.push({ x, y, born: tiempo, sway: (x * 0.03) % 6.28 });
    if (state.lanterns.length > 5) state.lanterns.shift();
  }
}

// ============================================================================
// 1. ESTANQUE KOI — Mosaico japonés + 3 peces Koi detallados + nenúfares con venas
// ============================================================================
export function dibujarEstanqueKoi(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  t: number,
  pal: WorldPalette,
  taps: WorldTap[],
  state: NatureWorldState,
  mouse: Point2D,
  estatico: boolean,
) {
  const { bgR, bgG, bgB, pR, pG, pB, sR, sG, sB, esClaro } = pal;
  ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
  ctx.fillRect(0, 0, ancho, alto);

  // Suelo de mosaico sumergido + cáusticas solares en agua
  const tile = ancho < 640 ? 28 : 24;
  const cols = Math.ceil(ancho / tile);
  const rows = Math.ceil(alto / tile);
  for (let r = 0; r < rows; r += 1) {
    const cy = r * tile + tile * 0.5;
    for (let c = 0; c < cols; c += 1) {
      const cx = c * tile + tile * 0.5;
      const caustic =
        Math.sin(c * 0.34 + t * 0.65) * Math.cos(r * 0.31 - t * 0.52) +
        Math.sin((c - r) * 0.19 + t * 0.38) * 0.55;
      let alpha = caustic > 0.62 ? (caustic - 0.62) * (esClaro ? 0.085 : 0.095) : 0;

      for (const tap of taps) {
        const p = (t - tap.born) / 2.8;
        if (p < 0 || p > 1) continue;
        const d = Math.hypot(cx - tap.x, cy - tap.y);
        const w1 = Math.abs(d - (12 + p * 310));
        const w2 = Math.abs(d - Math.max(0, p * 310 - 52));
        if (w1 < 22) alpha = Math.max(alpha, (1 - w1 / 22) * (1 - p) * (esClaro ? 0.24 : 0.3));
        if (w2 < 18) alpha = Math.max(alpha, (1 - w2 / 18) * (1 - p) * (esClaro ? 0.16 : 0.22));
      }

      if (alpha > 0.012) {
        ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${alpha.toFixed(3)})`;
        ctx.fillRect(c * tile + 2, r * tile + 2, tile - 4, tile - 4);
      }
    }
  }

  // Piedras lisas sumergidas en las esquinas inferiores
  for (const [rx, ry, rr] of [
    [ancho * 0.06, alto * 0.91, 46],
    [ancho * 0.11, alto * 0.95, 32],
    [ancho * 0.93, alto * 0.12, 42],
  ]) {
    ctx.fillStyle = esClaro ? `rgba(${sR}, ${sG}, ${sB}, 0.07)` : 'rgba(255, 255, 255, 0.035)';
    ctx.beginPath();
    ctx.ellipse(rx, ry, rr * 1.2, rr * 0.85, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Física y render anatómico de cada pez Koi
  for (const koi of state.kois) {
    if (!estatico) {
      if (t > koi.retargetAt || Math.hypot(koi.targetX - koi.x, koi.targetY - koi.y) < 40) {
        const idx = Math.floor((t * 0.28 + koi.phase) % 4);
        const puntos = [
          [ancho * 0.85, alto * 0.22],
          [ancho * 0.15, alto * 0.78],
          [ancho * 0.87, alto * 0.78],
          [ancho * 0.17, alto * 0.24],
        ];
        const pt = puntos[(idx + (koi.sec ? 2 : 0)) % 4];
        koi.targetX = pt[0] + Math.sin(t + koi.phase) * 75;
        koi.targetY = pt[1] + Math.cos(t * 0.8 + koi.phase) * 55;
        koi.retargetAt = t + 5.5;
      }

      const desired = Math.atan2(koi.targetY - koi.y, koi.targetX - koi.x);
      let diff = desired - koi.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      koi.angle += diff * 0.034;

      const sway = Math.sin(t * 4.6 + koi.phase) * 0.11;
      const moveAng = koi.angle + sway;
      koi.x += Math.cos(moveAng) * koi.speed * 0.016;
      koi.y += Math.sin(moveAng) * koi.speed * 0.016;

      if (koi.x < -70) koi.x = ancho + 60;
      if (koi.x > ancho + 70) koi.x = -60;
      if (koi.y < -70) koi.y = alto + 60;
      if (koi.y > alto + 70) koi.y = -60;

      koi.spine[0].x = koi.x;
      koi.spine[0].y = koi.y;
      const segLen = koi.size * 0.44;
      for (let i = 1; i < koi.spine.length; i += 1) {
        const prev = koi.spine[i - 1];
        const cur = koi.spine[i];
        const ang = Math.atan2(cur.y - prev.y, cur.x - prev.x);
        const wave = Math.sin(t * 6.0 - i * 0.52 + koi.phase) * (i * 0.017);
        cur.x = prev.x + Math.cos(ang + wave) * segLen;
        cur.y = prev.y + Math.sin(ang + wave) * segLen;
      }
    }

    const bodyCol = koi.sec ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;
    const spotCol = koi.sec ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    const pearlCol = esClaro ? '255, 255, 255' : '244, 248, 255';

    // Sombra suave proyectada en el fondo del estanque
    for (let i = koi.spine.length - 1; i >= 0; i -= 1) {
      const seg = koi.spine[i];
      const u = i / (koi.spine.length - 1);
      const rad = koi.size * Math.sin(Math.pow(1 - u, 0.7) * Math.PI * 0.85) * 0.72;
      ctx.fillStyle = esClaro ? 'rgba(0,0,0,0.065)' : 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.arc(seg.x + 10, seg.y + 14, Math.max(2, rad), 0, Math.PI * 2);
      ctx.fill();
    }

    const sh = koi.spine[2];
    const headAng = Math.atan2(koi.spine[0].y - sh.y, koi.spine[0].x - sh.x);
    const finFlutter = Math.sin(t * 5.2 + koi.phase) * 0.28;

    // Aletas pectorales con radios finos
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(sh.x, sh.y);
      ctx.rotate(headAng + side * (1.12 + finFlutter));
      ctx.fillStyle = `rgba(${pearlCol}, ${esClaro ? 0.36 : 0.24})`;
      ctx.strokeStyle = `rgba(${bodyCol}, ${esClaro ? 0.45 : 0.55})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(koi.size * 0.7, 0, koi.size * 0.84, koi.size * 0.34, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Aletas pélvicas (segmento 6)
    const pel = koi.spine[6];
    const pelAng = Math.atan2(koi.spine[5].y - pel.y, koi.spine[5].x - pel.x);
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(pel.x, pel.y);
      ctx.rotate(pelAng + side * (1.25 - finFlutter * 0.6));
      ctx.fillStyle = `rgba(${bodyCol}, ${esClaro ? 0.26 : 0.32})`;
      ctx.beginPath();
      ctx.ellipse(koi.size * 0.38, 0, koi.size * 0.45, koi.size * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Cola caudal en abanico con nervaduras
    const tail = koi.spine[koi.spine.length - 1];
    const preTail = koi.spine[koi.spine.length - 2];
    const tailAng = Math.atan2(tail.y - preTail.y, tail.x - preTail.x);
    ctx.save();
    ctx.translate(tail.x, tail.y);
    ctx.rotate(tailAng);
    ctx.fillStyle = `rgba(${bodyCol}, ${esClaro ? 0.38 : 0.48})`;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(koi.size * 0.85, -koi.size * 0.75, koi.size * 1.32, -koi.size * 0.52);
    ctx.quadraticCurveTo(koi.size * 0.6, 0, koi.size * 1.32, koi.size * 0.52);
    ctx.quadraticCurveTo(koi.size * 0.85, koi.size * 0.75, 0, 0);
    ctx.fill();
    ctx.restore();

    // Cuerpo calico con gradación de escamas
    for (let i = koi.spine.length - 1; i >= 0; i -= 1) {
      const seg = koi.spine[i];
      const u = i / (koi.spine.length - 1);
      const rad = Math.max(2.4, koi.size * Math.sin(Math.pow(1 - u, 0.7) * Math.PI * 0.86) * 0.75);
      const esMancha = i === 1 || i === 4 || i === 5 || i === 9;
      const esPerla = i === 2 || i === 3 || i === 7 || i === 8;
      ctx.fillStyle = esPerla
        ? `rgba(${pearlCol}, ${esClaro ? 0.78 : 0.66})`
        : esMancha
          ? `rgba(${bodyCol}, ${esClaro ? 0.82 : 0.86})`
          : `rgba(${spotCol}, ${esClaro ? 0.65 : 0.72})`;
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cresta de aleta dorsal a lo largo del lomo
    ctx.strokeStyle = `rgba(${pearlCol}, ${esClaro ? 0.55 : 0.48})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let i = 3; i <= 9; i += 1) {
      const s = koi.spine[i];
      if (i === 3) ctx.moveTo(s.x, s.y);
      else ctx.lineTo(s.x, s.y);
    }
    ctx.stroke();

    // Bigotes (barbels) y ojos en la cabeza
    const hd = koi.spine[0];
    ctx.strokeStyle = `rgba(${bodyCol}, 0.7)`;
    ctx.lineWidth = 1;
    for (const side of [-1, 1]) {
      const bx = hd.x + Math.cos(headAng + side * 0.42) * (koi.size * 0.55);
      const by = hd.y + Math.sin(headAng + side * 0.42) * (koi.size * 0.55);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(
        bx + Math.cos(headAng + side * 0.9) * 8,
        by + Math.sin(headAng + side * 0.9) * 8,
        bx + Math.cos(headAng + side * 1.4) * 11,
        by + Math.sin(headAng + side * 1.4) * 11,
      );
      ctx.stroke();

      const ex = hd.x + Math.cos(headAng + side * 0.68) * (koi.size * 0.44);
      const ey = hd.y + Math.sin(headAng + side * 0.68) * (koi.size * 0.44);
      ctx.fillStyle = esClaro ? 'rgba(15,23,42,0.82)' : 'rgba(6,10,20,0.94)';
      ctx.beginPath();
      ctx.arc(ex, ey, 1.85, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Nenúfares detallados con nervaduras radiales y flores de loto de doble corona
  for (const pad of state.lilyPads) {
    const px = pad.xNorm * ancho + Math.sin(t * 0.55 + pad.phase) * 6;
    const py = pad.yNorm * alto + Math.cos(t * 0.48 + pad.phase) * 5;
    const rot = pad.notch + Math.sin(t * 0.3 + pad.phase) * 0.12;

    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);

    // Sombra bajo la hoja
    ctx.fillStyle = esClaro ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.arc(4, 6, pad.r, 0.28, Math.PI * 2 - 0.28);
    ctx.lineTo(4, 6);
    ctx.fill();

    // Hoja de nenúfar
    ctx.fillStyle = esClaro ? 'rgba(34, 139, 94, 0.25)' : 'rgba(52, 211, 153, 0.16)';
    ctx.strokeStyle = esClaro ? 'rgba(20, 108, 70, 0.42)' : 'rgba(52, 211, 153, 0.34)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, pad.r, 0.28, Math.PI * 2 - 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Nervaduras radiales de la hoja
    ctx.strokeStyle = esClaro ? 'rgba(20, 108, 70, 0.22)' : 'rgba(167, 243, 208, 0.16)';
    ctx.lineWidth = 0.85;
    for (let v = 1; v <= 7; v += 1) {
      const va = 0.45 + (v / 8) * (Math.PI * 2 - 0.9);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(va) * pad.r * 0.88, Math.sin(va) * pad.r * 0.88);
      ctx.stroke();
    }

    // Flor de loto de doble capa (10 pétalos externos + 6 internos)
    if (pad.hasLotus) {
      const petalR = pad.r * 0.36;
      for (let k = 0; k < 10; k += 1) {
        ctx.save();
        ctx.rotate((k / 10) * Math.PI * 2 + t * 0.06);
        ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.5 : 0.55})`;
        ctx.beginPath();
        ctx.ellipse(petalR * 0.72, 0, petalR * 0.76, petalR * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      for (let k = 0; k < 6; k += 1) {
        ctx.save();
        ctx.rotate((k / 6) * Math.PI * 2 + 0.3 + t * 0.06);
        ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.58 : 0.65})`;
        ctx.beginPath();
        ctx.ellipse(petalR * 0.44, 0, petalR * 0.48, petalR * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, 0.92)`;
      ctx.beginPath();
      ctx.arc(0, 0, pad.r * 0.13, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Ondas concéntricas nítidas en cada toque
  for (const tap of taps) {
    const p = (t - tap.born) / 2.8;
    if (p < 0 || p > 1) continue;
    const fade = 1 - p;
    for (let ring = 0; ring < 3; ring += 1) {
      const rp = Math.max(0, p - ring * 0.12);
      if (rp <= 0) continue;
      const rad = 10 + rp * 250;
      const col = ring % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
      ctx.strokeStyle = `rgba(${col}, ${(fade * (0.64 - ring * 0.15)).toFixed(3)})`;
      ctx.lineWidth = 1.9 - ring * 0.35;
      ctx.beginPath();
      ctx.arc(tap.x, tap.y, rad, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const gCursor = ctx.createRadialGradient(mouse.x * ancho, mouse.y * alto, 0, mouse.x * ancho, mouse.y * alto, 110);
  gCursor.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.06 : 0.08})`);
  gCursor.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, 0)`);
  ctx.fillStyle = gCursor;
  ctx.fillRect(0, 0, ancho, alto);
}

// ============================================================================
// 2. LUCIÉRNAGAS PRADERA — Torii japonés + hierba meciendo + Boids + farolillos flotantes
// ============================================================================
export function dibujarPraderaLuciernagas(
  ctx: CanvasRenderingContext2D,
  ancho: number,
  alto: number,
  t: number,
  pal: WorldPalette,
  taps: WorldTap[],
  state: NatureWorldState,
  mouse: Point2D,
  estatico: boolean,
) {
  const { bgR, bgG, bgB, pR, pG, pB, sR, sG, sB, esClaro } = pal;
  ctx.fillStyle = `rgb(${bgR}, ${bgG}, ${bgB})`;
  ctx.fillRect(0, 0, ancho, alto);

  // Silueta de puerta Torii japonesa en el margen inferior izquierdo
  const tx = ancho * 0.09;
  const ty = alto;
  ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.18 : 0.16})`;
  ctx.fillRect(tx - 28, ty - 92, 7, 92);
  ctx.fillRect(tx + 21, ty - 92, 7, 92);
  ctx.fillRect(tx - 38, ty - 76, 76, 6);
  // Travesaño superior curvo (kasagi)
  ctx.beginPath();
  ctx.moveTo(tx - 46, ty - 95);
  ctx.quadraticCurveTo(tx, ty - 85, tx + 46, ty - 95);
  ctx.lineTo(tx + 42, ty - 86);
  ctx.quadraticCurveTo(tx, ty - 79, tx - 42, ty - 86);
  ctx.closePath();
  ctx.fill();

  // Hierba alta meciendo suavemente a lo largo del borde inferior + flores diminutas
  for (const gb of state.grassBlades) {
    const gx = gb.xNorm * ancho;
    const bend = gb.lean + Math.sin(t * 1.4 + gb.fase) * 7;
    ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.24 : 0.2})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(gx, alto);
    ctx.quadraticCurveTo(gx + bend * 0.5, alto - gb.h * 0.55, gx + bend, alto - gb.h);
    ctx.stroke();

    if (gb.hasFlower) {
      ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.5 : 0.58})`;
      ctx.beginPath();
      ctx.arc(gx + bend, alto - gb.h, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Farolillos flotantes de papel nacidos en cada toque (suben despacio atrayendo luciérnagas)
  let activeLantern: Point2D | null = null;
  for (let i = state.lanterns.length - 1; i >= 0; i -= 1) {
    const ln = state.lanterns[i];
    const age = t - ln.born;
    if (age > 6.0) {
      state.lanterns.splice(i, 1);
      continue;
    }
    const ly = ln.y - age * 26;
    const lx = ln.x + Math.sin(t * 1.3 + ln.sway) * 16;
    const fade = age > 4.6 ? (6.0 - age) / 1.4 : Math.min(1, age * 4);
    activeLantern = { x: lx, y: ly };

    const lg = ctx.createRadialGradient(lx, ly, 2, lx, ly, 52);
    lg.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.42).toFixed(3)})`);
    lg.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, 0)`);
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(lx, ly, 52, 0, Math.PI * 2);
    ctx.fill();

    // Cuerpo del farolillo de papel
    ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.78).toFixed(3)})`;
    ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${(fade * 0.85).toFixed(3)})`;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(lx - 8, ly - 11, 16, 20, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = `rgba(255, 255, 255, ${(fade * 0.75).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(lx, ly + 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Enjambre de 44 luciérnagas con física Boids + estelas luminosas
  const mx = mouse.x * ancho;
  const my = mouse.y * alto;
  const flies = state.fireflies;
  for (let i = 0; i < flies.length; i += 1) {
    const f = flies[i];
    if (!estatico) {
      let ax = Math.sin(t * 0.75 + f.fase) * 16;
      let ay = Math.cos(t * 0.65 + f.fase * 1.2) * 16;

      if (activeLantern) {
        const dx = activeLantern.x - f.x;
        const dy = activeLantern.y - f.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 22 && dist < 440) {
          ax += (dx / dist) * 110 - (dy / dist) * 72;
          ay += (dy / dist) * 110 + (dx / dist) * 72;
        }
      } else {
        const dmx = mx - f.x;
        const dmy = my - f.y;
        const dm = Math.hypot(dmx, dmy);
        if (dm > 30 && dm < 240) {
          ax += (dmx / dm) * 28;
          ay += (dmy / dm) * 28;
        }
      }

      f.vx = (f.vx + ax * 0.016) * 0.984;
      f.vy = (f.vy + ay * 0.016) * 0.984;
      const spd = Math.hypot(f.vx, f.vy);
      if (spd > 135) {
        f.vx = (f.vx / spd) * 135;
        f.vy = (f.vy / spd) * 135;
      }

      f.x = (f.x + f.vx * 0.016 + ancho) % Math.max(1, ancho);
      f.y = (f.y + f.vy * 0.016 + alto) % Math.max(1, alto);

      f.trail.push({ x: f.x, y: f.y });
      if (f.trail.length > 7) f.trail.shift();
    }

    const pulse = 0.38 + 0.62 * Math.sin(t * 2.8 + f.fase);
    const col = f.sec ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;

    // Estela de vuelo delicada
    if (f.trail.length > 1) {
      ctx.strokeStyle = `rgba(${col}, ${(pulse * 0.28).toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let k = 0; k < f.trail.length; k += 1) {
        const pt = f.trail[k];
        if (k === 0) ctx.moveTo(pt.x, pt.y);
        else if (Math.hypot(pt.x - f.trail[k - 1].x, pt.y - f.trail[k - 1].y) < 80) {
          ctx.lineTo(pt.x, pt.y);
        } else {
          ctx.moveTo(pt.x, pt.y);
        }
      }
      ctx.stroke();
    }

    const haloR = f.r * (4.4 + pulse * 2.4);
    const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, haloR);
    g.addColorStop(0, `rgba(${col}, ${(pulse * (esClaro ? 0.56 : 0.7)).toFixed(3)})`);
    g.addColorStop(1, `rgba(${col}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(f.x, f.y, haloR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(${col}, ${(0.55 + pulse * 0.45).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Onda cálida breve en el toque
  for (const tap of taps) {
    const p = (t - tap.born) / 1.4;
    if (p < 0 || p > 1) continue;
    ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${((1 - p) * 0.5).toFixed(3)})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(tap.x, tap.y, 12 + p * 65, 0, Math.PI * 2);
    ctx.stroke();
  }
}
