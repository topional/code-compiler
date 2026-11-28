/**
 * Cliente HTTP/WebSocket para el compilador e intérprete Python (`docs/api.md`)
 * + ayudas editoriales (pistas pedagógicas con corrección en 1 clic para niños).
 */

import type {
  AnalisisCompilacion,
  Diagnostico,
  EtapaCompilacion,
  EventoEjecucionRemota,
  ModoEjecucionRemota,
  PistaPedagogica,
  ProgramaIntermedio,
  ResultadoCompilacionApi,
  VariableMemoria,
} from './types';

export const URL_API_PYTHON_DEFECTO = 'https://code-compiler-api.onrender.com';

/* ==========================================================================
   AYUDAS EDITORIALES: PISTAS PEDAGÓGICAS Y CORRECCIÓN RÁPIDA EN 1 CLIC
   ========================================================================== */

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
 * Traduce diagnósticos técnicos del compilador Python a pistas cálidas y accionables
 * con ejemplos visuales y botón de corrección rápida en 1 clic para niños.
 */
export function obtenerPistaPedagogica(diag: Diagnostico, codigoFuente = ''): PistaPedagogica {
  const msg = diag.mensaje.toLowerCase();

  if (
    (msg.includes('requiere operandos de tipo numero') || msg.includes('debe ser de tipo numero')) &&
    msg.includes('texto')
  ) {
    const varPreg = codigoFuente ? encontrarVariableDePreguntar(codigoFuente, diag.linea) : null;
    if (varPreg) {
      return {
        titulo: `¡Truco clave! "${varPreg}" se guardó como texto al preguntar`,
        explicacion: `Cuando usas "preguntar" en una cajita vacía, Chispa guarda la respuesta como texto (palabras). Si antes le pones "asignar ${varPreg} valor de 0", Chispa ya sabe que ahí va un número y podrás sumar o restar.`,
        ejemplo: `crear variable ${varPreg}\nasignar ${varPreg} valor de 0\npreguntar "¿Cuál es tu número?" guardar en ${varPreg}`,
        autoFix: {
          etiqueta: `Poner "valor de 0" a ${varPreg}`,
          aplicar: (cod) => insertarAntesDePreguntar(cod, varPreg),
        },
      };
    }
    return {
      titulo: 'Estás mezclando texto con un número',
      explicacion:
        'Para sumar, restar, multiplicar o dividir, ambas cajitas deben guardar números (sin comillas). Si una viene de "preguntar", dale "valor de 0" antes de preguntar.',
      ejemplo: 'crear variable numero1\nasignar numero1 valor de 0\npreguntar "Escribe un número" guardar en numero1',
    };
  }

  if (msg.includes('no está declarada')) {
    const mVar = /variable\s+'([^']+)'/i.exec(diag.mensaje);
    const nombre = mVar?.[1];
    return {
      titulo: nombre ? `Falta crear la cajita "${nombre}"` : 'Falta crear esa variable primero',
      explicacion: nombre
        ? `Antes de usar "${nombre}", créala con "crear variable ${nombre}".`
        : 'Antes de guardar o mostrar una variable, debes crearla arriba con "crear variable".',
      ejemplo: nombre
        ? `crear variable ${nombre}\nasignar ${nombre} valor de 0`
        : 'crear variable puntos\nasignar puntos valor de 10',
      autoFix: nombre
        ? {
            etiqueta: `Crear variable ${nombre} arriba`,
            aplicar: (cod) => `crear variable ${nombre}\nasignar ${nombre} valor de 0\n${cod}`,
          }
        : undefined,
    };
  }

  if (msg.includes('ya fue declarada') || msg.includes('ya existe')) {
    const mVar = /'([^']+)'/.exec(diag.mensaje);
    const nombre = mVar?.[1];
    return {
      titulo: nombre ? `La cajita "${nombre}" ya existe` : 'Esa variable ya fue creada arriba',
      explicacion:
        'Solo necesitas "crear variable" una sola vez. Para cambiar su valor después, usa "asignar ... valor de ...".',
      ejemplo: nombre
        ? `asignar ${nombre} valor de 20`
        : 'asignar puntos valor de 20',
    };
  }

  if (msg.includes('ya tiene tipo') || msg.includes('no se puede asignar')) {
    return {
      titulo: 'Cajita de otro tipo (texto vs. número)',
      explicacion:
        'Cada cajita recuerda si guarda palabras ("entre comillas") o números (sin comillas). Si necesitas otro tipo, crea una cajita nueva o quita/pon las comillas.',
      ejemplo: 'crear variable nombre\nasignar nombre valor de "Sofía"\ncrear variable edad\nasignar edad valor de 10',
    };
  }

  if (msg.includes('condición') && msg.includes('logico')) {
    return {
      titulo: 'El "si" o "mientras" necesita una comparación',
      explicacion:
        'Escribe una pregunta que sea verdadera o falsa usando "es igual a", "es mayor que" o "es menor que".',
      ejemplo: 'si puntos es mayor que 10 entonces\n    mostrar "¡Ganaste!"\nfin',
    };
  }

  if (msg.includes('repetir') && (msg.includes('entero') || msg.includes('numero'))) {
    return {
      titulo: '"repetir" necesita un número entero',
      explicacion: 'Escribe cuántas veces exactas quieres repetir (como 3 o 5, sin decimales).',
      ejemplo: 'repetir 3 veces\n    mostrar "¡Hola!"\nfin',
    };
  }

  if (msg.includes('función') && msg.includes('no está definida')) {
    return {
      titulo: 'Esa receta (función) no existe todavía',
      explicacion: 'Revisa que el nombre esté escrito igual al de tu bloque "definir ... devuelve ...".',
      ejemplo: 'definir doble(numero x) devuelve numero\n    devolver x * 2\nfin\nmostrar doble(4)',
    };
  }

  if (
    msg.includes('fin') ||
    msg.includes('entonces') ||
    msg.includes('hacer') ||
    msg.includes('veces') ||
    msg.includes('eof')
  ) {
    return {
      titulo: 'Parece que falta cerrar o completar un bloque',
      explicacion:
        'Todo "si ... entonces", "repetir ... veces", "mientras ... hacer" y "definir" debe terminar con la palabra "fin" en su propia línea.',
      ejemplo: 'si puntos es mayor que 5 entonces\n    mostrar "¡Bien!"\nfin',
    };
  }

  if (
    msg.includes('guardar') ||
    (diag.linea &&
      codigoFuente &&
      /^\s*preguntar\b/i.test(codigoFuente.split(/\r?\n/)[diag.linea - 1] ?? ''))
  ) {
    const lineas = codigoFuente ? codigoFuente.split(/\r?\n/) : [];
    const idx = (diag.linea ?? 1) - 1;
    const lineaActual = lineas[idx] ?? '';
    const lineaSig = lineas[idx + 1] ?? '';
    const partidaEnDos =
      /^\s*preguntar\s+/i.test(lineaActual) && /^\s*guardar\s+en\s+/i.test(lineaSig);
    if (partidaEnDos) {
      return {
        titulo: '"preguntar" y "guardar en" van en la misma línea',
        explicacion:
          'No presiones Enter entre la pregunta y "guardar en". Escribe todo seguido en una sola línea para que Chispa entienda dónde guardar la respuesta.',
        ejemplo: `${lineaActual.trim()} ${lineaSig.trim()}`,
        autoFix: {
          etiqueta: 'Unir en una sola línea',
          aplicar: (cod) => {
            const ls = cod.split(/\r?\n/);
            const i = (diag.linea ?? 1) - 1;
            if (i >= 0 && i + 1 < ls.length) {
              const indent = /^(\s*)/.exec(ls[i])?.[1] ?? '';
              ls.splice(i, 2, `${indent}${ls[i].trim()} ${ls[i + 1].trim()}`);
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

  if (diag.etapa === 'servicio') {
    return {
      titulo: 'El servidor Python tardó o no respondió',
      explicacion:
        diag.mensaje ||
        'Render puede estar despertando el servidor Python gratuito (tarda unos segundos). Pulsa Reintentar.',
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
    servicio: 'El servidor Python no está disponible',
  };

  return {
    titulo: nombresEtapa[diag.etapa] ?? 'Pista de corrección',
    explicacion:
      diag.mensaje ||
      'Usa el botón "Ayudante" para armar variables, preguntas o decisiones paso a paso y compararlo con esta línea.',
    ejemplo: 'crear variable nombre\nasignar nombre valor de "Sofía"\nmostrar nombre',
  };
}

/* ==========================================================================
   CLIENTE HTTP: POST /compilar y POST /compilar?analisis=true
   ========================================================================== */

export function normalizarUrlApi(baseUrl: string): string {
  const limpia = baseUrl.trim().replace(/\/+$/, '');
  return limpia || URL_API_PYTHON_DEFECTO;
}

export function construirUrlWebSocketApi(baseUrl: string): string {
  const limpia = normalizarUrlApi(baseUrl);
  if (/^wss?:\/\//i.test(limpia)) return `${limpia}/ejecutar`;
  if (/^https:\/\//i.test(limpia)) return `${limpia.replace(/^https:/i, 'wss:')}/ejecutar`;
  if (/^http:\/\//i.test(limpia)) return `${limpia.replace(/^http:/i, 'ws:')}/ejecutar`;
  return `wss://${limpia}/ejecutar`;
}

export interface OpcionesCompilacionRemota {
  analisis?: boolean;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

/**
 * Compila un programa en la API Python (`POST /compilar` o `POST /compilar?analisis=true`).
 * Separa limpiamente el IR (`version` + `instrucciones`) del objeto `analisis`.
 */
export async function compilarConApiRemota(
  baseUrl: string,
  codigo: string,
  opciones: OpcionesCompilacionRemota = {},
): Promise<ResultadoCompilacionApi> {
  const inicio = performance.now();
  const base = normalizarUrlApi(baseUrl);
  const url = `${base}/compilar${opciones.analisis ? '?analisis=true' : ''}`;
  const fetcher = opciones.fetchImpl ?? fetch;

  let resp: Response;
  try {
    resp = await fetcher(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ codigo }),
      signal: opciones.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw err;
    }
    return {
      intermedio: null,
      diagnosticos: [
        {
          etapa: 'servicio',
          mensaje: `No se pudo conectar con Python en ${base}. Comprueba tu conexión o intenta de nuevo.`,
          linea: null,
          columna: null,
        },
      ],
      analisis: null,
      duracionMs: Math.round((performance.now() - inicio) * 10) / 10,
      falloConexion: true,
    };
  }

  type RespuestaCompilacionJson = {
    version?: 1;
    instrucciones?: ProgramaIntermedio['instrucciones'];
    diagnosticos?: Diagnostico[];
    analisis?: AnalisisCompilacion;
  };
  let data: RespuestaCompilacionJson | null = null;
  try {
    data = (await resp.json()) as RespuestaCompilacionJson;
  } catch {
    data = null;
  }

  const duracionMs = Math.round((performance.now() - inicio) * 10) / 10;
  const analisis = data?.analisis ?? null;

  if (resp.ok && data?.version === 1 && Array.isArray(data.instrucciones)) {
    return {
      intermedio: { version: 1, instrucciones: data.instrucciones },
      diagnosticos: [],
      analisis,
      duracionMs,
      falloConexion: false,
    };
  }

  const falloConexion = resp.status >= 500 || resp.status === 403 || resp.status === 429 || !data;
  const mensajeFallback =
    resp.status === 403
      ? 'El servidor Python rechazó el origen web (403). Verifica EDU_ORIGENES.'
      : resp.status === 429
        ? 'Se superó el límite momentáneo de solicitudes. Espera unos segundos y reintenta.'
        : resp.status === 503 || resp.status === 504
          ? 'El servidor Python está ocupado o despertando. Pulsa Reintentar.'
          : `La API Python respondió con estado ${resp.status}.`;

  return {
    intermedio: null,
    diagnosticos:
      Array.isArray(data?.diagnosticos) && data.diagnosticos.length > 0
        ? data.diagnosticos
        : [{ etapa: 'servicio', mensaje: mensajeFallback, linea: null, columna: null }],
    analisis,
    duracionMs,
    falloConexion,
  };
}

/* ==========================================================================
   CONTROLADOR DE COMPILACIÓN CON DEBOUNCE, CACHÉ Y DESCARTE DE OBSOLETOS
   ========================================================================== */

interface EntradaCacheCompilacion {
  claveTab: string;
  urlApi: string;
  codigo: string;
  conAnalisis: boolean;
  resultado: ResultadoCompilacionApi;
}

export class ControladorCompilacion {
  private version = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private abortController: AbortController | null = null;
  private cache: EntradaCacheCompilacion | null = null;
  private readonly fetchImpl?: typeof fetch;

  constructor(fetchImpl?: typeof fetch) {
    this.fetchImpl = fetchImpl;
  }

  obtenerCache(
    claveTab: string,
    urlApi: string,
    codigo: string,
    requiereAnalisis = false,
  ): ResultadoCompilacionApi | null {
    const c = this.cache;
    if (!c) return null;
    if (
      c.claveTab !== claveTab ||
      c.urlApi !== normalizarUrlApi(urlApi) ||
      c.codigo !== codigo ||
      c.resultado.falloConexion
    ) {
      return null;
    }
    if (requiereAnalisis && !c.conAnalisis) return null;
    return c.resultado;
  }

  invalidarCache(): void {
    this.cache = null;
  }

  cancelar(): void {
    this.version += 1;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.abortController?.abort();
    this.abortController = null;
  }

  programar(
    claveTab: string,
    urlApi: string,
    codigo: string,
    opciones: {
      analisis?: boolean;
      delayMs?: number;
      onInicio?: () => void;
      onResultado: (res: ResultadoCompilacionApi) => void;
    },
  ): void {
    this.cancelar();
    const versionEsperada = this.version;
    const delayMs = opciones.delayMs ?? 750;
    const urlNorm = normalizarUrlApi(urlApi);
    const analisis = Boolean(opciones.analisis);

    const cacheado = this.obtenerCache(claveTab, urlNorm, codigo, analisis);
    if (cacheado) {
      opciones.onResultado(cacheado);
      return;
    }

    this.timer = setTimeout(() => {
      this.timer = null;
      if (this.version !== versionEsperada) return;
      const controller = new AbortController();
      this.abortController = controller;
      opciones.onInicio?.();
      void compilarConApiRemota(urlNorm, codigo, {
        analisis,
        signal: controller.signal,
        fetchImpl: this.fetchImpl,
      })
        .then((res) => {
          if (this.version !== versionEsperada || controller.signal.aborted) return;
          this.abortController = null;
          if (!res.falloConexion) {
            this.cache = { claveTab, urlApi: urlNorm, codigo, conAnalisis: analisis, resultado: res };
          }
          opciones.onResultado(res);
        })
        .catch(() => {
          // AbortError esperado al escribir o cambiar de pestaña
        });
    }, delayMs);
  }

  async compilarAhora(
    claveTab: string,
    urlApi: string,
    codigo: string,
    opciones: { analisis?: boolean; forzar?: boolean; signal?: AbortSignal } = {},
  ): Promise<ResultadoCompilacionApi | null> {
    const urlNorm = normalizarUrlApi(urlApi);
    const analisis = Boolean(opciones.analisis);
    if (!opciones.forzar) {
      const cacheado = this.obtenerCache(claveTab, urlNorm, codigo, analisis);
      if (cacheado) return cacheado;
    }

    this.cancelar();
    const versionEsperada = this.version;
    const controller = new AbortController();
    this.abortController = controller;

    const onExtAbort = () => controller.abort();
    opciones.signal?.addEventListener('abort', onExtAbort, { once: true });

    try {
      const res = await compilarConApiRemota(urlNorm, codigo, {
        analisis,
        signal: controller.signal,
        fetchImpl: this.fetchImpl,
      });
      if (this.version !== versionEsperada || controller.signal.aborted) return null;
      this.abortController = null;
      if (!res.falloConexion) {
        this.cache = { claveTab, urlApi: urlNorm, codigo, conAnalisis: analisis, resultado: res };
      }
      return res;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return null;
      return null;
    } finally {
      opciones.signal?.removeEventListener('abort', onExtAbort);
    }
  }
}

/* ==========================================================================
   CLIENTE WEBSOCKET: /ejecutar (modo normal, continuo y paso a paso)
   ========================================================================== */

export interface SocketLike {
  readonly readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  addEventListener(type: string, listener: (event: unknown) => void): void;
  removeEventListener?(type: string, listener: (event: unknown) => void): void;
}

export type WebSocketFactory = (url: string) => SocketLike;

export interface SesionEjecucionRemota {
  promesa: Promise<void>;
  /** Envía `{"tipo":"respuesta","texto":...}` solo si hay una pregunta pendiente. */
  responder: (texto: string) => boolean;
  /** Envía un solo `{"tipo":"siguiente"}` por cada evento `estado` con `pausado: true`. */
  siguiente: () => boolean;
  /** Cierra la sesión y el WebSocket inmediatamente. */
  detener: () => void;
}

const WS_CONNECTING = 0;
const WS_OPEN = 1;
const VENTANA_CIERRE_REMOTO_MS = 10_000;
const ESPERA_PROXY_CIERRE_MS = 8_800;
const ultimoCierreManualPorUrl = new Map<string, number>();

/**
 * Abre `/ejecutar` en el servidor Python, envía `iniciar` con únicamente `{ version, instrucciones }`
 * y gestiona `salida`, `estado`, `pregunta`, `respuesta`, `siguiente`, `entrada_invalida`, `fin` y `error`.
 */
export function iniciarEjecucionRemota(
  baseUrl: string,
  intermedio: ProgramaIntermedio,
  opciones: {
    modo: ModoEjecucionRemota;
    signal?: AbortSignal;
    onAbierto?: () => void;
    onEvento: (ev: EventoEjecucionRemota) => void;
    crearWebSocket?: WebSocketFactory;
    reintentosApertura?: number;
    esperaReintentoMs?: number;
  },
): SesionEjecucionRemota {
  const wsUrl = construirUrlWebSocketApi(baseUrl);
  const t0 = performance.now();
  const cierreRecienteMs = ultimoCierreManualPorUrl.get(wsUrl) ?? 0;
  const tieneCierreReciente =
    cierreRecienteMs > 0 && Date.now() - cierreRecienteMs < VENTANA_CIERRE_REMOTO_MS;
  const maxReintentos =
    opciones.reintentosApertura ?? (opciones.crearWebSocket ? 0 : tieneCierreReciente ? 2 : 1);
  const esperaReintentoMs = opciones.esperaReintentoMs ?? 900;
  let terminado = false;
  let recibioFinal = false;
  let abierto = false;
  let intento = 0;
  let pausadoPendiente = false;
  let preguntaPendiente = false;
  let ws: SocketLike | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let resolverPromesa: (() => void) | null = null;

  const promesa = new Promise<void>((resolve) => {
    resolverPromesa = resolve;
  });

  const cerrarSocket = () => {
    if (!ws) return;
    try {
      if (ws.readyState === WS_OPEN || ws.readyState === WS_CONNECTING) {
        ws.close();
      }
    } catch {
      // ignorar error al cerrar
    }
  };

  const finalizar = () => {
    if (terminado) return;
    terminado = true;
    pausadoPendiente = false;
    preguntaPendiente = false;
    if (retryTimer !== null) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
    opciones.signal?.removeEventListener('abort', detener);
    resolverPromesa?.();
  };

  const detener = () => {
    if (terminado) return;
    if (abierto && !recibioFinal) {
      ultimoCierreManualPorUrl.set(wsUrl, Date.now());
    }
    recibioFinal = true;
    cerrarSocket();
    finalizar();
  };

  if (opciones.signal?.aborted) {
    finalizar();
    return {
      promesa,
      responder: () => false,
      siguiente: () => false,
      detener,
    };
  }

  opciones.signal?.addEventListener('abort', detener, { once: true });

  // Solo enviar version + instrucciones al servidor (nunca incluir analisis)
  const payloadInicio = JSON.stringify({
    tipo: 'iniciar',
    modo: opciones.modo,
    intermedio: {
      version: intermedio.version,
      instrucciones: intermedio.instrucciones,
    },
  });

  const emitirErrorConexion = (mensaje: string) => {
    if (terminado || opciones.signal?.aborted || recibioFinal) return;
    recibioFinal = true;
    cerrarSocket();
    opciones.onEvento({
      tipo: 'error',
      falloConexion: true,
      diagnosticos: [{ etapa: 'servicio', mensaje, linea: null, columna: null }],
    });
    finalizar();
  };

  const conectar = () => {
    if (terminado || opciones.signal?.aborted) return;
    let socketActual: SocketLike;
    try {
      socketActual = opciones.crearWebSocket ? opciones.crearWebSocket(wsUrl) : new WebSocket(wsUrl);
      ws = socketActual;
    } catch {
      emitirErrorConexion(`No se pudo abrir la conexión WebSocket hacia ${wsUrl}.`);
      return;
    }

    let reintentoProgramado = false;
    const intentarReapertura = () => {
      if (reintentoProgramado || abierto || terminado || opciones.signal?.aborted || recibioFinal) {
        return false;
      }
      if (intento >= maxReintentos) return false;
      reintentoProgramado = true;
      intento += 1;
      let espera = esperaReintentoMs;
      if (opciones.esperaReintentoMs === undefined && tieneCierreReciente) {
        if (intento === 1) {
          const transcurrido = Date.now() - cierreRecienteMs;
          espera = Math.max(1_500, ESPERA_PROXY_CIERRE_MS - transcurrido);
        } else {
          espera = 3_200;
        }
      }
      retryTimer = setTimeout(() => {
        retryTimer = null;
        conectar();
      }, espera);
      return true;
    };

    socketActual.addEventListener('open', () => {
      if (terminado || opciones.signal?.aborted || ws !== socketActual) {
        detener();
        return;
      }
      abierto = true;
      ultimoCierreManualPorUrl.delete(wsUrl);
      opciones.onAbierto?.();
      socketActual.send(payloadInicio);
    });

    socketActual.addEventListener('message', (rawEvent) => {
      if (terminado || opciones.signal?.aborted || ws !== socketActual) return;
      const data = (rawEvent as { data?: unknown })?.data;
      let msg: {
        tipo?: string;
        texto?: string;
        mensaje?: string;
        linea?: number | null;
        columna?: number | null;
        pausado?: boolean;
        pila?: string[];
        variables?: VariableMemoria[];
        diagnosticos?: Diagnostico[];
      };
      try {
        msg = JSON.parse(String(data)) as typeof msg;
      } catch {
        return;
      }

      if (msg.tipo === 'salida') {
        opciones.onEvento({ tipo: 'salida', texto: String(msg.texto ?? '') });
      } else if (msg.tipo === 'estado') {
        const pausado = Boolean(msg.pausado);
        pausadoPendiente = pausado;
        opciones.onEvento({
          tipo: 'estado',
          linea: typeof msg.linea === 'number' ? msg.linea : null,
          columna: typeof msg.columna === 'number' ? msg.columna : null,
          pausado,
          pila: Array.isArray(msg.pila) ? msg.pila : ['programa'],
          variables: Array.isArray(msg.variables) ? msg.variables : [],
        });
      } else if (msg.tipo === 'entrada_invalida') {
        opciones.onEvento({
          tipo: 'entrada_invalida',
          mensaje: String(msg.mensaje ?? 'Entrada inválida.'),
        });
      } else if (msg.tipo === 'pregunta') {
        preguntaPendiente = true;
        opciones.onEvento({
          tipo: 'pregunta',
          mensaje: String(msg.mensaje ?? 'Escribe tu respuesta'),
        });
      } else if (msg.tipo === 'fin') {
        recibioFinal = true;
        cerrarSocket();
        opciones.onEvento({ tipo: 'fin', duracionMs: Math.round((performance.now() - t0) * 10) / 10 });
        finalizar();
      } else if (msg.tipo === 'error') {
        recibioFinal = true;
        cerrarSocket();
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

    socketActual.addEventListener('error', () => {
      if (ws !== socketActual || terminado || opciones.signal?.aborted || recibioFinal) return;
      if (intentarReapertura()) return;
      emitirErrorConexion(
        `No se pudo conectar con Python en ${wsUrl}. Pulsa Reintentar o revisa la URL en Ajustes.`,
      );
    });

    socketActual.addEventListener('close', () => {
      if (ws !== socketActual || terminado || opciones.signal?.aborted) return;
      if (reintentoProgramado || intentarReapertura()) return;
      if (!recibioFinal) {
        emitirErrorConexion('La conexión con Python se cerró antes de terminar. Pulsa Reintentar.');
      } else {
        finalizar();
      }
    });
  };

  conectar();

  const responder = (texto: string): boolean => {
    if (terminado || !preguntaPendiente || !ws || ws.readyState !== WS_OPEN) return false;
    preguntaPendiente = false;
    ws.send(JSON.stringify({ tipo: 'respuesta', texto }));
    return true;
  };

  const siguiente = (): boolean => {
    if (terminado || !pausadoPendiente || !ws || ws.readyState !== WS_OPEN) return false;
    pausadoPendiente = false;
    ws.send(JSON.stringify({ tipo: 'siguiente' }));
    return true;
  };

  return { promesa, responder, siguiente, detener };
}
