/**
 * Orquestador completo del compilador .edu en navegador + pistas pedagógicas
 * amigables para niños + cliente opcional para la API FastAPI local.
 */

import { generarIntermedio } from './generador';
import { tokenizar } from './lexer';
import { parsear } from './parser';
import { analizarSemantica } from './semantico';
import type {
  Diagnostico,
  EtapaCompilacion,
  PistaPedagogica,
  ProgramaIntermedio,
  ResultadoCompilacion,
} from './types';

export function compilarEdu(
  codigo: string,
  etapa: 'lexer' | 'gramatica' | 'semantica' | 'intermedio' = 'intermedio',
): ResultadoCompilacion {
  const inicio = performance.now();

  const lex = tokenizar(codigo);
  if (lex.diagnosticos.length > 0 || etapa === 'lexer') {
    return {
      tokens: lex.tokens,
      arbolVisual: null,
      simbolos: [],
      intermedio: null,
      diagnosticos: lex.diagnosticos,
      duracionMs: Math.round((performance.now() - inicio) * 100) / 100,
    };
  }

  const par = parsear(lex.tokens);
  if (par.diagnosticos.length > 0 || !par.ast || etapa === 'gramatica') {
    return {
      tokens: lex.tokens,
      arbolVisual: par.arbolVisual,
      simbolos: [],
      intermedio: null,
      diagnosticos: par.diagnosticos,
      duracionMs: Math.round((performance.now() - inicio) * 100) / 100,
    };
  }

  const sem = analizarSemantica(par.ast);
  if (sem.diagnosticos.length > 0 || etapa === 'semantica') {
    return {
      tokens: lex.tokens,
      arbolVisual: par.arbolVisual,
      simbolos: sem.simbolos,
      intermedio: null,
      diagnosticos: sem.diagnosticos,
      duracionMs: Math.round((performance.now() - inicio) * 100) / 100,
    };
  }

  const intermedio = generarIntermedio(par.ast, sem.tiposEntrada);
  return {
    tokens: lex.tokens,
    arbolVisual: par.arbolVisual,
    simbolos: sem.simbolos,
    intermedio,
    diagnosticos: [],
    duracionMs: Math.round((performance.now() - inicio) * 100) / 100,
  };
}

/**
 * Traduce diagnósticos técnicos del compilador a pistas cálidas y accionables
 * pensadas para niños y estudiantes principiantes.
 */
