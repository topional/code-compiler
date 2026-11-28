import { describe, expect, it } from 'vitest';

import { formatearCodigoEdu } from '../engine/formateador';
import { BLOQUES_EDU, CATEGORIAS_BLOQUE } from './bloques';

describe('bloques del menú lateral', () => {
  it('cada bloque tiene un id único y categoría válida', () => {
    const ids = BLOQUES_EDU.map((b) => b.id);
    const categoriasValidas = new Set(CATEGORIAS_BLOQUE.map((c) => c.id));
    expect(new Set(ids).size).toBe(ids.length);
    for (const b of BLOQUES_EDU) {
      expect(categoriasValidas.has(b.categoria)).toBe(true);
      expect(b.titulo.trim().length).toBeGreaterThan(0);
      expect(b.plantilla.trim().length).toBeGreaterThan(0);
      expect(b.ejemploCompleto.trim().length).toBeGreaterThan(0);
    }
  });

  it.each(BLOQUES_EDU.map((b) => [b.id, b.ejemploCompleto]))(
    'el ejemplo completo de %s se formatea de forma idempotente',
    (_id, codigo) => {
      const unaVez = formatearCodigoEdu(codigo);
      expect(formatearCodigoEdu(unaVez)).toBe(unaVez);
    },
  );
});
