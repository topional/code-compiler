import { afterEach, describe, expect, it, vi } from 'vitest';

import { evaluarMisionConPython } from '../data/misiones';
import {
  compilarConApiRemota,
  construirUrlWebSocketApi,
  ControladorCompilacion,
  iniciarEjecucionRemota,
  obtenerPistaPedagogica,
  type SocketLike,
} from './compilador';
import type { EventoEjecucionRemota, ProgramaIntermedio } from './types';

class FakeWebSocket implements SocketLike {
  readyState = 0; // CONNECTING
  readonly sent: string[] = [];
  closeCalls = 0;
  private listeners = new Map<string, Set<(ev: unknown) => void>>();

  constructor(public readonly url: string) {}

  addEventListener(type: string, listener: (event: unknown) => void): void {
    const set = this.listeners.get(type) ?? new Set();
    set.add(listener);
    this.listeners.set(type, set);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.closeCalls += 1;
    if (this.readyState === 3) return;
    this.readyState = 3; // CLOSED
    this.emit('close', {});
  }

  open(): void {
    this.readyState = 1; // OPEN
    this.emit('open', {});
  }

  serverMessage(obj: unknown): void {
    this.emit('message', { data: JSON.stringify(obj) });
  }

  triggerError(): void {
    this.emit('error', {});
  }

  private emit(type: string, ev: unknown): void {
    for (const fn of this.listeners.get(type) ?? []) {
      fn(ev);
    }
  }
}

const IR_DEMO: ProgramaIntermedio = {
  version: 1,
  instrucciones: [
    {
      operacion: 'mostrar',
      argumento1: '"hola"',
      argumento2: null,
      resultado: null,
      linea: 1,
      columna: 1,
      tipo: null,
      nombre: null,
    },
  ],
};

afterEach(() => {
  vi.useRealTimers();
});

