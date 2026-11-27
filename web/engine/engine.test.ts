import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { compilarEdu } from './compilador';
import { ejecutarIntermedio } from './interprete';

const RAIZ = resolve(process.cwd());

function listarEdu(relDir: string): string[] {
  const dir = join(RAIZ, relDir);
  return readdirSync(dir)
    .filter((f) => f.endsWith('.edu'))
    .sort()
    .map((f) => join(dir, f));
}

async function correrPrograma(codigo: string, entradas: string[] = []): Promise<{
  salidas: string[];
  preguntas: string[];
  invalidas: string[];
  errores: string[];
}> {
  const comp = compilarEdu(codigo, 'intermedio');
  expect(comp.diagnosticos).toEqual([]);
  expect(comp.intermedio).not.toBeNull();

  const salidas: string[] = [];
  const preguntas: string[] = [];
  const invalidas: string[] = [];
  const errores: string[] = [];
  let idx = 0;

  await ejecutarIntermedio(comp.intermedio!, {
    onEvento: (ev) => {
      if (ev.tipo === 'salida') salidas.push(ev.texto);
      if (ev.tipo === 'pregunta') preguntas.push(ev.mensaje);
      if (ev.tipo === 'entrada_invalida') invalidas.push(ev.mensaje);
      if (ev.tipo === 'error') errores.push(...ev.diagnosticos.map((d) => d.mensaje));
    },
    leerEntrada: async () => {
      if (idx >= entradas.length) return null;
      const val = entradas[idx];
      idx += 1;
      return val;
    },
  });

  return { salidas, preguntas, invalidas, errores };
}

describe('Paridad 100 % con la batería de pruebas .edu del repositorio', () => {
  it('acepta todos los casos válidos de tests/lexer/validos', () => {
    for (const ruta of listarEdu('tests/lexer/validos')) {
      const codigo = readFileSync(ruta, 'utf-8');
      const res = compilarEdu(codigo, 'lexer');
      expect(res.diagnosticos, `Falló ${ruta}`).toEqual([]);
    }
  });

  it('rechaza todos los casos inválidos de tests/lexer/invalidos en etapa lexer', () => {
    for (const ruta of listarEdu('tests/lexer/invalidos')) {
      const codigo = readFileSync(ruta, 'utf-8');
      const res = compilarEdu(codigo, 'lexer');
      expect(res.diagnosticos.length, `Debió fallar ${ruta}`).toBeGreaterThan(0);
      expect(res.diagnosticos[0].etapa).toBe('lexer');
    }
  });

  it('acepta todos los casos válidos de tests/gramatica/validos', () => {
    for (const ruta of listarEdu('tests/gramatica/validos')) {
      const codigo = readFileSync(ruta, 'utf-8');
      const res = compilarEdu(codigo, 'gramatica');
      expect(res.diagnosticos, `Falló ${ruta}`).toEqual([]);
    }
  });

  it('rechaza todos los casos inválidos de tests/gramatica/invalidos en etapa gramatica', () => {
    for (const ruta of listarEdu('tests/gramatica/invalidos')) {
      const codigo = readFileSync(ruta, 'utf-8');
      const res = compilarEdu(codigo, 'gramatica');
      expect(res.diagnosticos.length, `Debió fallar ${ruta}`).toBeGreaterThan(0);
      expect(res.diagnosticos[0].etapa).toBe('gramatica');
    }
  });

  it('acepta todos los casos válidos de tests/semantica/validos', () => {
    for (const ruta of listarEdu('tests/semantica/validos')) {
      const codigo = readFileSync(ruta, 'utf-8');
      const res = compilarEdu(codigo, 'intermedio');
      expect(res.diagnosticos, `Falló ${ruta}`).toEqual([]);
      expect(res.intermedio?.version).toBe(1);
    }
  });

  it('rechaza todos los casos inválidos de tests/semantica/invalidos en etapa semantica', () => {
    for (const ruta of listarEdu('tests/semantica/invalidos')) {
      const codigo = readFileSync(ruta, 'utf-8');
      const res = compilarEdu(codigo, 'semantica');
      expect(res.diagnosticos.length, `Debió fallar ${ruta}`).toBeGreaterThan(0);
      expect(res.diagnosticos[0].etapa).toBe('semantica');
    }
  });
});

