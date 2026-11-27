import { describe, expect, it } from 'vitest';

import { compilarEdu } from '../engine/compilador';
import { BLOQUES_EDU } from './bloques';

// Plantillas pensadas para pegarse dentro de un programa que ya tiene sus cajitas.
const FRAGMENTOS = new Set(['asignar-valor', 'mostrar', 'si-entonces', 'mientras-hacer', 'comparaciones', 'logica']);

describe('bloques del menú lateral', () => {
  it.each(BLOQUES_EDU.map((b) => [b.id, b.ejemploCompleto]))('el ejemplo de %s compila sin errores', (_id, codigo) => {
    expect(compilarEdu(codigo, 'intermedio').diagnosticos).toEqual([]);
  });

  it.each(BLOQUES_EDU.filter((b) => !FRAGMENTOS.has(b.id)).map((b) => [b.id, b.plantilla]))(
    'la plantilla de %s funciona sola al insertarla',
    (_id, codigo) => {
      expect(compilarEdu(codigo, 'intermedio').diagnosticos).toEqual([]);
    },
  );

  it('cada bloque tiene un id único', () => {
    const ids = BLOQUES_EDU.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
