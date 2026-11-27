/**
 * Formateador automático de código `.edu` (equivalente al auto-format de GoJS.app).
 * Indenta bloques `si / sino / fin`, `repetir / fin`, `mientras / fin` y `definir / fin`
 * con 4 espacios sin alterar literales de texto ni comentarios.
 */

const RE_ABRE = /^(si\b.*\bentonces|repetir\b.*\bveces|mientras\b.*\bhacer|definir\b.*\bdevuelve\b.*)$/i;
const RE_SINO = /^sino\b/i;
const RE_FIN = /^fin\b/i;

export function formatearCodigoEdu(codigo: string): string {
  const lineas = codigo.replace(/\r\n/g, '\n').split('\n');
  let nivel = 0;
  const resultado: string[] = [];

  for (const raw of lineas) {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      resultado.push('');
      continue;
    }

    // Quitar comentario al final solo para analizar la palabra clave de cierre/apertura
    const sinComentario = trimmed.startsWith('#') ? '' : trimmed.replace(/\s+#.*$/, '').trim();

    if (RE_FIN.test(sinComentario)) {
      nivel = Math.max(0, nivel - 1);
      resultado.push(`${'    '.repeat(nivel)}${trimmed}`);
      continue;
    }

    if (RE_SINO.test(sinComentario)) {
      const nivelSino = Math.max(0, nivel - 1);
      resultado.push(`${'    '.repeat(nivelSino)}${trimmed}`);
      continue;
    }

    resultado.push(`${'    '.repeat(nivel)}${trimmed}`);

    if (RE_ABRE.test(sinComentario)) {
      nivel += 1;
    }
  }

  return resultado.join('\n');
}
