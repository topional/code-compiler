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

function insertarAntesDePreguntar(codigo: string, nombreVar: string): string {
  const lineas = codigo.split(/\r?\n/);
  const rePreg = new RegExp(`preguntar\\s+.*guardar\\s+en\\s+${nombreVar}\\b`, 'i');
  const idx = lineas.findIndex((l) => rePreg.test(l));
  if (idx >= 0) {
    const indent = /^(\s*)/.exec(lineas[idx])?.[1] ?? '';
    lineas.splice(idx, 0, `${indent}asignar ${nombreVar} valor de 0`);
    return lineas.join('\n');
  }
  const reCrear = new RegExp(`crear\\s+variable\\s+${nombreVar}\\b`, 'i');
  const idxCrear = lineas.findIndex((l) => reCrear.test(l));
  if (idxCrear >= 0) {
    const indent = /^(\s*)/.exec(lineas[idxCrear])?.[1] ?? '';
    lineas.splice(idxCrear + 1, 0, `${indent}asignar ${nombreVar} valor de 0`);
    return lineas.join('\n');
  }
  return `crear variable ${nombreVar}\nasignar ${nombreVar} valor de 0\n${codigo}`;
}

function encontrarVariableDePreguntar(codigo: string, lineaErr?: number | null): string | null {
  const lineas = codigo.split(/\r?\n/);
  const varsPreguntadas: string[] = [];
  for (const l of lineas) {
    const m = /preguntar\s+.*guardar\s+en\s+([a-zA-Z_áéíóúñÁÉÍÓÚÑ][a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]*)/i.exec(l);
    if (m) varsPreguntadas.push(m[1]);
  }
  if (varsPreguntadas.length === 0) return null;
  if (lineaErr && lineaErr >= 1 && lineaErr <= lineas.length) {
    const textoLinea = lineas[lineaErr - 1];
    const usada = varsPreguntadas.find((v) => new RegExp(`\\b${v}\\b`).test(textoLinea));
    if (usada) return usada;
  }
  return varsPreguntadas[0];
}

/**
 * Traduce diagnósticos técnicos del compilador a pistas cálidas y accionables
 * con ejemplos visuales y botón de corrección rápida en 1 clic para niños.
 */
