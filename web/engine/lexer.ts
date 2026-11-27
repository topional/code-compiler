/**
 * Analizador léxico fiel a `grammar/EducativoLexer.g4`.
 * Palabras reservadas insensibles a mayúsculas (conservando el lexema original),
 * escapes estrictos en cadenas de texto y diagnóstico 1-based de línea y columna.
 */

import type { CategoriaToken, Diagnostico, Token } from './types';

export const PALABRAS_RESERVADAS: Record<string, { tipo: string; categoria: CategoriaToken }> = {
  // Variables
  crear: { tipo: 'CREAR', categoria: 'variable' },
  variable: { tipo: 'VARIABLE', categoria: 'variable' },
  con: { tipo: 'CON', categoria: 'variable' },
  asignar: { tipo: 'ASIGNAR', categoria: 'variable' },
  valor: { tipo: 'VALOR', categoria: 'variable' },
  a: { tipo: 'A', categoria: 'operador' },

  // Entrada / Salida
  mostrar: { tipo: 'MOSTRAR', categoria: 'io' },
  preguntar: { tipo: 'PREGUNTAR', categoria: 'io' },
  guardar: { tipo: 'GUARDAR', categoria: 'io' },
  en: { tipo: 'EN', categoria: 'io' },

  // Condiciones y ciclos
  si: { tipo: 'SI', categoria: 'control' },
  entonces: { tipo: 'ENTONCES', categoria: 'control' },
  sino: { tipo: 'SINO', categoria: 'control' },
  fin: { tipo: 'FIN', categoria: 'control' },
  repetir: { tipo: 'REPETIR', categoria: 'control' },
  veces: { tipo: 'VECES', categoria: 'control' },
  mientras: { tipo: 'MIENTRAS', categoria: 'control' },
  hacer: { tipo: 'HACER', categoria: 'control' },

  // Comparaciones y lógica
  es: { tipo: 'ES', categoria: 'operador' },
  igual: { tipo: 'IGUAL', categoria: 'operador' },
  diferente: { tipo: 'DIFERENTE', categoria: 'operador' },
  de: { tipo: 'DE', categoria: 'variable' },
  mayor: { tipo: 'MAYOR', categoria: 'operador' },
  menor: { tipo: 'MENOR', categoria: 'operador' },
  que: { tipo: 'QUE', categoria: 'operador' },
  y: { tipo: 'Y', categoria: 'operador' },
  o: { tipo: 'O', categoria: 'operador' },
  no: { tipo: 'NO', categoria: 'operador' },
  verdadero: { tipo: 'VERDADERO', categoria: 'valor' },
  falso: { tipo: 'FALSO', categoria: 'valor' },

  // Funciones y tipos
  definir: { tipo: 'DEFINIR', categoria: 'funcion' },
  devuelve: { tipo: 'DEVUELVE', categoria: 'funcion' },
  devolver: { tipo: 'DEVOLVER', categoria: 'funcion' },
  numero: { tipo: 'TIPO_NUMERO', categoria: 'funcion' },
  texto: { tipo: 'TIPO_TEXTO', categoria: 'funcion' },
  logico: { tipo: 'TIPO_LOGICO', categoria: 'funcion' },

  // Aleatorios y motivación
  aleatorio: { tipo: 'ALEATORIO', categoria: 'operador' },
  entre: { tipo: 'ENTRE', categoria: 'operador' },
  juego: { tipo: 'JUEGO', categoria: 'control' },
  calculadora: { tipo: 'CALCULADORA', categoria: 'control' },
};

const RE_LETRA = /[a-zA-Z_áéíóúüñÁÉÍÓÚÜÑ]/;
const RE_DIGITO = /[0-9]/;
const ESCAPES_VALIDOS = new Set(['"', '\\', 'n', 'r', 't']);

export interface ResultadoLexer {
  tokens: Token[];
  diagnosticos: Diagnostico[];
}