export function obtenerPistaPedagogica(diag: Diagnostico): PistaPedagogica {
  const msg = diag.mensaje.toLowerCase();

  if (msg.includes('no está declarada') && msg.includes('variable')) {
    const match = /variable '([^']+)'/.exec(diag.mensaje);
    const nombre = match ? match[1] : 'mi_dato';
    return {
      titulo: '¡Primero crea la cajita!',
      explicacion: `Antes de usar '${nombre}', necesitas crearla para que la computadora reserve espacio.`,
      ejemplo: `crear variable ${nombre}\nasignar ${nombre} valor de 0`,
    };
  }

  if (msg.includes('ya está declarada')) {
    const match = /variable '([^']+)'/.exec(diag.mensaje);
    const nombre = match ? match[1] : 'puntos';
    return {
      titulo: 'Esa cajita ya existe',
      explicacion: `Solo necesitas 'crear variable' una vez. Para cambiar lo que guarda, usa 'asignar'.`,
      ejemplo: `asignar ${nombre} valor de 20`,
    };
  }

  if (msg.includes('sin inicializar')) {
    const match = /variable '([^']+)'/.exec(diag.mensaje);
    const nombre = match ? match[1] : 'dato';
    return {
      titulo: 'La cajita está vacía',
      explicacion: `Creaste '${nombre}', pero todavía no guardaste ningún valor adentro antes de leerla.`,
      ejemplo: `asignar ${nombre} valor de 10`,
    };
  }

  if (msg.includes('no se puede asignar un valor de tipo')) {
    return {
      titulo: 'Mezcla de tipos en la misma cajita',
      explicacion:
        'Cada variable recuerda su tipo desde el primer valor que guarda (número, texto o lógico). Si antes guardó un número, no puedes meterle texto entre comillas.',
      ejemplo: 'asignar puntos valor de 10  # número\nasignar nombre valor de "Ana"  # texto',
    };
  }

  if (msg.includes("la condición de 'si'") || msg.includes("la condición de 'mientras'")) {
    return {
      titulo: 'Falta una pregunta de verdadero o falso',
      explicacion:
        'Después de "si" o "mientras" debes escribir una comparación (como "es igual a" o "es mayor que") o un valor lógico.',
      ejemplo: 'si puntos es mayor que 5 entonces\n    mostrar "¡Ganaste!"\nfin',
    };
  }

  if (msg.includes('cantidad de repeticiones')) {
    return {
      titulo: 'Las vueltas deben ser un número entero',
      explicacion:
        'No se puede repetir 2.5 veces ni un número negativo. Usa un número entero como 3, 5 o 10.',
      ejemplo: 'repetir 3 veces\n    mostrar "¡Hola!"\nfin',
    };
  }

  if (msg.includes('función') && msg.includes('no está declarada')) {
    return {
      titulo: 'Receta no encontrada',
      explicacion:
        'Revisa si escribiste bien el nombre de la función o si la definiste arriba antes de llamarla.',
      ejemplo: 'definir doble(numero x) devuelve numero\n    devolver x * 2\nfin',
    };
  }

  if (msg.includes('argumento') && msg.includes('debe ser de tipo')) {
    return {
      titulo: 'Ingrediente del tipo equivocado',
      explicacion:
        'La función esperaba un tipo de dato distinto (por ejemplo, un número sin comillas en vez de texto con comillas).',
      ejemplo: 'mostrar doble(5)',
    };
  }

  if (msg.includes('texto sin cerrar')) {
    return {
      titulo: 'Faltan las comillas de cierre',
      explicacion: 'Todo texto empieza y termina con comillas dobles " en la misma línea.',
      ejemplo: 'mostrar "¡Hola mundo!"',
    };
  }

  if (msg.includes("falta 'fin'")) {
    return {
      titulo: 'Un bloque quedó abierto',
      explicacion: 'Cada bloque (si, repetir, mientras o definir) necesita su palabra "fin" para cerrar.',
      ejemplo: 'si edad es mayor que 10 entonces\n    mostrar "Genial"\nfin',
    };
  }

  if (msg.includes("valor de")) {
    return {
      titulo: 'Recuerda escribir "valor de"',
      explicacion: 'Para guardar algo en una variable siempre usamos: asignar NOMBRE valor de VALOR.',
      ejemplo: 'asignar puntaje valor de 100',
    };
  }

  if (msg.includes('división por cero')) {
    return {
      titulo: '¡Cuidado con el cero al dividir!',
      explicacion: 'En matemáticas no se puede dividir entre 0. Puedes comprobarlo primero con un "si".',
      ejemplo: 'si divisor es igual a 0 entonces\n    mostrar "No se puede dividir entre cero"\nfin',
    };
  }

  const nombresEtapa: Record<EtapaCompilacion, string> = {
    lexer: 'Revisa los símbolos escritos',
    gramatica: 'Revisa la estructura de la frase',
    semantica: 'Revisa variables y tipos',
    intermedio: 'Problema en el código intermedio',
    ejecucion: 'Ocurrió algo mientras corría el programa',
    limite: 'Se alcanzó un límite de seguridad',
    peticion: 'Revisa el envío al servidor',
    protocolo: 'Error de comunicación',
    servicio: 'El servidor no está disponible',
  };

  return {
    titulo: nombresEtapa[diag.etapa] ?? 'Pista de corrección',
    explicacion:
      'Haz clic en este aviso para saltar directo a la línea señalada y compararla con la Guía Visual de bloques.',
  };
}

/**
 * Cliente opcional para conectar con la API Python FastAPI local (`POST /compilar`).
 */
export async function compilarConApiRemota(
  baseUrl: string,
  codigo: string,
): Promise<{ intermedio: ProgramaIntermedio | null; diagnosticos: Diagnostico[] }> {
  const url = `${baseUrl.replace(/\/$/, '')}/compilar`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo }),
  });
  const data = (await resp.json()) as {
    version?: 1;
    instrucciones?: ProgramaIntermedio['instrucciones'];
    diagnosticos?: Diagnostico[];
  };
  if (resp.ok && data.version === 1 && Array.isArray(data.instrucciones)) {
    return {
      intermedio: { version: 1, instrucciones: data.instrucciones },
      diagnosticos: [],
    };
  }
  return {
    intermedio: null,
    diagnosticos: data.diagnosticos ?? [
      { etapa: 'servicio', mensaje: `La API respondió con estado ${resp.status}.`, linea: null, columna: null },
    ],
  };
}