export function obtenerPistaPedagogica(diag: Diagnostico, codigoFuente = ''): PistaPedagogica {
  const msg = diag.mensaje.toLowerCase();

  // Caso clave: usar +, -, *, / con una variable llenada con "preguntar" (que guarda texto por defecto)
  if (
    (msg.includes('requiere operandos de tipo numero') || msg.includes('debe ser de tipo numero')) &&
    msg.includes('texto')
  ) {
    const varPreg = codigoFuente ? encontrarVariableDePreguntar(codigoFuente, diag.linea) : null;
    if (varPreg) {
      return {
        titulo: `¡Truco clave! "${varPreg}" se guardó como texto`,
        explicacion: `Cuando usas "preguntar" en una cajita nueva, Chispa guarda la respuesta como palabras (texto). Para poder sumar o restar con "${varPreg}", dale primero "valor de 0" antes de preguntar.`,
        ejemplo: `crear variable ${varPreg}\nasignar ${varPreg} valor de 0\npreguntar "¿Cuál es tu número?" guardar en ${varPreg}`,
        autoFix: {
          etiqueta: `Hacer que "${varPreg}" guarde número`,
          aplicar: (cod) => insertarAntesDePreguntar(cod, varPreg),
        },
      };
    }
    return {
      titulo: 'No se pueden sumar palabras con números',
      explicacion:
        'Los signos +, -, * y / solo funcionan con números (SIN comillas). Si una cajita guarda texto entre comillas ("5") o viene de "preguntar" sin "valor de 0", no se puede sumar.',
      ejemplo: 'crear variable numero1\nasignar numero1 valor de 0\npreguntar "¿Tu número?" guardar en numero1',
    };
  }

  if (msg.includes('no está declarada') && msg.includes('variable')) {
    const match = /variable '([^']+)'/.exec(diag.mensaje);
    const nombre = match ? match[1] : 'mi_dato';
    return {
      titulo: '¡Primero crea la cajita!',
      explicacion: `Antes de usar "${nombre}", necesitas crearla arriba para que Chispa reserve espacio.`,
      ejemplo: `crear variable ${nombre}\nasignar ${nombre} valor de 0`,
      autoFix: {
        etiqueta: `Crear cajita "${nombre}" arriba`,
        aplicar: (cod) => `crear variable ${nombre}\nasignar ${nombre} valor de 0\n${cod}`,
      },
    };
  }

  if (msg.includes('ya está declarada')) {
    const match = /variable '([^']+)'/.exec(diag.mensaje);
    const nombre = match ? match[1] : 'puntos';
    return {
      titulo: 'Esa cajita ya existe',
      explicacion: `Solo se escribe "crear variable ${nombre}" una vez. Para cambiar su valor después, usa "asignar".`,
      ejemplo: `asignar ${nombre} valor de 20`,
    };
  }

  if (msg.includes('sin inicializar')) {
    const match = /variable '([^']+)'/.exec(diag.mensaje);
    const nombre = match ? match[1] : 'dato';
    return {
      titulo: `La cajita "${nombre}" está vacía`,
      explicacion: `Creaste "${nombre}", pero todavía no guardaste ningún valor adentro antes de usarla.`,
      ejemplo: `asignar ${nombre} valor de 10`,
      autoFix: {
        etiqueta: `Darle valor inicial 0 a "${nombre}"`,
        aplicar: (cod) => insertarAntesDePreguntar(cod, nombre),
      },
    };
  }

  if (msg.includes('no se puede asignar un valor de tipo')) {
    return {
      titulo: 'Mezcla de texto y número en la misma cajita',
      explicacion:
        'Cada cajita guarda un solo tipo: números SIN comillas (10) o texto CON comillas ("Ana"). No puedes mezclar ambos en la misma cajita.',
      ejemplo: 'asignar edad valor de 10      # número (sin comillas)\nasignar nombre valor de "Ana"  # texto (con comillas)',
    };
  }

  if (msg.includes("la condición de 'si'") || msg.includes("la condición de 'mientras'")) {
    return {
      titulo: 'Falta una pregunta de verdadero o falso',
      explicacion:
        'Después de "si" o "mientras" escribe una comparación (como "es igual a" o "es mayor que") o un valor lógico.',
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
      titulo: 'Dato del tipo equivocado',
      explicacion:
        'La función esperaba un tipo de dato distinto (por ejemplo, un número sin comillas en vez de texto con comillas).',
      ejemplo: 'mostrar doble(5)',
    };
  }

  if (msg.includes('texto sin cerrar')) {
    return {
      titulo: 'Faltan las comillas de cierre "',
      explicacion: 'Todo texto empieza y termina con comillas dobles " en la misma línea.',
      ejemplo: 'mostrar "¡Hola mundo!"',
      autoFix: diag.linea
        ? {
            etiqueta: 'Cerrar comillas en esa línea',
            aplicar: (cod) => {
              const ls = cod.split(/\r?\n/);
              const i = (diag.linea ?? 1) - 1;
              if (ls[i] !== undefined) ls[i] = `${ls[i]}"`;
              return ls.join('\n');
            },
          }
        : undefined,
    };
  }

  if (msg.includes("falta 'fin'")) {
    return {
      titulo: 'Falta cerrar el bloque con "fin"',
      explicacion: 'Cada bloque (si, repetir, mientras o definir) necesita la palabra "fin" para cerrar.',
      ejemplo: 'si edad es mayor que 10 entonces\n    mostrar "Genial"\nfin',
      autoFix: {
        etiqueta: 'Agregar "fin" al final',
        aplicar: (cod) => `${cod.trimEnd()}\nfin`,
      },
    };
  }

  if (msg.includes('valor de')) {
    return {
      titulo: 'Recuerda escribir "valor de"',
      explicacion: 'Para guardar algo en una cajita siempre usamos: asignar NOMBRE valor de VALOR.',
      ejemplo: 'asignar puntaje valor de 100',
    };
  }

  // Caso muy común: "preguntar" en una línea y "guardar en ..." en la línea siguiente (o faltó "guardar en")
  if (msg.includes('guardar') || (diag.linea && codigoFuente && /^\s*preguntar\b/i.test(codigoFuente.split(/\r?\n/)[diag.linea - 1] ?? ''))) {
    const lineas = codigoFuente ? codigoFuente.split(/\r?\n/) : [];
    const idx = (diag.linea ?? 1) - 1;
    const lineaActual = lineas[idx] ?? '';
    const lineaSig = lineas[idx + 1] ?? '';
    if (/^\s*preguntar\b/i.test(lineaActual) && /^\s*guardar\s+en\b/i.test(lineaSig)) {
      return {
        titulo: '¡"preguntar" y "guardar en" van en la misma línea!',
        explicacion:
          'Separaste "guardar en" en la línea de abajo. En Chispa toda la pregunta debe escribirse junta en una sola línea.',
        ejemplo: `${lineaActual.trim()} ${lineaSig.trim()}`,
        autoFix: {
          etiqueta: 'Unir "preguntar" en una sola línea',
          aplicar: (cod) => {
            const ls = cod.split(/\r?\n/);
            if (ls[idx] !== undefined && ls[idx + 1] !== undefined) {
              ls[idx] = `${ls[idx].trimEnd()} ${ls[idx + 1].trim()}`;
              ls.splice(idx + 1, 1);
            }
            return ls.join('\n');
          },
        },
      };
    }
    return {
      titulo: 'Falta escribir "guardar en" en la misma línea',
      explicacion:
        'Toda instrucción "preguntar" debe terminar en la misma línea con "guardar en" seguido del nombre de tu cajita.',
      ejemplo: 'preguntar "¿Cuál es tu número?" guardar en numero1',
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
    gramatica: 'Revisa cómo está escrita la frase',
    semantica: 'Revisa tus cajitas y tipos (texto o número)',
    intermedio: 'Problema al preparar el programa',
    ejecucion: 'Ocurrió algo mientras corría el programa',
    limite: 'Se alcanzó un límite de seguridad',
    peticion: 'Revisa el envío al servidor',
    protocolo: 'Error de comunicación',
    servicio: 'El servidor no está disponible',
  };

  return {
    titulo: nombresEtapa[diag.etapa] ?? 'Pista de corrección',
    explicacion:
      'Usa el botón "Ayudante" para armar variables, preguntas o decisiones paso a paso y compararlo con esta línea.',
    ejemplo: 'crear variable nombre\nasignar nombre valor de "Sofía"\nmostrar nombre',
  };
}

