export type ModoFondoContinuo =
  | 'koi'
  | 'luciernagas'
  | 'cosmos'
  | 'vector'
  | 'lluvia'
  | 'acropolis';

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

export interface Point2D {
  x: number;
  y: number;
}

export function hexARgb(hex: string): [number, number, number] {
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
