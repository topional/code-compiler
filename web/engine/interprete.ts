/**
 * Intérprete asíncrono y paso a paso fiel a `src/lenguaje/interprete.py`.
 * Soporta ejecución continua, paso a paso por línea o instrucción, inspección
 * en vivo de variables en memoria y `preguntar` interactivo sin servidor.
 */

import { Fraction, ZeroDivisionError } from './fraction';
import type {
  Diagnostico,
  EstadoPaso,
  EventoEjecucion,
  Instruccion,
  ProgramaIntermedio,
  TipoEdu,
  VariableMemoria,
} from './types';

type ValorEdu = Fraction | string | boolean | FuncionRuntime | null;

interface FuncionRuntime {
  __funcion: true;
  nombre: string;
  entrada: number;
  tipoRetorno: TipoEdu;
  ambito: AmbitoRuntime;
}

class AmbitoRuntime {
  readonly nombres = new Map<string, ValorEdu>();
  constructor(
    readonly exterior: AmbitoRuntime | null = null,
    readonly etiqueta: string = 'global',
  ) {}

  buscar(id: string): Map<string, ValorEdu> {
    let actual: AmbitoRuntime | null = this;
    while (actual !== null) {
      if (actual.nombres.has(id)) return actual.nombres;
      actual = actual.exterior;
    }
    throw new Error(`'${id}' no está declarado en este ámbito.`);
  }
}

class MarcoRuntime {
  readonly temporales = new Map<string, ValorEdu>();
  pendientes: ValorEdu[] = [];

  constructor(
    public ambitos: AmbitoRuntime[],
    public readonly argumentos: ValorEdu[] = [],
    public readonly tipoRetorno: TipoEdu | null = null,
    public readonly nombreFuncion: string = 'programa',
  ) {}

  get ambito(): AmbitoRuntime {
    return this.ambitos[this.ambitos.length - 1];
  }

  valor(operando: string): ValorEdu {
    if (operando.startsWith('%t')) {
      if (!this.temporales.has(operando)) {
        throw new Error(`el temporal '${operando}' no tiene un valor.`);
      }
      return this.temporales.get(operando)!;
    }
    if (operando.startsWith('%v')) {
      const mapa = this.ambito.buscar(operando);
      const val = mapa.get(operando) ?? null;
      if (val === null) {
        const idx = operando.indexOf('_');
        const nombre = idx >= 0 ? operando.slice(idx + 1) : operando;
        throw new Error(`la variable '${nombre}' no está inicializada.`);
      }
      return val;
    }
    if (operando.startsWith('"')) {
      return decodificarTextoEdu(operando);
    }
    if (operando === 'verdadero') return true;
    if (operando === 'falso') return false;
    return Fraction.parse(operando);
  }

  guardar(destino: string, valor: ValorEdu): void {
    if (destino.startsWith('%t')) {
      this.temporales.set(destino, valor);
    } else {
      this.ambito.buscar(destino).set(destino, valor);
    }
  }
}

function decodificarTextoEdu(raw: string): string {
  // Conserva tabulaciones literales (como json.loads(..., strict=False) en Python)
  let out = '';
  for (let i = 1; i < raw.length - 1; i += 1) {
    const ch = raw[i];
    if (ch === '\\' && i + 1 < raw.length - 1) {
      const next = raw[i + 1];
      i += 1;
      if (next === 'n') out += '\n';
      else if (next === 'r') out += '\r';
      else if (next === 't') out += '\t';
      else if (next === '"') out += '"';
      else if (next === '\\') out += '\\';
      else out += `\\${next}`;
    } else {
      out += ch;
    }
  }
  return out;
}

function esFuncion(val: ValorEdu): val is FuncionRuntime {
  return typeof val === 'object' && val !== null && '__funcion' in val;
}

function tipoDeValor(val: ValorEdu): TipoEdu | 'sin_valor' {
  if (val instanceof Fraction) return 'numero';
  if (typeof val === 'string') return 'texto';
  if (typeof val === 'boolean') return 'logico';
  return 'sin_valor';
}