describe('Cliente HTTP/WebSocket Python (docs/api.md)', () => {
  it('construye URLs WebSocket /ejecutar para Render y desarrollo local', () => {
    expect(construirUrlWebSocketApi('https://code-compiler-api.onrender.com')).toBe(
      'wss://code-compiler-api.onrender.com/ejecutar',
    );
    expect(construirUrlWebSocketApi('http://127.0.0.1:8000/')).toBe(
      'ws://127.0.0.1:8000/ejecutar',
    );
  });

  it('descarta diagnósticos obsoletos cuando llega una compilación anterior tras editar o cambiar pestaña', async () => {
    const pendientes: Array<{
      codigo: string;
      resolve: (resp: Response) => void;
    }> = [];

    const fetchMock: typeof fetch = (_url, init) =>
      new Promise<Response>((resolve, reject) => {
        const body = JSON.parse(String(init?.body ?? '{}')) as { codigo: string };
        init?.signal?.addEventListener('abort', () => {
          const err = new Error('Aborted');
          err.name = 'AbortError';
          reject(err);
        });
        pendientes.push({ codigo: body.codigo, resolve });
      });

    vi.useFakeTimers();
    const ctrl = new ControladorCompilacion(fetchMock);
    const recibidos: string[] = [];

    ctrl.programar('tab-1', 'https://code-compiler-api.onrender.com', 'mostrar x', {
      delayMs: 750,
      onResultado: (res) => recibidos.push(res.diagnosticos[0]?.mensaje ?? 'ok'),
    });
    vi.advanceTimersByTime(750);
    expect(pendientes).toHaveLength(1);

    // El alumno sigue escribiendo antes de que responda la petición vieja
    ctrl.programar('tab-1', 'https://code-compiler-api.onrender.com', 'mostrar 42', {
      delayMs: 750,
      onResultado: (res) => recibidos.push(res.diagnosticos[0]?.mensaje ?? 'ok'),
    });
    vi.advanceTimersByTime(750);
    expect(pendientes).toHaveLength(2);

    // Responde primero la segunda (vigente) y luego la primera (obsoleta)
    pendientes[1].resolve(
      new Response(JSON.stringify(IR_DEMO), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    pendientes[0].resolve(
      new Response(
        JSON.stringify({
          diagnosticos: [{ etapa: 'semantica', mensaje: 'error viejo', linea: 1, columna: 9 }],
        }),
        { status: 422, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await vi.runAllTimersAsync();
    expect(recibidos).toEqual(['ok']);

    // Reutiliza caché si el código coincide
    const reusado = await ctrl.compilarAhora('tab-1', 'https://code-compiler-api.onrender.com', 'mostrar 42');
    expect(reusado?.intermedio?.version).toBe(1);
    expect(pendientes).toHaveLength(2);
  });

  it('envía un solo mensaje "siguiente" por cada estado con pausado: true y solo pasa el IR en iniciar', async () => {
    let socket!: FakeWebSocket;
    const eventos: EventoEjecucionRemota[] = [];

    const irConExtra = {
      ...IR_DEMO,
      analisis: { tokens: [], arbol: { sentencias: 1 }, simbolos: [] },
    } as ProgramaIntermedio;

    const sesion = iniciarEjecucionRemota('https://code-compiler-api.onrender.com', irConExtra, {
      modo: 'paso',
      crearWebSocket: (url) => {
        socket = new FakeWebSocket(url);
        return socket;
      },
      onEvento: (ev) => eventos.push(ev),
    });

    socket.open();
    expect(socket.sent).toHaveLength(1);
    const inicio = JSON.parse(socket.sent[0]) as Record<string, unknown>;
    expect(inicio.tipo).toBe('iniciar');
    expect(inicio.modo).toBe('paso');
    expect(inicio.intermedio).toEqual(IR_DEMO);
    expect('analisis' in (inicio.intermedio as Record<string, unknown>)).toBe(false);

    // Antes de recibir estado pausado, siguiente() no envía nada
    expect(sesion.siguiente()).toBe(false);
    expect(socket.sent).toHaveLength(1);

    // Recibe estado pausado: permite exactamente un siguiente()
    socket.serverMessage({
      tipo: 'estado',
      linea: 1,
      columna: 1,
      pausado: true,
      pila: ['programa'],
      variables: [],
    });
    expect(sesion.siguiente()).toBe(true);
    expect(sesion.siguiente()).toBe(false);
    expect(socket.sent).toHaveLength(2);
    expect(JSON.parse(socket.sent[1])).toEqual({ tipo: 'siguiente' });

    // Estado final no pausado + fin cierra el socket y conserva última instantánea
    socket.serverMessage({
      tipo: 'estado',
      linea: null,
      columna: null,
      pausado: false,
      pila: ['programa'],
      variables: [
        {
          idInterno: '%v1_x',
          nombre: 'x',
          tipo: 'numero',
          valor: '1/2',
          ambito: 'global',
          cambioReciente: true,
        },
      ],
    });
    socket.serverMessage({ tipo: 'fin' });

    await sesion.promesa;
    expect(socket.closeCalls).toBeGreaterThanOrEqual(1);
    expect(eventos.some((e) => e.tipo === 'fin')).toBe(true);
    expect(sesion.siguiente()).toBe(false);
  });

  it('cierra el WebSocket tras error o cancelación sin duplicar eventos', async () => {
    let socketErr!: FakeWebSocket;
    const evErr: EventoEjecucionRemota[] = [];
    const s1 = iniciarEjecucionRemota('https://code-compiler-api.onrender.com', IR_DEMO, {
      modo: 'continuo',
      crearWebSocket: (url) => {
        socketErr = new FakeWebSocket(url);
        return socketErr;
      },
      onEvento: (ev) => evErr.push(ev),
    });
    socketErr.open();
    socketErr.serverMessage({
      tipo: 'error',
      diagnosticos: [{ etapa: 'ejecucion', mensaje: 'división por cero.', linea: 2, columna: 1 }],
    });
    await s1.promesa;
    expect(socketErr.closeCalls).toBeGreaterThanOrEqual(1);
    expect(evErr.filter((e) => e.tipo === 'error')).toHaveLength(1);

    // Cancelación por cambio de pestaña / AbortController
    let socketCancel!: FakeWebSocket;
    const evCancel: EventoEjecucionRemota[] = [];
    const ac = new AbortController();
    const s2 = iniciarEjecucionRemota('https://code-compiler-api.onrender.com', IR_DEMO, {
      modo: 'continuo',
      signal: ac.signal,
      crearWebSocket: (url) => {
        socketCancel = new FakeWebSocket(url);
        return socketCancel;
      },
      onEvento: (ev) => evCancel.push(ev),
    });
    socketCancel.open();
    ac.abort();
    await s2.promesa;
    expect(socketCancel.closeCalls).toBeGreaterThanOrEqual(1);
    expect(evCancel).toEqual([]);
  });

  it('usa /compilar?analisis=true y detiene la sesión de misión si se agotan las entradas de prueba', async () => {
    let urlConsultada = '';
    const fetchMock: typeof fetch = async (url) => {
      urlConsultada = String(url);
      return new Response(
        JSON.stringify({
          ...IR_DEMO,
          analisis: {
            tokens: [{ tipo: 'PREGUNTAR', texto: 'preguntar', linea: 1, columna: 1 }],
            arbol: { sentencias: 1 },
            simbolos: [{ nombre: 'n', tipo: 'numero', linea: 1, columna: 1, esFuncion: false }],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    };

    let socket!: FakeWebSocket;
    const promesaMision = evaluarMisionConPython(
      'preguntar "A" guardar en n',
      'https://code-compiler-api.onrender.com',
      ['10'],
      {
        fetchImpl: fetchMock,
        crearWebSocket: (url) => {
          socket = new FakeWebSocket(url);
          queueMicrotask(() => {
            socket.open();
            socket.serverMessage({ tipo: 'pregunta', mensaje: 'Primera' });
            socket.serverMessage({ tipo: 'pregunta', mensaje: 'Segunda sin entrada' });
          });
          return socket;
        },
      },
    );

    const resultado = await promesaMision;
    expect(urlConsultada).toBe('https://code-compiler-api.onrender.com/compilar?analisis=true');
    expect(resultado.entradasAgotadas).toBe(true);
    expect(resultado.ok).toBe(false);
    expect(socket.closeCalls).toBeGreaterThanOrEqual(1);
    // Solo respondió la primera pregunta; al agotarse en la segunda cerró el socket
    const respuestas = socket.sent.map((s) => JSON.parse(s)).filter((m) => m.tipo === 'respuesta');
    expect(respuestas).toEqual([{ tipo: 'respuesta', texto: '10' }]);
  });

  it('compilarConApiRemota conserva analisis incluso cuando el código devuelve diagnósticos 422', async () => {
    const fetchMock: typeof fetch = async () =>
      new Response(
        JSON.stringify({
          diagnosticos: [{ etapa: 'semantica', mensaje: "la variable 'x' no está declarada.", linea: 1, columna: 9 }],
          analisis: {
            tokens: [{ tipo: 'MOSTRAR', texto: 'mostrar', linea: 1, columna: 1 }],
            arbol: { sentencias: 1 },
            simbolos: [],
          },
        }),
        { status: 422, headers: { 'Content-Type': 'application/json' } },
      );

    const res = await compilarConApiRemota('https://code-compiler-api.onrender.com', 'mostrar x', {
      analisis: true,
      fetchImpl: fetchMock,
    });
    expect(res.intermedio).toBeNull();
    expect(res.diagnosticos).toHaveLength(1);
    expect(res.analisis?.arbol?.sentencias).toBe(1);
    expect(res.falloConexion).toBe(false);
  });

  it('genera pistas pedagógicas con autoFix para preguntar + suma y líneas separadas', () => {
    const pistaSuma = obtenerPistaPedagogica(
      {
        etapa: 'semantica',
        mensaje: "el operador '+' requiere operandos de tipo numero, pero recibió texto y numero.",
        linea: 3,
        columna: 1,
      },
      'crear variable n\npreguntar "Num" guardar en n\nmostrar n + 5',
    );
    expect(pistaSuma.autoFix).toBeDefined();
    expect(pistaSuma.autoFix!.aplicar('crear variable n\npreguntar "Num" guardar en n')).toContain(
      'asignar n valor de 0',
    );

    const pistaPartida = obtenerPistaPedagogica(
      { etapa: 'gramatica', mensaje: "se esperaba 'guardar'", linea: 2, columna: 1 },
      'crear variable n\npreguntar "Num"\nguardar en n',
    );
    expect(pistaPartida.autoFix).toBeDefined();
    expect(pistaPartida.autoFix!.aplicar('crear variable n\npreguntar "Num"\nguardar en n')).toContain(
      'preguntar "Num" guardar en n',
    );
  });

  it('reintenta apertura WebSocket tras fallo previo a open y completa la sesión', async () => {
    const sockets: FakeWebSocket[] = [];
    const eventos: EventoEjecucionRemota[] = [];
    const sesion = iniciarEjecucionRemota('https://code-compiler-api.onrender.com', IR_DEMO, {
      modo: 'continuo',
      reintentosApertura: 1,
      esperaReintentoMs: 15,
      crearWebSocket: (url) => {
        const s = new FakeWebSocket(url);
        sockets.push(s);
        if (sockets.length === 1) {
          queueMicrotask(() => {
            s.triggerError();
            s.close();
          });
        } else {
          queueMicrotask(() => {
            s.open();
            s.serverMessage({ tipo: 'salida', texto: 'ok' });
            s.serverMessage({ tipo: 'fin' });
          });
        }
        return s;
      },
      onEvento: (ev) => eventos.push(ev),
    });

    await sesion.promesa;
    expect(sockets).toHaveLength(2);
    expect(eventos.some((e) => e.tipo === 'salida' && e.texto === 'ok')).toBe(true);
    expect(eventos.some((e) => e.tipo === 'fin')).toBe(true);
    expect(eventos.some((e) => e.tipo === 'error')).toBe(false);
  });
});