/**
 * Cliente para compilar con la API Python FastAPI (`POST /compilar`).
 */
export async function compilarConApiRemota(
  baseUrl: string,
  codigo: string,
  signal?: AbortSignal,
): Promise<{ intermedio: ProgramaIntermedio | null; diagnosticos: Diagnostico[] }> {
  const url = `${baseUrl.replace(/\/$/, '')}/compilar`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codigo }),
    signal,
  });

  let data: {
    version?: 1;
    instrucciones?: ProgramaIntermedio['instrucciones'];
    diagnosticos?: Diagnostico[];
  } | null = null;
  try {
    data = (await resp.json()) as {
      version?: 1;
      instrucciones?: ProgramaIntermedio['instrucciones'];
      diagnosticos?: Diagnostico[];
    };
  } catch {
    data = null;
  }

  if (resp.ok && data?.version === 1 && Array.isArray(data.instrucciones)) {
    return {
      intermedio: { version: 1, instrucciones: data.instrucciones },
      diagnosticos: [],
    };
  }
  const mensajeFallback =
    resp.status === 403
      ? 'El servidor rechazó el origen web (403). Verifica EDU_ORIGENES en la API Python.'
      : `La API Python respondió con estado ${resp.status}.`;
  return {
    intermedio: null,
    diagnosticos: data?.diagnosticos ?? [
      { etapa: 'servicio', mensaje: mensajeFallback, linea: null, columna: null },
    ],
  };
}