function exigirTipo(val: ValorEdu, tipo: TipoEdu): ValorEdu {
  const actual = tipoDeValor(val);
  if (actual !== tipo) {
    throw new Error(`se esperaba un valor de tipo ${tipo}.`);
  }
  return val;
}

function exigirEntero(val: ValorEdu, mensaje: string): bigint {
  if (!(val instanceof Fraction) || !val.isInteger) {
    throw new Error(mensaje);
  }
  return val.num;
}

export function formatearValor(val: ValorEdu): string {
  if (typeof val === 'boolean') return val ? 'verdadero' : 'falso';
  if (val instanceof Fraction) return val.toString();
  if (typeof val === 'string') return val;
  return '—';
}

function aleatorioEntero(min: bigint, max: bigint): bigint {
  const rango = max - min + 1n;
  if (rango <= BigInt(Number.MAX_SAFE_INTEGER)) {
    const offset = BigInt(Math.floor(Math.random() * Number(rango)));
    return min + offset;
  }
  // Rango enorme: usar muestreo en bloques de 32 bits
  const bits = rango.toString(2).length;
  const bytes = Math.ceil(bits / 8);
  let valor = 0n;
  for (let i = 0; i < bytes; i += 1) {
    valor = (valor << 8n) | BigInt(Math.floor(Math.random() * 256));
  }
  return min + (valor % rango);
}

function extraerEtiquetas(instrucciones: Instruccion[]): Map<string, number> {
  const etiquetas = new Map<string, number>();
  instrucciones.forEach((ins, idx) => {
    if (ins.operacion === 'etiqueta' && ins.resultado) {
      if (etiquetas.has(ins.resultado)) {
        throw new Error(`etiqueta duplicada '${ins.resultado}'.`);
      }
      etiquetas.set(ins.resultado, idx);
    }
  });
  return etiquetas;
}

function capturarMemoria(
  marco: MarcoRuntime,
  ultimaModificada: string | null,
): VariableMemoria[] {
  const vars: VariableMemoria[] = [];
  const cadena: AmbitoRuntime[] = [];
  let cursor: AmbitoRuntime | null = marco.ambito;
  while (cursor !== null) {
    cadena.unshift(cursor);
    cursor = cursor.exterior;
  }

  for (const amb of cadena) {
    for (const [id, val] of amb.nombres.entries()) {
      if (!id.startsWith('%v') || esFuncion(val)) continue;
      const idx = id.indexOf('_');
      const nombre = idx >= 0 ? id.slice(idx + 1) : id;
      vars.push({
        idInterno: id,
        nombre,
        tipo: tipoDeValor(val),
        valor: val === null ? 'sin valor' : formatearValor(val),
        ambito: amb.etiqueta,
        cambioReciente: id === ultimaModificada,
      });
    }
  }
  return vars;
}

export interface OpcionesEjecucion {
  onEvento: (evento: EventoEjecucion) => void;
  leerEntrada: (mensaje: string, tipoEsperado: TipoEdu, linea: number | null) => Promise<string | null>;
  esperarPaso?: (estado: EstadoPaso) => Promise<boolean>; // devuelve false para detener
  maxPasos?: number;
  maxSalidaBytes?: number;
  signal?: AbortSignal;
}