export function tokenizar(codigo: string): ResultadoLexer {
  const tokens: Token[] = [];
  const diagnosticos: Diagnostico[] = [];

  let i = 0;
  let linea = 1;
  let columna = 1;
  const n = codigo.length;

  while (i < n) {
    const ch = codigo[i];

    // Espacios y tabulaciones
    if (ch === ' ' || ch === '\t') {
      i += 1;
      columna += 1;
      continue;
    }

    // Comentario hasta fin de línea (conserva el salto de línea siguiente)
    if (ch === '#') {
      while (i < n && codigo[i] !== '\n' && codigo[i] !== '\r') {
        i += 1;
        columna += 1;
      }
      continue;
    }

    // Saltos de línea \r\n o \n
    if (ch === '\r' || ch === '\n') {
      const inicio = i;
      const colInicio = columna;
      if (ch === '\r' && i + 1 < n && codigo[i + 1] === '\n') {
        i += 2;
        tokens.push({
          tipo: 'SALTO_LINEA',
          texto: '\r\n',
          linea,
          columna: colInicio,
          indiceInicio: inicio,
          indiceFin: i,
          categoria: 'salto',
        });
        linea += 1;
        columna = 1;
        continue;
      }
      if (ch === '\n') {
        i += 1;
        tokens.push({
          tipo: 'SALTO_LINEA',
          texto: '\n',
          linea,
          columna: colInicio,
          indiceInicio: inicio,
          indiceFin: i,
          categoria: 'salto',
        });
        linea += 1;
        columna = 1;
        continue;
      }
      // \r solitario no es un token válido en EducativoLexer.g4
      diagnosticos.push({
        etapa: 'lexer',
        mensaje: "carácter no reconocido '\\r'.",
        linea,
        columna: colInicio,
      });
      i += 1;
      columna += 1;
      continue;
    }

    // Operadores y signos de un carácter
    const signo: Record<string, { tipo: string; categoria: CategoriaToken }> = {
      '+': { tipo: 'SUMA', categoria: 'operador' },
      '-': { tipo: 'RESTA', categoria: 'operador' },
      '*': { tipo: 'MULT', categoria: 'operador' },
      '/': { tipo: 'DIV', categoria: 'operador' },
      '(': { tipo: 'PAREN_IZQ', categoria: 'puntuacion' },
      ')': { tipo: 'PAREN_DER', categoria: 'puntuacion' },
      ',': { tipo: 'COMA', categoria: 'puntuacion' },
    };

    if (ch in signo) {
      const info = signo[ch];
      tokens.push({
        tipo: info.tipo,
        texto: ch,
        linea,
        columna,
        indiceInicio: i,
        indiceFin: i + 1,
        categoria: info.categoria,
      });
      i += 1;
      columna += 1;
      continue;
    }

    // Cadenas de texto entre comillas dobles (case-sensitive para escapes)
    if (ch === '"') {
      const inicio = i;
      const colInicio = columna;
      i += 1;
      columna += 1;
      let cerrada = false;
      let errorEnCadena = false;

      while (i < n && codigo[i] !== '\n' && codigo[i] !== '\r') {
        const c = codigo[i];
        if (c === '"') {
          i += 1;
          columna += 1;
          cerrada = true;
          break;
        }
        if (c === '\\') {
          if (i + 1 >= n || codigo[i + 1] === '\n' || codigo[i + 1] === '\r') {
            diagnosticos.push({
              etapa: 'lexer',
              mensaje: 'secuencia de escape incompleta dentro del texto.',
              linea,
              columna,
            });
            errorEnCadena = true;
            i += 1;
            columna += 1;
            break;
          }
          const siguiente = codigo[i + 1];
          if (!ESCAPES_VALIDOS.has(siguiente)) {
            diagnosticos.push({
              etapa: 'lexer',
              mensaje: `escape desconocido '\\${siguiente}' en el texto. Solo se permiten \\", \\\\, \\n, \\r y \\t.`,
              linea,
              columna,
            });
            errorEnCadena = true;
          }
          i += 2;
          columna += 2;
          continue;
        }
        i += 1;
        columna += 1;
      }

      if (!cerrada) {
        if (!errorEnCadena) {
          diagnosticos.push({
            etapa: 'lexer',
            mensaje: 'texto sin cerrar: falta la comilla doble (") al final.',
            linea,
            columna: colInicio,
          });
        }
      } else if (!errorEnCadena) {
        tokens.push({
          tipo: 'TEXTO',
          texto: codigo.slice(inicio, i),
          linea,
          columna: colInicio,
          indiceInicio: inicio,
          indiceFin: i,
          categoria: 'valor',
        });
      }
      continue;
    }

    // Números: DIGITO+ ('.' DIGITO+)?
    if (RE_DIGITO.test(ch)) {
      const inicio = i;
      const colInicio = columna;
      while (i < n && RE_DIGITO.test(codigo[i])) {
        i += 1;
        columna += 1;
      }
      if (i < n && codigo[i] === '.' && i + 1 < n && RE_DIGITO.test(codigo[i + 1])) {
        i += 1;
        columna += 1;
        while (i < n && RE_DIGITO.test(codigo[i])) {
          i += 1;
          columna += 1;
        }
      }
      tokens.push({
        tipo: 'NUMERO',
        texto: codigo.slice(inicio, i),
        linea,
        columna: colInicio,
        indiceInicio: inicio,
        indiceFin: i,
        categoria: 'valor',
      });
      continue;
    }

    // Identificadores y palabras reservadas
    if (RE_LETRA.test(ch)) {
      const inicio = i;
      const colInicio = columna;
      while (i < n && (RE_LETRA.test(codigo[i]) || RE_DIGITO.test(codigo[i]))) {
        i += 1;
        columna += 1;
      }
      const lexema = codigo.slice(inicio, i);
      const clave = lexema.toLowerCase();
      const reservada = Object.prototype.hasOwnProperty.call(PALABRAS_RESERVADAS, clave)
        ? PALABRAS_RESERVADAS[clave]
        : null;
      tokens.push({
        tipo: reservada ? reservada.tipo : 'ID',
        texto: lexema,
        linea,
        columna: colInicio,
        indiceInicio: inicio,
        indiceFin: i,
        categoria: reservada ? reservada.categoria : 'identificador',
      });
      continue;
    }

    // Carácter no reconocido
    diagnosticos.push({
      etapa: 'lexer',
      mensaje: `carácter no reconocido '${ch}'.`,
      linea,
      columna,
    });
    i += 1;
    columna += 1;
  }

  // Token EOF sintético
  tokens.push({
    tipo: 'EOF',
    texto: '<EOF>',
    linea,
    columna,
    indiceInicio: n,
    indiceFin: n,
    categoria: 'salto',
  });

  return { tokens, diagnosticos };
}
