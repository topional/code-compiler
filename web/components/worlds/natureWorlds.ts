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
  sakuraPetals: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    rot: number;
    vRot: number;
    size: number;
    sec: boolean;
  }[];
  pellets: {
    x: number;
    y: number;
    born: number;
    r: number;
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
  lanterns: {
    x: number;
    y: number;
    born: number;
    sway: number;
  }[];
  grassBlades: {
    xNorm: number;
    h: number;
    lean: number;
    fase: number;
    hasFlower: boolean;
    back: boolean;
  }[];
  dandelionSeeds: {
    x: number;
    y: number;
    speed: number;
    sway: number;
    fase: number;
  }[];
}

export function crearEstadoNaturaleza(ancho: number, alto: number): NatureWorldState {
  const initKoi = (x: number, y: number, angle: number, size: number, sec: boolean, phase: number) => ({
    x,
    y,
    angle,
    spine: Array.from({ length: 16 }, (_, i) => ({
      x: x - Math.cos(angle) * i * (size * 0.38),
      y: y - Math.sin(angle) * i * (size * 0.38),
    })),
    size,
    sec,
    phase,
    speed: sec ? 36 : 44,
    targetX: x + 160,
    targetY: y + 60,
    retargetAt: 0,
  });

  return {
    kois: [
      initKoi(ancho * 0.78, alto * 0.24, 2.5, 17, false, 0),
      initKoi(ancho * 0.16, alto * 0.72, -0.45, 15, true, 2.7),
      initKoi(ancho * 0.87, alto * 0.81, 3.6, 13, false, 5.1),
    ],
    lilyPads: [
      { xNorm: 0.92, yNorm: 0.15, r: 40, notch: 2.3, hasLotus: true, phase: 0.3 },
      { xNorm: 0.86, yNorm: 0.22, r: 25, notch: 1.1, hasLotus: false, phase: 1.7 },
      { xNorm: 0.07, yNorm: 0.82, r: 44, notch: -0.6, hasLotus: true, phase: 2.6 },
      { xNorm: 0.14, yNorm: 0.9, r: 27, notch: 0.7, hasLotus: false, phase: 4.1 },
      { xNorm: 0.05, yNorm: 0.23, r: 23, notch: 0.2, hasLotus: false, phase: 5.2 },
    ],
    sakuraPetals: Array.from({ length: 12 }, (_, i) => ({
      x: ((i * 83.7 + 7) % 100) / 100,
      y: ((i * 47.3 + 13) % 100) / 100,
      vx: 0.004 + (i % 3) * 0.0022,
      vy: 0.003 + (i % 4) * 0.0016,
      rot: i * 0.9,
      vRot: (i % 2 === 0 ? 1 : -1) * (0.4 + (i % 3) * 0.2),
      size: 3.8 + (i % 3) * 1.4,
      sec: i % 2 === 0,
    })),
    pellets: [],
    fireflies: Array.from({ length: 48 }, (_, i) => {
      const ang = (i / 48) * Math.PI * 2;
      return {
        x: (((i * 43.7 + 13) % 100) / 100) * Math.max(320, ancho),
        y: (((i * 29.3 + 19) % 100) / 100) * Math.max(320, alto),
        vx: Math.cos(ang) * 30,
        vy: Math.sin(ang) * 30,
        fase: i * 0.77,
        sec: i % 3 === 0,
        r: 2.0 + (i % 3) * 0.85,
        trail: [],
      };
    }),
    lanterns: [],
    grassBlades: Array.from({ length: 76 }, (_, i) => ({
      xNorm: (i + 0.25) / 76,
      h: 20 + ((i * 17 + 5) % 9) * 6.5,
      lean: ((i % 5) - 2) * 3.6,
      fase: i * 0.41,
      hasFlower: i % 8 === 2,
      back: i % 2 === 0,
    })),
    dandelionSeeds: Array.from({ length: 16 }, (_, i) => ({
      x: ((i * 61.3 + 9) % 100) / 100,
      y: ((i * 37.9 + 17) % 100) / 100,
      speed: 0.007 + (i % 4) * 0.003,
      sway: 14 + (i % 3) * 8,
      fase: i * 1.15,
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
    // Dispersar 5 bolitas flotantes de alimento que atraen al Koi más cercano
    for (let i = 0; i < 5; i += 1) {
      const ang = (i / 5) * Math.PI * 2 + tiempo;
      const dist = 6 + (i % 3) * 11;
      state.pellets.push({
        x: x + Math.cos(ang) * dist,
        y: y + Math.sin(ang) * dist,
        born: tiempo,
        r: 2.1 + (i % 2) * 0.7,
      });
    }
    if (state.pellets.length > 20) state.pellets.splice(0, state.pellets.length - 20);

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
      best.retargetAt = tiempo + 5.2;
    }
  } else if (modo === 'luciernagas') {
    state.lanterns.push({ x, y, born: tiempo, sway: (x * 0.03) % 6.28 });
    if (state.lanterns.length > 5) state.lanterns.shift();
  }
}

// ============================================================================
// 1. ESTANQUE KOI — Cáusticas de luz + guijarros + 3 Koi con sombra + pétalos sakura + libélula
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

  // 1. Profundidad del estanque con resplandor acuático suave
  const pondGrad = ctx.createRadialGradient(
    ancho * 0.5,
    alto * 0.45,
    ancho * 0.08,
    ancho * 0.5,
    alto * 0.5,
    Math.max(ancho, alto) * 0.72,
  );
  pondGrad.addColorStop(0, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.05 : 0.06})`);
  pondGrad.addColorStop(1, `rgba(${bgR}, ${bgG}, ${bgB}, 0)`);
  ctx.fillStyle = pondGrad;
  ctx.fillRect(0, 0, ancho, alto);

  // 2. Cáusticas de luz solar refractada ondulando suavemente por el agua
  ctx.save();
  ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.075 : 0.065})`;
  ctx.lineWidth = 1.3;
  for (let band = 0; band < 7; band += 1) {
    const baseY = alto * (0.1 + band * 0.14);
    ctx.beginPath();
    for (let x = 0; x <= ancho; x += 48) {
      const wave =
        Math.sin(x * 0.008 + t * 0.65 + band * 1.4) * 22 +
        Math.cos(x * 0.015 - t * 0.42 + band * 2.1) * 10;
      if (x === 0) ctx.moveTo(x, baseY + wave);
      else ctx.lineTo(x, baseY + wave);
    }
    ctx.stroke();
  }
  ctx.restore();

  // 3. Guijarros sumergidos y mosaico sutil en los bordes del estanque
  const stones = [
    { x: 0.06, y: 0.9, rx: 46, ry: 27, rot: 0.25 },
    { x: 0.12, y: 0.95, rx: 32, ry: 20, rot: -0.3 },
    { x: 0.92, y: 0.12, rx: 44, ry: 26, rot: -0.2 },
    { x: 0.96, y: 0.2, rx: 28, ry: 18, rot: 0.45 },
    { x: 0.89, y: 0.89, rx: 38, ry: 23, rot: 0.18 },
    { x: 0.04, y: 0.16, rx: 30, ry: 19, rot: -0.35 },
  ];
  for (const st of stones) {
    ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.09 : 0.065})`;
    ctx.beginPath();
    ctx.ellipse(ancho * st.x, alto * st.y, st.rx, st.ry, st.rot, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.12 : 0.09})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Mosaico japonés en las esquinas donde fluye la luz
  const tile = 24;
  const cols = Math.ceil(ancho / tile);
  const rows = Math.ceil(alto / tile);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const cx = c * tile + tile * 0.5;
      const cy = r * tile + tile * 0.5;
      const caust =
        Math.sin(c * 0.34 + t * 0.52) * Math.cos(r * 0.3 - t * 0.44) +
        Math.sin((c + r) * 0.2 + t * 0.35) * 0.45;
      if (caust > 0.68) {
        const edgeDist = Math.min(cx / ancho, 1 - cx / ancho, cy / alto, 1 - cy / alto);
        const edgeBoost = edgeDist < 0.22 ? 1.15 : 0.42;
        const a = (caust - 0.68) * (esClaro ? 0.13 : 0.1) * edgeBoost;
        ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${a.toFixed(3)})`;
        ctx.fillRect(c * tile + 2, r * tile + 2, tile - 4, tile - 4);
      }
    }
  }

  // 4. Bolitas de alimento flotantes (se disuelven cuando un Koi pasa cerca o tras 5s)
  for (let i = state.pellets.length - 1; i >= 0; i -= 1) {
    const pel = state.pellets[i];
    const age = t - pel.born;
    const eaten = state.kois.some((k) => Math.hypot(k.x - pel.x, k.y - pel.y) < k.size * 1.4);
    if (age > 5.5 || eaten) {
      state.pellets.splice(i, 1);
      continue;
    }
    const bobX = pel.x + Math.sin(t * 2.4 + i) * 2.2;
    const bobY = pel.y + Math.cos(t * 2.1 + i * 1.3) * 1.8;
    const fade = age > 4.2 ? (5.5 - age) / 1.3 : 1;
    ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.32).toFixed(3)})`;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(bobX, bobY, pel.r + 3 + Math.sin(t * 4 + i) * 1.6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.88).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(bobX, bobY, pel.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Ondas concéntricas de agua refractivas al tocar el fondo
  for (const tap of taps) {
    const p = (t - tap.born) / 2.6;
    if (p < 0 || p > 1) continue;
    const fade = 1 - p;
    for (let ring = 0; ring < 4; ring += 1) {
      const rp = Math.max(0, p - ring * 0.13);
      if (rp <= 0) continue;
      const rad = 10 + rp * 205;
      const col = ring % 2 === 0 ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
      ctx.strokeStyle = `rgba(${col}, ${(fade * (0.58 - ring * 0.12)).toFixed(3)})`;
      ctx.lineWidth = ring === 0 ? 2.1 : 1.15;
      ctx.beginPath();
      ctx.arc(tap.x, tap.y, rad, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 6. Peces Koi articulados (16 vértebras) con sombra sumergida, estela en V, aletas translúcidas y bigotes
  const dt = estatico ? 0 : 0.016;
  for (let ki = 0; ki < state.kois.length; ki += 1) {
    const koi = state.kois[ki];
    if (!estatico) {
      if (t > koi.retargetAt || Math.hypot(koi.targetX - koi.x, koi.targetY - koi.y) < 38) {
        const orbitAngle = t * (ki % 2 === 0 ? 0.3 : -0.25) + koi.phase;
        const anchorX = ki === 0 ? 0.8 : ki === 1 ? 0.18 : 0.85;
        const anchorY = ki === 0 ? 0.25 : ki === 1 ? 0.72 : 0.8;
        koi.targetX = ancho * (anchorX + Math.cos(orbitAngle) * 0.15);
        koi.targetY = alto * (anchorY + Math.sin(orbitAngle * 1.4) * 0.14);
        koi.retargetAt = t + 3.2;
      }

      const desired = Math.atan2(koi.targetY - koi.y, koi.targetX - koi.x);
      let diff = desired - koi.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      koi.angle += Math.max(-0.048, Math.min(0.048, diff * 0.055));

      const distToTarget = Math.hypot(koi.targetX - koi.x, koi.targetY - koi.y);
      const speedBoost = distToTarget > 200 ? 1.42 : 1;
      koi.x += Math.cos(koi.angle) * koi.speed * speedBoost * dt;
      koi.y += Math.sin(koi.angle) * koi.speed * speedBoost * dt;

      if (koi.x < -70) koi.x = ancho + 65;
      if (koi.x > ancho + 70) koi.x = -65;
      if (koi.y < -70) koi.y = alto + 65;
      if (koi.y > alto + 70) koi.y = -65;

      koi.spine[0].x = koi.x;
      koi.spine[0].y = koi.y;
      const segLen = koi.size * 0.36;
      for (let i = 1; i < koi.spine.length; i += 1) {
        const prev = koi.spine[i - 1];
        const curr = koi.spine[i];
        const ang = Math.atan2(curr.y - prev.y, curr.x - prev.x);
        const wag = Math.sin(t * 5.8 + koi.phase - i * 0.56) * (0.04 + i * 0.011);
        curr.x = prev.x + Math.cos(ang + wag) * segLen;
        curr.y = prev.y + Math.sin(ang + wag) * segLen;
      }
    }

    const colMain = koi.sec ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;
    const colAccent = koi.sec ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    const head = koi.spine[0];
    const neck = koi.spine[2];
    const headAng = Math.atan2(head.y - neck.y, head.x - neck.x);

    // Estela sutil en V sobre la superficie del agua
    ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.14 : 0.12})`;
    ctx.lineWidth = 1;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(head.x, head.y);
      ctx.quadraticCurveTo(
        head.x - Math.cos(headAng) * koi.size * 2.2 + Math.cos(headAng + side * 1.4) * koi.size * 1.2,
        head.y - Math.sin(headAng) * koi.size * 2.2 + Math.sin(headAng + side * 1.4) * koi.size * 1.2,
        head.x - Math.cos(headAng) * koi.size * 4.4 + Math.cos(headAng + side * 1.35) * koi.size * 2.3,
        head.y - Math.sin(headAng) * koi.size * 4.4 + Math.sin(headAng + side * 1.35) * koi.size * 2.3,
      );
      ctx.stroke();
    }

    // Sombra suave proyectada en el fondo del estanque (da sensación real de profundidad de agua)
    ctx.fillStyle = esClaro ? 'rgba(15, 23, 42, 0.1)' : 'rgba(0, 0, 0, 0.34)';
    for (let i = koi.spine.length - 1; i >= 0; i -= 1) {
      const pt = koi.spine[i];
      const frac = i / (koi.spine.length - 1);
      const radius = koi.size * Math.sin(Math.pow(1 - frac, 0.72) * Math.PI * 0.86) * 0.56;
      if (radius < 1.1) continue;
      ctx.beginPath();
      ctx.arc(pt.x + 9, pt.y + 13, radius * 1.04, 0, Math.PI * 2);
      ctx.fill();
    }

    // Aletas pectorales translúcidas con nervaduras (par delantero)
    const finAnchor = koi.spine[3];
    const finWave = Math.sin(t * 4.6 + koi.phase) * 0.28;
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(finAnchor.x, finAnchor.y);
      ctx.rotate(headAng + side * (1.06 + finWave));
      ctx.fillStyle = `rgba(${colAccent}, ${esClaro ? 0.34 : 0.38})`;
      ctx.strokeStyle = `rgba(255, 255, 255, ${esClaro ? 0.25 : 0.28})`;
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(koi.size * 0.9, side * koi.size * 0.55, koi.size * 1.32, side * koi.size * 0.14);
      ctx.quadraticCurveTo(koi.size * 0.65, -side * koi.size * 0.12, 0, 0);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Aletas ventrales pequeñas
    const pelvAnchor = koi.spine[7];
    for (const side of [-1, 1]) {
      ctx.save();
      ctx.translate(pelvAnchor.x, pelvAnchor.y);
      ctx.rotate(headAng + side * (1.28 - finWave * 0.5));
      ctx.fillStyle = `rgba(${colMain}, ${esClaro ? 0.28 : 0.3})`;
      ctx.beginPath();
      ctx.ellipse(koi.size * 0.38, 0, koi.size * 0.45, koi.size * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Aleta caudal bifurcada en velo translúcido
    const tailBase = koi.spine[koi.spine.length - 3];
    const tailTip = koi.spine[koi.spine.length - 1];
    const tailAng = Math.atan2(tailTip.y - tailBase.y, tailTip.x - tailBase.x);
    ctx.save();
    ctx.translate(tailTip.x, tailTip.y);
    ctx.rotate(tailAng);
    const tailGrad = ctx.createLinearGradient(0, 0, koi.size * 1.5, 0);
    tailGrad.addColorStop(0, `rgba(${colMain}, ${esClaro ? 0.55 : 0.64})`);
    tailGrad.addColorStop(1, `rgba(${colAccent}, 0.08)`);
    ctx.fillStyle = tailGrad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(koi.size * 0.75, -koi.size * 0.78, koi.size * 1.52, -koi.size * 0.58);
    ctx.quadraticCurveTo(koi.size * 0.85, 0, koi.size * 1.52, koi.size * 0.58);
    ctx.quadraticCurveTo(koi.size * 0.75, koi.size * 0.78, 0, 0);
    ctx.fill();
    ctx.restore();

    // Cuerpo principal del Koi (base nacarada + parches Kohaku/Sanke + brillo dorsal)
    for (let i = koi.spine.length - 1; i >= 0; i -= 1) {
      const pt = koi.spine[i];
      const frac = i / (koi.spine.length - 1);
      const radius = koi.size * Math.sin(Math.pow(1 - frac, 0.72) * Math.PI * 0.86) * 0.58;
      if (radius < 1.1) continue;

      const isSpot = i === 1 || i === 2 || i === 6 || i === 7 || i === 11;
      const isWhiteBand = i === 4 || i === 5 || i === 9 || i === 10;
      ctx.fillStyle = isWhiteBand
        ? esClaro
          ? 'rgba(255, 255, 255, 0.88)'
          : 'rgba(248, 250, 252, 0.86)'
        : isSpot
          ? `rgba(${colMain}, ${esClaro ? 0.84 : 0.92})`
          : `rgba(${colAccent}, ${esClaro ? 0.64 : 0.72})`;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cresta dorsal ondulante
    ctx.strokeStyle = `rgba(${colMain}, 0.75)`;
    ctx.lineWidth = 2.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 3; i <= 10; i += 1) {
      const pt = koi.spine[i];
      if (i === 3) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();

    // Bigotes delicados + ojos oscuros brillantes
    ctx.strokeStyle = `rgba(${colMain}, 0.72)`;
    ctx.lineWidth = 0.95;
    for (const side of [-1, 1]) {
      const bx = head.x + Math.cos(headAng + side * 0.45) * (koi.size * 0.56);
      const by = head.y + Math.sin(headAng + side * 0.45) * (koi.size * 0.56);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(
        bx + Math.cos(headAng + side * 0.85) * 6,
        by + Math.sin(headAng + side * 0.85) * 6,
        bx + Math.cos(headAng + side * 1.18) * 10,
        by + Math.sin(headAng + side * 1.18) * 10,
      );
      ctx.stroke();

      const ex = head.x + Math.cos(headAng + side * 0.72) * (koi.size * 0.36);
      const ey = head.y + Math.sin(headAng + side * 0.72) * (koi.size * 0.36);
      ctx.fillStyle = esClaro ? '#0f172a' : '#020617';
      ctx.beginPath();
      ctx.arc(ex, ey, 1.85, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 7. Nenúfares con nervaduras, gotas de rocío y flores de loto de 3 coronas
  for (const pad of state.lilyPads) {
    const px = pad.xNorm * ancho + Math.sin(t * 0.45 + pad.phase) * 5;
    const py = pad.yNorm * alto + Math.cos(t * 0.38 + pad.phase) * 4;
    const rot = pad.notch + Math.sin(t * 0.3 + pad.phase) * 0.08;

    // Sombra suave bajo el nenúfar
    ctx.fillStyle = esClaro ? 'rgba(15, 23, 42, 0.08)' : 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.arc(px + 5, py + 7, pad.r, rot + 0.25, rot + Math.PI * 2 - 0.25);
    ctx.lineTo(px + 5, py + 7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.22 : 0.21})`;
    ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.5 : 0.48})`;
    ctx.lineWidth = 1.45;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.arc(px, py, pad.r, rot + 0.25, rot + Math.PI * 2 - 0.25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Nervaduras radiales
    ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.28 : 0.24})`;
    ctx.lineWidth = 0.8;
    for (let v = 0; v < 7; v += 1) {
      const a = rot + 0.58 + (v / 7) * (Math.PI * 2 - 1.15);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + Math.cos(a) * (pad.r * 0.84), py + Math.sin(a) * (pad.r * 0.84));
      ctx.stroke();
    }

    // Gotita de rocío brillante sobre la hoja
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.arc(px + Math.cos(rot + 1.8) * pad.r * 0.52, py + Math.sin(rot + 1.8) * pad.r * 0.52, 2.2, 0, Math.PI * 2);
    ctx.fill();

    if (pad.hasLotus) {
      const lx = px - Math.cos(rot) * 4;
      const ly = py - Math.sin(rot) * 4;
      const pulse = 1 + Math.sin(t * 1.1 + pad.phase) * 0.05;
      // Halo cálido de la flor de loto
      const lGlow = ctx.createRadialGradient(lx, ly, 2, lx, ly, 26);
      lGlow.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.24 : 0.26})`);
      lGlow.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, 0)`);
      ctx.fillStyle = lGlow;
      ctx.beginPath();
      ctx.arc(lx, ly, 26, 0, Math.PI * 2);
      ctx.fill();

      // 3 coronas de pétalos
      for (const [count, len, wid, alpha] of [
        [10, 15.5, 4.4, esClaro ? 0.45 : 0.46],
        [8, 12.2, 3.8, esClaro ? 0.72 : 0.76],
        [6, 8.2, 3.0, esClaro ? 0.92 : 0.94],
      ] as const) {
        for (let pt = 0; pt < count; pt += 1) {
          const pa = (pt / count) * Math.PI * 2 + t * 0.08 + count;
          ctx.save();
          ctx.translate(lx, ly);
          ctx.rotate(pa);
          ctx.fillStyle = count === 10
            ? `rgba(${sR}, ${sG}, ${sB}, ${alpha})`
            : `rgba(${pR}, ${pG}, ${pB}, ${alpha})`;
          ctx.beginPath();
          ctx.ellipse(len * 0.52 * pulse, 0, len * 0.5 * pulse, wid * pulse, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.beginPath();
      ctx.arc(lx, ly, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 8. Pétalos de cerezo (sakura) flotando y girando suavemente en la superficie
  for (const pet of state.sakuraPetals) {
    const px = (((pet.x + (estatico ? 0 : t * pet.vx)) % 1.08) - 0.04) * ancho;
    const py = (((pet.y + (estatico ? 0 : t * pet.vy)) % 1.08) - 0.04) * alto + Math.sin(t * 1.4 + pet.rot) * 6;
    const rot = pet.rot + (estatico ? 0 : t * pet.vRot);
    const col = pet.sec ? `${pR}, ${pG}, ${pB}` : `${sR}, ${sG}, ${sB}`;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rot);
    ctx.fillStyle = `rgba(${col}, ${esClaro ? 0.58 : 0.62})`;
    ctx.beginPath();
    ctx.moveTo(-pet.size, 0);
    ctx.quadraticCurveTo(0, -pet.size * 0.82, pet.size, -pet.size * 0.18);
    ctx.lineTo(pet.size * 0.62, 0);
    ctx.lineTo(pet.size, pet.size * 0.18);
    ctx.quadraticCurveTo(0, pet.size * 0.82, -pet.size, 0);
    ctx.fill();
    ctx.restore();
  }

  // 9. Libélula delicada revoloteando alrededor del nenúfar superior derecho
  const dfX = ancho * 0.91 + Math.sin(t * 1.15) * 44;
  const dfY = alto * 0.14 + Math.cos(t * 1.7) * 24;
  const dfAng = Math.atan2(-Math.sin(t * 1.7) * 24 * 1.7, Math.cos(t * 1.15) * 44 * 1.15);
  const wingFlap = 0.5 + 0.5 * Math.sin(t * 36);
  ctx.save();
  ctx.translate(dfX, dfY);
  ctx.rotate(dfAng);
  ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, 0.85)`;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-10, 0);
  ctx.lineTo(6, 0);
  ctx.stroke();
  ctx.fillStyle = `rgba(255, 255, 255, ${(0.28 + wingFlap * 0.25).toFixed(3)})`;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(1, side * (5.5 + wingFlap * 2.5), 2.2, 6.2, side * 0.2, 0, Math.PI * 2);
    ctx.ellipse(-2.5, side * (4.2 + wingFlap * 2), 1.8, 5.0, side * -0.15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Brillo acuático siguiendo el puntero
  const mx = mouse.x * ancho;
  const my = mouse.y * alto;
  const gCursor = ctx.createRadialGradient(mx, my, 0, mx, my, 125);
  gCursor.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.065 : 0.085})`);
  gCursor.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, 0)`);
  ctx.fillStyle = gCursor;
  ctx.fillRect(0, 0, ancho, alto);
}