describe('Ejecución exacta de los programas oficiales de examples/', () => {
  it('ejecuta examples/basico.edu', async () => {
    const codigo = readFileSync(join(RAIZ, 'examples/basico.edu'), 'utf-8');
    const res = await correrPrograma(codigo);
    expect(res.errores).toEqual([]);
    expect(res.salidas).toEqual([
      'Hola',
      'Ana',
      'El próximo año tendrás',
      '13',
      'Ya puedes programar con texto',
      '1',
      '2',
      '3',
    ]);
  });

  it('ejecuta examples/avanzado.edu (recursión, lógica y ciclos anidados)', async () => {
    const codigo = readFileSync(join(RAIZ, 'examples/avanzado.edu'), 'utf-8');
    const res = await correrPrograma(codigo);
    expect(res.errores).toEqual([]);
    expect(res.salidas).toEqual([
      'n, factorial, fibonacci y paridad',
      '1', '1', '1', 'impar', 'extremo',
      '2', '2', '1', 'par',
      '3', '6', '2', 'impar',
      '4', '24', '3', 'par',
      '5', '120', '5', 'impar', 'extremo',
      'Tabla de multiplicar de 3 x 3',
      '1', '2', '3', '2', '4', '6', '3', '6', '9',
    ]);
  });

  it('ejecuta examples/calculadora.edu con reintento de entrada inválida', async () => {
    const codigo = readFileSync(join(RAIZ, 'examples/calculadora.edu'), 'utf-8');
    const res = await correrPrograma(codigo, ['1', 'mayonesa', '8', '5']);
    expect(res.errores).toEqual([]);
    expect(res.invalidas.length).toBe(1);
    expect(res.salidas[0]).toBe('Calculadora');
    expect(res.salidas.at(-1)).toBe('13');
  });

  it('ejecuta examples/principal.edu (Adivina el número)', async () => {
    const codigo = readFileSync(join(RAIZ, 'examples/principal.edu'), 'utf-8');
    const intentos = Array.from({ length: 10 }, (_, i) => String(i + 1));
    const res = await correrPrograma(codigo, intentos);
    expect(res.errores).toEqual([]);
    expect(res.salidas[0]).toBe('Adivina el número del 1 al 10');
    expect(res.salidas.at(-2)).toBe('¡Adivinaste! Intentos usados:');
    const usados = Number(res.salidas.at(-1));
    expect(usados).toBeGreaterThanOrEqual(1);
    expect(usados).toBeLessThanOrEqual(10);
  });

  it('ejecuta examples/piedra_papel_tijera.edu', async () => {
    const codigo = readFileSync(join(RAIZ, 'examples/piedra_papel_tijera.edu'), 'utf-8');
    const res = await correrPrograma(codigo, ['1']);
    expect(res.errores).toEqual([]);
    expect(['Empate', 'Ganaste', 'Perdiste']).toContain(res.salidas.at(-1));
  });

  it('detecta los 7 errores semánticos exactos de examples/con_errores.edu', () => {
    const codigo = readFileSync(join(RAIZ, 'examples/con_errores.edu'), 'utf-8');
    const res = compilarEdu(codigo, 'intermedio');
    expect(res.intermedio).toBeNull();
    expect(res.diagnosticos.length).toBe(7);
    expect(res.diagnosticos.every((d) => d.etapa === 'semantica')).toBe(true);
  });

  it('maneja aritmética racional exacta y ámbitos léxicos en recursión', async () => {
    const res = await correrPrograma(`
crear variable local
asignar local valor de 99
definir exterior(numero nivel) devuelve numero
    crear variable local
    asignar local valor de nivel
    definir leer_local() devuelve numero
        definir sumar(numero incremento) devuelve numero
            asignar local valor de local + incremento
            devolver local
        fin
        devolver sumar(1)
    fin
    si nivel es igual a 0 entonces
        crear variable local
        asignar local valor de 100
        devolver leer_local()
    fin
    devolver leer_local() + exterior(nivel - 1) + leer_local()
fin
mostrar exterior(3)
mostrar local
mostrar 3 / 2
`);
    expect(res.errores).toEqual([]);
    expect(res.salidas).toEqual(['22', '99', '3/2']);
  });
});