export function construirUrlWebSocketApi(baseUrl: string): string {
  const limpia = baseUrl.trim().replace(/\/$/, '');
  if (/^wss?:\/\//i.test(limpia)) return `${limpia}/ejecutar`;
  if (/^https:\/\//i.test(limpia)) return `${limpia.replace(/^https:/i, 'wss:')}/ejecutar`;
  if (/^http:\/\//i.test(limpia)) return `${limpia.replace(/^http:/i, 'ws:')}/ejecutar`;
  return `wss://${limpia}/ejecutar`;
}

export interface EventoEjecucionRemota {
  tipo: 'salida' | 'pregunta' | 'entrada_invalida' | 'fin' | 'error';
  texto?: string;
  mensaje?: string;
  duracionMs?: number;
  diagnosticos?: Diagnostico[];
}

/**
 * Ejecuta el código intermedio directamente en el intérprete Python remoto vía WebSocket (`/ejecutar`)
 * siguiendo el contrato de `docs/api.md`.
 */
export function ejecutarConApiRemota(
  baseUrl: string,
  intermedio: ProgramaIntermedio,
  opciones: {
    signal?: AbortSignal;
    onEvento: (ev: EventoEjecucionRemota) => void;
    leerEntrada: (mensaje: string) => Promise<string | null>;
  },
): Promise<void> {
  return new Promise((resolve) => {
    if (opciones.signal?.aborted) {
      resolve();
      return;
    }

    const wsUrl = construirUrlWebSocketApi(baseUrl);
    const t0 = performance.now();
    let terminado = false;
    let recibioFinal = false;
    let ws: WebSocket;

    const finalizar = () => {
      if (terminado) return;
      terminado = true;
      opciones.signal?.removeEventListener('abort', onAbort);
      resolve();
    };

    const onAbort = () => {
      try {
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
          ws.close();
        }
      } catch {
        // ignorar cierre
      }
      finalizar();
    };

    try {
      ws = new WebSocket(wsUrl);
    } catch {
      opciones.onEvento({
        tipo: 'error',
        diagnosticos: [
          {
            etapa: 'servicio',
            mensaje: `No se pudo abrir la conexión WebSocket hacia ${wsUrl}.`,
            linea: null,
            columna: null,
          },
        ],
      });
      finalizar();
      return;
    }

    opciones.signal?.addEventListener('abort', onAbort, { once: true });

    ws.addEventListener('open', () => {
      if (opciones.signal?.aborted) {
        onAbort();
        return;
      }
      ws.send(JSON.stringify({ tipo: 'iniciar', intermedio }));
    });

    ws.addEventListener('message', (event) => {
      if (terminado || opciones.signal?.aborted) return;
      let msg: {
        tipo?: string;
        texto?: string;
        mensaje?: string;
        diagnosticos?: Diagnostico[];
      };
      try {
        msg = JSON.parse(String(event.data)) as typeof msg;
      } catch {
        return;
      }

      if (msg.tipo === 'salida') {
        opciones.onEvento({ tipo: 'salida', texto: String(msg.texto ?? '') });
      } else if (msg.tipo === 'entrada_invalida') {
        opciones.onEvento({
          tipo: 'entrada_invalida',
          mensaje: String(msg.mensaje ?? 'Entrada inválida.'),
        });
      } else if (msg.tipo === 'pregunta') {
        const pregunta = String(msg.mensaje ?? 'Escribe tu respuesta');
        opciones.onEvento({ tipo: 'pregunta', mensaje: pregunta });
        void opciones.leerEntrada(pregunta).then((respuesta) => {
          if (terminado || opciones.signal?.aborted) return;
          if (respuesta === null) {
            onAbort();
            return;
          }
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ tipo: 'respuesta', texto: respuesta }));
          }
        });
      } else if (msg.tipo === 'fin') {
        recibioFinal = true;
        opciones.onEvento({ tipo: 'fin', duracionMs: performance.now() - t0 });
        finalizar();
      } else if (msg.tipo === 'error') {
        recibioFinal = true;
        opciones.onEvento({
          tipo: 'error',
          diagnosticos:
            Array.isArray(msg.diagnosticos) && msg.diagnosticos.length > 0
              ? msg.diagnosticos
              : [
                  {
                    etapa: 'ejecucion',
                    mensaje: 'La ejecución remota en Python terminó con error.',
                    linea: null,
                    columna: null,
                  },
                ],
        });
        finalizar();
      }
    });

    ws.addEventListener('error', () => {
      if (terminado || opciones.signal?.aborted || recibioFinal) return;
      recibioFinal = true;
      opciones.onEvento({
        tipo: 'error',
        diagnosticos: [
          {
            etapa: 'servicio',
            mensaje: `No se pudo ejecutar por WebSocket en ${wsUrl}. Verifica que la API Python acepte este origen.`,
            linea: null,
            columna: null,
          },
        ],
      });
      finalizar();
    });

    ws.addEventListener('close', () => {
      if (terminado || opciones.signal?.aborted) return;
      if (!recibioFinal) {
        opciones.onEvento({
          tipo: 'error',
          diagnosticos: [
            {
              etapa: 'servicio',
              mensaje: 'La conexión con el intérprete Python se cerró antes de terminar.',
              linea: null,
              columna: null,
            },
          ],
        });
      }
      finalizar();
    });
  });
}