// ============================================================================
// 2. LUCIÉRNAGAS PRADERA — Colinas + Torii detallado + linterna de piedra Tōrō + bruma + Boids + faroles
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

  // 1. Resplandor crepuscular cálido desde el horizonte inferior
  const dusk = ctx.createLinearGradient(0, alto * 0.62, 0, alto);
  dusk.addColorStop(0, `rgba(${bgR}, ${bgG}, ${bgB}, 0)`);
  dusk.addColorStop(1, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.14 : 0.14})`);
  ctx.fillStyle = dusk;
  ctx.fillRect(0, alto * 0.62, ancho, alto * 0.38);

  // 2. Dos colinas suaves en silueta para enmarcar el santuario
  ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.1 : 0.08})`;
  ctx.beginPath();
  ctx.moveTo(0, alto);
  ctx.lineTo(0, alto - 58);
  ctx.quadraticCurveTo(ancho * 0.18, alto - 102, ancho * 0.42, alto - 44);
  ctx.quadraticCurveTo(ancho * 0.72, alto - 18, ancho, alto - 66);
  ctx.lineTo(ancho, alto);
  ctx.closePath();
  ctx.fill();

  // 3. Arco Torii japonés tradicional detallado (esquina inferior izquierda)
  const tx = ancho * 0.095;
  const ty = alto - 14;
  ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.28 : 0.26})`;
  ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.44 : 0.42})`;
  ctx.lineWidth = 1.6;
  // Columnas ligeramente inclinadas hacia adentro con bases de piedra
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(tx + side * 34, ty);
    ctx.lineTo(tx + side * 28, ty - 96);
    ctx.lineTo(tx + side * 21, ty - 96);
    ctx.lineTo(tx + side * 25, ty);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(tx + side * 29 - 6, ty - 10, 12, 10);
  }
  // Travesaño inferior (nuki) y tablilla central (gakuzuka)
  ctx.fillRect(tx - 40, ty - 79, 80, 6);
  ctx.fillRect(tx - 4, ty - 95, 8, 17);
  // Viga superior curva (kasagi) con extremos elevados
  ctx.beginPath();
  ctx.moveTo(tx - 52, ty - 104);
  ctx.quadraticCurveTo(tx, ty - 95, tx + 52, ty - 104);
  ctx.lineTo(tx + 46, ty - 93);
  ctx.quadraticCurveTo(tx, ty - 88, tx - 46, ty - 93);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // 4. Linterna de piedra japonesa (Tōrō) junto al Torii con llama cálida titilante
  const lx = tx + 74;
  const ly = ty;
  ctx.fillStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.3 : 0.28})`;
  ctx.fillRect(lx - 8, ly - 6, 16, 6); // pedestal
  ctx.fillRect(lx - 3.5, ly - 26, 7, 20); // fuste
  ctx.fillRect(lx - 9, ly - 30, 18, 4); // base cámara
  ctx.fillRect(lx - 7, ly - 42, 2.2, 12); // poste izq
  ctx.fillRect(lx + 4.8, ly - 42, 2.2, 12); // poste der
  // Techo pagodado de la linterna
  ctx.beginPath();
  ctx.moveTo(lx - 13, ly - 42);
  ctx.quadraticCurveTo(lx, ly - 54, lx + 13, ly - 42);
  ctx.closePath();
  ctx.fill();
  // Llama viva interior + halo cálido
  const flameFlicker = 0.8 + 0.2 * Math.sin(t * 7.5) * Math.cos(t * 4.2);
  const lGlow = ctx.createRadialGradient(lx, ly - 36, 1, lx, ly - 36, 44 * flameFlicker);
  lGlow.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.4 : 0.48})`);
  lGlow.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, 0)`);
  ctx.fillStyle = lGlow;
  ctx.beginPath();
  ctx.arc(lx, ly - 36, 44 * flameFlicker, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, 0.95)`;
  ctx.beginPath();
  ctx.ellipse(lx, ly - 36, 2.8, 4.2 * flameFlicker, 0, 0, Math.PI * 2);
  ctx.fill();

  // 5. Bruma suave de pradera flotando a ras de suelo
  for (let m = 0; m < 3; m += 1) {
    const mxMist = ancho * (0.2 + m * 0.3) + Math.sin(t * 0.22 + m * 2.1) * 65;
    const myMist = alto - 18 - (m % 2) * 14;
    const mg = ctx.createRadialGradient(mxMist, myMist, 12, mxMist, myMist, 210);
    mg.addColorStop(0, `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.11 : 0.11})`);
    mg.addColorStop(1, `rgba(${sR}, ${sG}, ${sB}, 0)`);
    ctx.fillStyle = mg;
    ctx.beginPath();
    ctx.ellipse(mxMist, myMist, 220, 44, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Hierba alta en 2 planos + flores silvestres meciendo con la brisa
  for (const gb of state.grassBlades) {
    const gx = gb.xNorm * ancho;
    const wind = Math.sin(t * (gb.back ? 1.05 : 1.45) + gb.fase) * (gb.back ? 7 : 11);
    ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${gb.back ? (esClaro ? 0.15 : 0.13) : (esClaro ? 0.28 : 0.24)})`;
    ctx.lineWidth = gb.back ? 1.15 : 1.55;
    ctx.beginPath();
    ctx.moveTo(gx, alto);
    ctx.quadraticCurveTo(gx + gb.lean + wind * 0.45, alto - gb.h * 0.55, gx + gb.lean + wind, alto - gb.h);
    ctx.stroke();

    if (gb.hasFlower && !gb.back) {
      const fx = gx + gb.lean + wind;
      const fy = alto - gb.h;
      ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${esClaro ? 0.56 : 0.62})`;
      ctx.beginPath();
      ctx.arc(fx, fy, 2.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 7. Semillas de diente de león ascendiendo suavemente en la brisa nocturna
  for (const ds of state.dandelionSeeds) {
    const dy = (((ds.y - (estatico ? 0 : t * ds.speed)) % 1) + 1) % 1 * alto;
    const dx = ds.x * ancho + Math.sin(t * 0.8 + ds.fase) * ds.sway;
    ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${esClaro ? 0.28 : 0.3})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(dx, dy + 6);
    ctx.lineTo(dx, dy);
    ctx.moveTo(dx - 3, dy - 2.5);
    ctx.lineTo(dx, dy);
    ctx.lineTo(dx + 3, dy - 2.5);
    ctx.stroke();
  }

  // 8. Faroles flotantes de papel encantados (lanzados al tocar el fondo)
  for (let i = state.lanterns.length - 1; i >= 0; i -= 1) {
    const l = state.lanterns[i];
    const age = t - l.born;
    if (age > 9.5) {
      state.lanterns.splice(i, 1);
      continue;
    }
    const fade = age > 7.4 ? (9.5 - age) / 2.1 : Math.min(1, age * 3.5);
    const lxn = l.x + Math.sin(t * 0.95 + l.sway) * 20;
    const lyn = l.y - age * 14;

    // Halo dorado radiante
    const lg = ctx.createRadialGradient(lxn, lyn, 4, lxn, lyn, 96);
    lg.addColorStop(0, `rgba(${pR}, ${pG}, ${pB}, ${(fade * (esClaro ? 0.34 : 0.42)).toFixed(3)})`);
    lg.addColorStop(0.5, `rgba(${sR}, ${sG}, ${sB}, ${(fade * 0.14).toFixed(3)})`);
    lg.addColorStop(1, `rgba(${pR}, ${pG}, ${pB}, 0)`);
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(lxn, lyn, 96, 0, Math.PI * 2);
    ctx.fill();

    // Cuerpo del farolillo con costillas de bambú y borde inferior
    ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.86).toFixed(3)})`;
    ctx.strokeStyle = `rgba(${sR}, ${sG}, ${sB}, ${(fade * 0.8).toFixed(3)})`;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.roundRect(lxn - 9, lyn - 13, 18, 23, [8, 8, 3, 3]);
    ctx.fill();
    ctx.stroke();

    // Costillas horizontales del farol
    ctx.strokeStyle = `rgba(${bgR}, ${bgG}, ${bgB}, ${(fade * 0.25).toFixed(3)})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(lxn - 8.5, lyn - 5);
    ctx.lineTo(lxn + 8.5, lyn - 5);
    ctx.moveTo(lxn - 8.5, lyn + 2);
    ctx.lineTo(lxn + 8.5, lyn + 2);
    ctx.stroke();

    // Brasa interior brillante + chispitas descendentes
    ctx.fillStyle = `rgba(255, 255, 255, ${(fade * 0.92).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(lxn, lyn + 4, 3.2, 0, Math.PI * 2);
    ctx.fill();

    for (let em = 0; em < 3; em += 1) {
      const ep = (age * 1.4 + em * 0.33) % 1;
      const ex = lxn + Math.sin(t * 4 + em * 2.4) * 6;
      const ey = lyn + 12 + ep * 22;
      ctx.fillStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * (1 - ep) * 0.7).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(ex, ey, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 9. Enjambre de 48 luciérnagas con física Boids, estelas sedosas y atracción a faroles
  const dt = estatico ? 0 : 0.016;
  const mx = mouse.x * ancho;
  const my = mouse.y * alto;
  const latestLantern = state.lanterns.length > 0 ? state.lanterns[state.lanterns.length - 1] : null;
  const targetLX = latestLantern ? latestLantern.x + Math.sin(t * 0.95 + latestLantern.sway) * 20 : mx;
  const targetLY = latestLantern ? latestLantern.y - (t - latestLantern.born) * 14 : my;

  for (const f of state.fireflies) {
    if (!estatico) {
      f.vx += Math.cos(t * 1.35 + f.fase) * 15 * dt;
      f.vy += Math.sin(t * 1.15 + f.fase * 1.3) * 15 * dt;

      const dx = targetLX - f.x;
      const dy = targetLY - f.y;
      const d = Math.hypot(dx, dy);
      if (d > 26 && d < (latestLantern ? 520 : 250)) {
        const pull = latestLantern ? 78 : 26;
        // Movimiento orbital elegante alrededor del farol
        f.vx += ((dx / d) * pull - (dy / d) * (latestLantern ? 34 : 0)) * dt;
        f.vy += ((dy / d) * pull + (dx / d) * (latestLantern ? 34 : 0)) * dt;
      }

      const spd = Math.hypot(f.vx, f.vy);
      if (spd > 68) {
        f.vx = (f.vx / spd) * 68;
        f.vy = (f.vy / spd) * 68;
      }
      f.x += f.vx * dt;
      f.y += f.vy * dt;

      if (f.x < -10) f.x = ancho + 10;
      if (f.x > ancho + 10) f.x = -10;
      if (f.y < -10) f.y = alto + 10;
      if (f.y > alto + 10) f.y = -10;

      f.trail.push({ x: f.x, y: f.y });
      if (f.trail.length > 10) f.trail.shift();
    }

    const blink = 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(t * 2.5 + f.fase), 1.6);
    const col = f.sec ? `${sR}, ${sG}, ${sB}` : `${pR}, ${pG}, ${pB}`;

    // Estela sedosa luminosa
    if (f.trail.length > 1) {
      for (let ti = 1; ti < f.trail.length; ti += 1) {
        const a = (ti / f.trail.length) * blink * 0.34;
        ctx.strokeStyle = `rgba(${col}, ${a.toFixed(3)})`;
        ctx.lineWidth = (ti / f.trail.length) * 1.6;
        ctx.beginPath();
        ctx.moveTo(f.trail[ti - 1].x, f.trail[ti - 1].y);
        ctx.lineTo(f.trail[ti].x, f.trail[ti].y);
        ctx.stroke();
      }
    }

    // Halo bioluminiscente
    const rad = f.r * (5.5 + blink * 4.5);
    const fg = ctx.createRadialGradient(f.x, f.y, 0.5, f.x, f.y, rad);
    fg.addColorStop(0, `rgba(${col}, ${(blink * (esClaro ? 0.5 : 0.62)).toFixed(3)})`);
    fg.addColorStop(1, `rgba(${col}, 0)`);
    ctx.fillStyle = fg;
    ctx.beginPath();
    ctx.arc(f.x, f.y, rad, 0, Math.PI * 2);
    ctx.fill();

    // Núcleo incandescente
    ctx.fillStyle = `rgba(255, 255, 255, ${(blink * 0.94).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(f.x, f.y, f.r * 0.68, 0, Math.PI * 2);
    ctx.fill();
  }

  // Onda dorada expansiva al liberar un farol
  for (const tap of taps) {
    const p = (t - tap.born) / 1.9;
    if (p < 0 || p > 1) continue;
    const fade = 1 - p;
    ctx.strokeStyle = `rgba(${pR}, ${pG}, ${pB}, ${(fade * 0.56).toFixed(3)})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(tap.x, tap.y, 12 + p * 84, 0, Math.PI * 2);
    ctx.stroke();
  }
}
