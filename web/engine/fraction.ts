/**
 * Aritmética racional exacta equivalente a `fractions.Fraction` de Python.
 * Garantiza paridad 100 % con el compilador e intérprete Python del proyecto .edu.
 */

function absBigInt(n: bigint): bigint {
  return n < 0n ? -n : n;
}

function gcdBigInt(a: bigint, b: bigint): bigint {
  let x = absBigInt(a);
  let y = absBigInt(b);
  while (y !== 0n) {
    const t = x % y;
    x = y;
    y = t;
  }
  return x;
}

export class Fraction {
  readonly num: bigint;
  readonly den: bigint;

  constructor(numerator: bigint, denominator: bigint = 1n) {
    if (denominator === 0n) {
      throw new ZeroDivisionError();
    }
    let n = numerator;
    let d = denominator;
    if (d < 0n) {
      n = -n;
      d = -d;
    }
    if (n === 0n) {
      this.num = 0n;
      this.den = 1n;
    } else {
      const g = gcdBigInt(n, d);
      this.num = n / g;
      this.den = d / g;
    }
  }

  static parse(raw: string): Fraction {
    const text = raw.trim();
    if (!text) {
      throw new Error(`Valor numérico inválido: '${raw}'`);
    }

    // Soporte de fracción "a/b" (como Fraction(str) en Python al leer entradas)
    if (text.includes('/')) {
      const parts = text.split('/');
      if (parts.length !== 2) {
        throw new Error(`Fracción inválida: '${raw}'`);
      }
      const left = parts[0].trim();
      const right = parts[1].trim();
      if (!/^[+-]?\d+$/.test(left) || !/^[+-]?\d+$/.test(right)) {
        throw new Error(`Fracción inválida: '${raw}'`);
      }
      return new Fraction(BigInt(left), BigInt(right));
    }

    // Entero o decimal con signo opcional (incluye .5, -.5, 5. y notación científica como Fraction en Python)
    const match = /^([+-]?)(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/.exec(text);
    if (!match) {
      throw new Error(`Número inválido: '${raw}'`);
    }
    const sign = match[1] === '-' ? -1n : 1n;
    const intPart = match[2] ?? '';
    const fracPart = match[3] ?? match[4] ?? '';
    const exp = match[5] ? Number.parseInt(match[5], 10) : 0;

    if (!Number.isFinite(exp) || Math.abs(exp) > 10000) {
      throw new Error('el literal numérico supera el tamaño admitido.');
    }

    const digits = intPart + fracPart;
    if (digits.length > 4300) {
      throw new Error('el literal numérico supera el tamaño admitido.');
    }

    const baseNum = sign * BigInt(digits);
    const shift = exp - fracPart.length;
    if (shift >= 0) {
      return new Fraction(baseNum * 10n ** BigInt(shift), 1n);
    }
    return new Fraction(baseNum, 10n ** BigInt(-shift));
  }

  static fromInt(n: number | bigint): Fraction {
    return new Fraction(typeof n === 'bigint' ? n : BigInt(n), 1n);
  }

  get isInteger(): boolean {
    return this.den === 1n;
  }

  get isZero(): boolean {
    return this.num === 0n;
  }

  neg(): Fraction {
    return new Fraction(-this.num, this.den);
  }

  add(other: Fraction): Fraction {
    return new Fraction(this.num * other.den + other.num * this.den, this.den * other.den);
  }

  sub(other: Fraction): Fraction {
    return new Fraction(this.num * other.den - other.num * this.den, this.den * other.den);
  }

  mul(other: Fraction): Fraction {
    return new Fraction(this.num * other.num, this.den * other.den);
  }

  div(other: Fraction): Fraction {
    if (other.num === 0n) {
      throw new ZeroDivisionError();
    }
    return new Fraction(this.num * other.den, this.den * other.num);
  }

  compare(other: Fraction): -1 | 0 | 1 {
    const left = this.num * other.den;
    const right = other.num * this.den;
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  }

  equals(other: Fraction): boolean {
    return this.num === other.num && this.den === other.den;
  }

  key(): string {
    return `${this.num.toString()}/${this.den.toString()}`;
  }

  toString(): string {
    if (this.den === 1n) {
      return this.num.toString();
    }
    return `${this.num.toString()}/${this.den.toString()}`;
  }
}

export class ZeroDivisionError extends Error {
  constructor() {
    super('división por cero.');
    this.name = 'ZeroDivisionError';
  }
}