export async function ejecutarIntermedio(
  intermedio: ProgramaIntermedio,
  opciones: OpcionesEjecucion,
): Promise<void> {
  const inicioMs = performance.now();
  const instrucciones = intermedio.instrucciones;
  const maxPasos = opciones.maxPasos ?? 60_000;
  const maxSalidaBytes = opciones.maxSalidaBytes ?? 64 * 1024;

  let etiquetas: Map<string, number>;
  try {
    etiquetas = extraerEtiquetas(instrucciones);
  } catch (err) {
    opciones.onEvento({
      tipo: 'error',
      diagnosticos: [
        {
          etapa: 'intermedio',
          mensaje: err instanceof Error ? err.message : 'Código intermedio inválido.',
          linea: null,
          columna: null,
        },
      ],
    });
    return;
  }

  let marco = new MarcoRuntime([new AmbitoRuntime(null, 'global')], [], null, 'programa');
  const pila: { marco: MarcoRuntime; posicion: number; destino: string }[] = [];
  let posicion = 0;
  let pasosTotales = 0;
  let totalSalida = 0;
  let ultimaVariableModificada: string | null = null;
  let ultimaInstruccion: Instruccion | null = null;

  const emitirDiagnostico = (ins: Instruccion | null, etapa: 'ejecucion' | 'limite', mensaje: string) => {
    const diag: Diagnostico = {
      etapa,
      mensaje,
      linea: ins?.linea ?? null,
      columna: ins?.columna ?? null,
    };
    opciones.onEvento({ tipo: 'error', diagnosticos: [diag] });
  };

  while (posicion < instrucciones.length) {
    if (opciones.signal?.aborted) {
      return;
    }

    pasosTotales += 1;
    if (pasosTotales > maxPasos) {
      emitirDiagnostico(
        instrucciones[posicion],
        'limite',
        `Se superó el límite de ${maxPasos.toLocaleString('es-ES')} pasos (¿posible ciclo infinito?). Revisa la condición de tu ciclo.`,
      );
      return;
    }

    const ins = instrucciones[posicion];
    ultimaInstruccion = ins;
    const indiceActual = posicion;
    const op = ins.operacion;
    const primero = ins.argumento1 ?? '';
    const segundo = ins.argumento2 ?? '';
    const destino = ins.resultado ?? '';
    posicion += 1;

    try {
      ultimaVariableModificada = null;

      switch (op) {
        case 'declarar':
          marco.ambito.nombres.set(destino, null);
          ultimaVariableModificada = destino;
          break;

        case 'asignar':
        case 'leer': {
          const val = marco.valor(primero);
          marco.guardar(destino, val);
          if (destino.startsWith('%v')) {
            ultimaVariableModificada = destino;
          }
          break;
        }

        case '+':
        case '-':
        case '*':
        case '/':
        case '<':
        case '>':
        case '<=':
        case '>=': {
          const izq = exigirTipo(marco.valor(primero), 'numero') as Fraction;
          const der = exigirTipo(marco.valor(segundo), 'numero') as Fraction;
          let res: ValorEdu;
          if (op === '+') res = izq.add(der);
          else if (op === '-') res = izq.sub(der);
          else if (op === '*') res = izq.mul(der);
          else if (op === '/') res = izq.div(der);
          else if (op === '<') res = izq.compare(der) < 0;
          else if (op === '>') res = izq.compare(der) > 0;
          else if (op === '<=') res = izq.compare(der) <= 0;
          else res = izq.compare(der) >= 0;
          marco.guardar(destino, res);
          break;
        }

        case '==':
        case '!=': {
          const izq = marco.valor(primero);
          const der = marco.valor(segundo);
          if (tipoDeValor(izq) !== tipoDeValor(der)) {
            throw new Error('no se pueden comparar valores de tipos diferentes.');
          }
          const iguales =
            izq instanceof Fraction && der instanceof Fraction
              ? izq.equals(der)
              : izq === der;
          marco.guardar(destino, op === '==' ? iguales : !iguales);
          break;
        }

        case 'y':
        case 'o': {
          const izq = exigirTipo(marco.valor(primero), 'logico') as boolean;
          const der = exigirTipo(marco.valor(segundo), 'logico') as boolean;
          marco.guardar(destino, op === 'y' ? izq && der : izq || der);
          break;
        }

        case 'no': {
          const val = exigirTipo(marco.valor(primero), 'logico') as boolean;
          marco.guardar(destino, !val);
          break;
        }

        case 'mostrar': {
          const texto = formatearValor(marco.valor(primero));
          const bytes = Math.max(1, new TextEncoder().encode(texto).length);
          totalSalida += bytes;
          if (totalSalida > maxSalidaBytes) {
            emitirDiagnostico(ins, 'limite', 'Se superó el límite de 64 KiB de salida.');
            return;
          }
          opciones.onEvento({ tipo: 'salida', texto, linea: ins.linea });
          break;
        }

        case 'preguntar': {
          const nombres = marco.ambito.buscar(destino);
          let tipo: TipoEdu;
          if (ins.tipo === 'numero' || ins.tipo === 'texto' || ins.tipo === 'logico') {
            tipo = ins.tipo;
          } else {
            const actual = nombres.get(destino) ?? null;
            const t = tipoDeValor(actual);
            tipo = t === 'sin_valor' ? 'texto' : t;
          }
          const mensaje = exigirTipo(marco.valor(primero), 'texto') as string;
          let convertido: ValorEdu | undefined;
          while (convertido === undefined) {
            if (opciones.signal?.aborted) return;
            opciones.onEvento({ tipo: 'pregunta', mensaje, tipoEsperado: tipo, linea: ins.linea });
            const respuesta = await opciones.leerEntrada(mensaje, tipo, ins.linea);
            if (respuesta === null || opciones.signal?.aborted) {
              return;
            }
            try {
              if (tipo === 'numero') {
                convertido = Fraction.parse(respuesta);
              } else if (tipo === 'logico') {
                const norm = respuesta.trim().toLowerCase();
                if (norm === 'verdadero') convertido = true;
                else if (norm === 'falso') convertido = false;
                else throw new Error('invalido');
              } else {
                convertido = respuesta;
              }
            } catch {
              opciones.onEvento({
                tipo: 'entrada_invalida',
                mensaje: `Entrada inválida. Se esperaba un valor de tipo ${tipo}.`,
                linea: ins.linea,
              });
            }
          }
          nombres.set(destino, convertido);
          ultimaVariableModificada = destino;
          break;
        }

        case 'saltar':
          posicion = etiquetas.get(destino)!;
          break;

        case 'saltar_si_falso': {
          const cond = exigirTipo(marco.valor(primero), 'logico') as boolean;
          if (!cond) {
            posicion = etiquetas.get(destino)!;
          }
          break;
        }

        case 'abrir_ambito':
          marco.ambitos.push(new AmbitoRuntime(marco.ambito, `bloque (L${ins.linea ?? '?'})`));
          break;

        case 'cerrar_ambito':
          if (marco.ambitos.length === 1) {
            throw new Error('no hay un bloque abierto para cerrar.');
          }
          marco.ambitos.pop();
          break;

        case 'comprobar_repeticiones': {
          const msg = 'la cantidad de repeticiones debe ser un entero no negativo.';
          const val = exigirEntero(marco.valor(primero), msg);
          if (val < 0n) throw new Error(msg);
          break;
        }

        case 'aleatorio': {
          const msg = 'los límites del aleatorio deben ser enteros.';
          const min = exigirEntero(marco.valor(primero), msg);
          const max = exigirEntero(marco.valor(segundo), msg);
          if (min > max) {
            throw new Error('el límite mínimo del aleatorio no puede ser mayor que el máximo.');
          }
          marco.guardar(destino, Fraction.fromInt(aleatorioEntero(min, max)));
          break;
        }

        case 'funcion': {
          const fn: FuncionRuntime = {
            __funcion: true,
            nombre: ins.nombre ?? destino,
            entrada: etiquetas.get(primero)!,
            tipoRetorno: segundo as TipoEdu,
            ambito: marco.ambito,
          };
          marco.ambito.nombres.set(destino, fn);
          break;
        }

        case 'argumento': {
          const idx = Number.parseInt(segundo, 10);
          if (idx !== marco.pendientes.length) {
            throw new Error('los argumentos de la llamada están fuera de orden.');
          }
          marco.pendientes.push(marco.valor(primero));
          break;
        }

        case 'llamar': {
          const fn = marco.ambito.buscar(primero).get(primero) ?? null;
          if (!esFuncion(fn)) {
            throw new Error(`'${primero}' no es una función.`);
          }
          const args = marco.pendientes;
          if (args.length !== Number.parseInt(segundo, 10)) {
            throw new Error('la cantidad de argumentos de la llamada es incorrecta.');
          }
          if (pila.length >= 256) {
            emitirDiagnostico(ins, 'limite', 'Se superó la profundidad máxima de llamadas recursivas.');
            return;
          }
          marco.pendientes = [];
          pila.push({ marco, posicion, destino });
          marco = new MarcoRuntime(
            [new AmbitoRuntime(fn.ambito, `función ${fn.nombre}`)],
            args,
            fn.tipoRetorno,
            fn.nombre,
          );
          posicion = fn.entrada;
          break;
        }

        case 'parametro': {
          const idx = Number.parseInt(primero, 10);
          if (idx < 0 || idx >= marco.argumentos.length) {
            throw new Error('falta un argumento para el parámetro.');
          }
          const tipoEsperado = (ins.tipo ?? 'numero') as TipoEdu;
          marco.ambito.nombres.set(destino, exigirTipo(marco.argumentos[idx], tipoEsperado));
          ultimaVariableModificada = destino;
          break;
        }

        case 'devolver': {
          if (pila.length === 0) {
            throw new Error("'devolver' requiere una llamada activa.");
          }
          const val = exigirTipo(marco.valor(primero), marco.tipoRetorno!);
          const anterior = pila.pop()!;
          marco = anterior.marco;
          posicion = anterior.posicion;
          marco.guardar(anterior.destino, val);
          break;
        }

        case 'fin_funcion':
          throw new Error('la función terminó sin devolver un valor.');

        case 'motivacion':
          if (primero === 'juego' || primero === 'calculadora') {
            opciones.onEvento({ tipo: 'motivacion', modo: primero, linea: ins.linea });
          }
          break;

        case 'etiqueta':
          break;

        default:
          throw new Error(`operación desconocida '${op}'.`);
      }

      // Notificación paso a paso (cuando hay pausa/velocidad o seguimiento activo)
      const operacionesObservables = new Set([
        'declarar',
        'asignar',
        'mostrar',
        'preguntar',
        'saltar_si_falso',
        'llamar',
        'devolver',
        'aleatorio',
        'motivacion',
      ]);

      if (opciones.esperarPaso && operacionesObservables.has(op)) {
        const estadoPaso: EstadoPaso = {
          indiceInstruccion: indiceActual,
          operacion: op,
          linea: ins.linea,
          columna: ins.columna,
          variables: capturarMemoria(marco, ultimaVariableModificada),
          pilaLlamadas: [...pila.map((p) => p.marco.nombreFuncion), marco.nombreFuncion],
          pasosTotales,
        };
        opciones.onEvento({ tipo: 'paso', estado: estadoPaso });
        const continuar = await opciones.esperarPaso(estadoPaso);
        if (!continuar) return;
      }
    } catch (err) {
      if (err instanceof ZeroDivisionError) {
        emitirDiagnostico(ins, 'ejecucion', 'división por cero.');
        return;
      }
      emitirDiagnostico(ins, 'ejecucion', err instanceof Error ? err.message : 'Error de ejecución.');
      return;
    }
  }

  if (pila.length > 0 || marco.ambitos.length !== 1) {
    emitirDiagnostico(
      ultimaInstruccion,
      'ejecucion',
      'el programa terminó con una llamada o un bloque abierto.',
    );
    return;
  }

  // Emitir estado final de memoria para la vista de cajitas
  opciones.onEvento({
    tipo: 'paso',
    estado: {
      indiceInstruccion: instrucciones.length - 1,
      operacion: 'fin',
      linea: null,
      columna: null,
      variables: capturarMemoria(marco, ultimaVariableModificada),
      pilaLlamadas: ['programa'],
      pasosTotales,
    },
  });

  opciones.onEvento({
    tipo: 'fin',
    pasosTotales,
    duracionMs: Math.round((performance.now() - inicioMs) * 10) / 10,
  });
}
