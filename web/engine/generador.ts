/**
 * Generador de código intermedio de tres direcciones fiel a
 * `src/lenguaje/generador.py` y `src/lenguaje/builder.py`.
 * Emite el contrato JSON versión 1 idéntico al del compilador Python.
 */

import type {
  BloqueAST,
  EntradaAST,
  ExpresionAST,
  Instruccion,
  LimiteAST,
  Posicion,
  ProgramaAST,
  ProgramaIntermedio,
  SentenciaAST,
  TipoEdu,
} from './types';

class Builder {
  readonly instrucciones: Instruccion[] = [];
  private contador = 0;
  private contadorEtiquetas = 0;

  emitir(
    operacion: string,
    argumento1: string | null = null,
    argumento2: string | null = null,
    resultado: string | null = null,
    meta: { linea?: number | null; columna?: number | null; tipo?: string | null; nombre?: string | null } = {},
  ): void {
    this.instrucciones.push({
      operacion,
      argumento1,
      argumento2,
      resultado,
      linea: meta.linea ?? null,
      columna: meta.columna ?? null,
      tipo: meta.tipo ?? null,
      nombre: meta.nombre ?? null,
    });
  }

  temporal(): string {
    this.contador += 1;
    return `%t${this.contador}`;
  }

  nuevaEtiqueta(): string {
    this.contadorEtiquetas += 1;
    return `%L${this.contadorEtiquetas}`;
  }

  declarar(id: string, nombre: string, pos: Posicion): void {
    this.emitir('declarar', null, null, id, { nombre, ...pos });
  }

  asignar(destino: string, valor: string, pos: Posicion): void {
    this.emitir('asignar', valor, null, destino, pos);
  }

  leer(nombre: string, pos: Posicion): string {
    const t = this.temporal();
    this.emitir('leer', nombre, null, t, pos);
    return t;
  }

  operacion(op: string, izq: string, der: string, pos: Posicion): string {
    const t = this.temporal();
    this.emitir(op, izq, der, t, pos);
    return t;
  }

  negar(valor: string, pos: Posicion): string {
    const t = this.temporal();
    this.emitir('no', valor, null, t, pos);
    return t;
  }

  mostrar(valor: string, pos: Posicion): void {
    this.emitir('mostrar', valor, null, null, pos);
  }

  preguntar(mensaje: string, destino: string, tipo: string, pos: Posicion): void {
    this.emitir('preguntar', mensaje, null, destino, { tipo, ...pos });
  }

  etiqueta(nombre: string, pos: Posicion): void {
    this.emitir('etiqueta', null, null, nombre, pos);
  }

  saltar(destino: string, pos: Posicion): void {
    this.emitir('saltar', null, null, destino, pos);
  }

  saltarSiFalso(condicion: string, destino: string, pos: Posicion): void {
    this.emitir('saltar_si_falso', condicion, null, destino, pos);
  }

  abrirAmbito(pos: Posicion): void {
    this.emitir('abrir_ambito', null, null, null, pos);
  }

  cerrarAmbito(pos: Posicion): void {
    this.emitir('cerrar_ambito', null, null, null, pos);
  }

  comprobarRepeticiones(cantidad: string, pos: Posicion): void {
    this.emitir('comprobar_repeticiones', cantidad, null, null, pos);
  }

  aleatorio(minimo: string, maximo: string, pos: Posicion): string {
    const t = this.temporal();
    this.emitir('aleatorio', minimo, maximo, t, pos);
    return t;
  }

  funcion(id: string, entrada: string, retorno: string, nombre: string, pos: Posicion): void {
    this.emitir('funcion', entrada, retorno, id, { nombre, ...pos });
  }

  parametro(posicion: number, destino: string, tipo: string, nombre: string, pos: Posicion): void {
    this.emitir('parametro', String(posicion), null, destino, { tipo, nombre, ...pos });
  }

  llamar(funcionId: string, argumentos: string[], pos: Posicion): string {
    for (let i = 0; i < argumentos.length; i += 1) {
      this.emitir('argumento', argumentos[i], String(i), null, pos);
    }
    const t = this.temporal();
    this.emitir('llamar', funcionId, String(argumentos.length), t, pos);
    return t;
  }

  devolver(valor: string, pos: Posicion): void {
    this.emitir('devolver', valor, null, null, pos);
  }

  finFuncion(id: string, pos: Posicion): void {
    this.emitir('fin_funcion', id, null, null, pos);
  }

  motivacion(modo: 'juego' | 'calculadora', pos: Posicion): void {
    this.emitir('motivacion', modo, null, null, pos);
  }
}

class Generador {
  private readonly builder = new Builder();
  private variables: Map<string, string>[] = [new Map()];
  private funciones: Map<string, string>[] = [new Map()];
  private contadorVariables = 0;
  private contadorFunciones = 0;

  constructor(private readonly tiposEntrada: Map<EntradaAST, TipoEdu>) {}

  private resolver(nombre: string, ambitos: Map<string, string>[]): string {
    for (let i = ambitos.length - 1; i >= 0; i -= 1) {
      const id = ambitos[i].get(nombre);
      if (id) return id;
    }
    throw new Error(`el nombre '${nombre}' no tiene una declaración visible.`);
  }

  private declararVariable(nombre: string): string {
    this.contadorVariables += 1;
    const id = `%v${this.contadorVariables}_${nombre}`;
    this.variables[this.variables.length - 1].set(nombre, id);
    return id;
  }

  generar(programa: ProgramaAST): ProgramaIntermedio {
    for (const s of programa.sentencias) {
      this.visitarSentencia(s);
    }
    return {
      version: 1,
      instrucciones: this.builder.instrucciones,
    };
  }

  private visitarBloque(bloque: BloqueAST): void {
    this.builder.abrirAmbito(bloque.pos);
    this.variables.push(new Map());
    this.funciones.push(new Map());
    try {
      for (const s of bloque.sentencias) {
        this.visitarSentencia(s);
      }
    } finally {
      this.funciones.pop();
      this.variables.pop();
    }
    this.builder.cerrarAmbito(bloque.pos);
  }

  private visitarSentencia(s: SentenciaAST): void {
    switch (s.tipo) {
      case 'Declaracion': {
        const id = this.declararVariable(s.nombre);
        this.builder.declarar(id, s.nombre, s.pos);
        return;
      }
      case 'Asignacion': {
        const valor = this.visitarExpresion(s.expresion);
        const destino = this.resolver(s.nombre, this.variables);
        this.builder.asignar(destino, valor, s.pos);
        return;
      }
      case 'Salida': {
        const valor = this.visitarExpresion(s.expresion);
        this.builder.mostrar(valor, s.pos);
        return;
      }
      case 'Entrada': {
        const destino = this.resolver(s.nombre, this.variables);
        const tipo = this.tiposEntrada.get(s) ?? 'automatico';
        this.builder.preguntar(s.mensajeRaw, destino, tipo, s.pos);
        return;
      }
      case 'Condicional': {
        const alternativa = this.builder.nuevaEtiqueta();
        const fin = this.builder.nuevaEtiqueta();
        const cond = this.visitarExpresion(s.condicion);
        this.builder.saltarSiFalso(cond, alternativa, s.pos);
        this.visitarBloque(s.entonces);
        this.builder.saltar(fin, s.pos);
        this.builder.etiqueta(alternativa, s.pos);
        if (s.sino) {
          this.visitarBloque(s.sino);
        }
        this.builder.etiqueta(fin, s.pos);
        return;
      }
      case 'Mientras': {
        const inicio = this.builder.nuevaEtiqueta();
        const fin = this.builder.nuevaEtiqueta();
        this.builder.etiqueta(inicio, s.pos);
        const cond = this.visitarExpresion(s.condicion);
        this.builder.saltarSiFalso(cond, fin, s.pos);
        this.visitarBloque(s.bloque);
        this.builder.saltar(inicio, s.pos);
        this.builder.etiqueta(fin, s.pos);
        return;
      }
      case 'Repeticion': {
        const cantidad = this.visitarExpresion(s.cantidad);
        this.builder.comprobarRepeticiones(cantidad, s.pos);
        const contador = this.builder.temporal();
        this.builder.asignar(contador, '0', s.pos);
        const inicio = this.builder.nuevaEtiqueta();
        const fin = this.builder.nuevaEtiqueta();
        this.builder.etiqueta(inicio, s.pos);
        const cond = this.builder.operacion('<', contador, cantidad, s.pos);
        this.builder.saltarSiFalso(cond, fin, s.pos);
        this.visitarBloque(s.bloque);
        const siguiente = this.builder.operacion('+', contador, '1', s.pos);
        this.builder.asignar(contador, siguiente, s.pos);
        this.builder.saltar(inicio, s.pos);
        this.builder.etiqueta(fin, s.pos);
        return;
      }
      case 'Funcion': {
        this.contadorFunciones += 1;
        const id = `%f${this.contadorFunciones}_${s.nombre}`;
        this.funciones[this.funciones.length - 1].set(s.nombre, id);
        const entrada = this.builder.nuevaEtiqueta();
        const fin = this.builder.nuevaEtiqueta();
        this.builder.funcion(id, entrada, s.tipoRetorno, s.nombre, s.pos);
        this.builder.saltar(fin, s.pos);
        this.builder.etiqueta(entrada, s.pos);
        this.variables.push(new Map());
        this.funciones.push(new Map());
        try {
          s.parametros.forEach((p, idx) => {
            const destino = this.declararVariable(p.nombre);
            this.builder.parametro(idx, destino, p.tipoParametro, p.nombre, p.pos);
          });
          for (const ins of s.cuerpo.sentencias) {
            this.visitarSentencia(ins);
          }
        } finally {
          this.funciones.pop();
          this.variables.pop();
        }
        this.builder.finFuncion(id, s.pos);
        this.builder.etiqueta(fin, s.pos);
        return;
      }
      case 'Retorno': {
        const val = this.visitarExpresion(s.expresion);
        this.builder.devolver(val, s.pos);
        return;
      }
      case 'LlamadaSentencia':
        this.visitarExpresion(s.llamada);
        return;
      case 'Motivacion':
        this.builder.motivacion(s.modo, s.pos);
        return;
    }
  }

  private visitarExpresion(expr: ExpresionAST): string {
    switch (expr.tipo) {
      case 'NumeroLiteral':
        return expr.raw;
      case 'TextoLiteral':
        return expr.raw;
      case 'LogicoLiteral':
        return expr.valor ? 'verdadero' : 'falso';
      case 'VariableExpr': {
        const id = this.resolver(expr.nombre, this.variables);
        return this.builder.leer(id, expr.pos);
      }
      case 'UnariaExpr': {
        const opVal = this.visitarExpresion(expr.operando);
        if (expr.operador === 'no') {
          return this.builder.negar(opVal, expr.pos);
        }
        return this.builder.operacion('-', '0', opVal, expr.pos);
      }
      case 'BinariaExpr': {
        const izq = this.visitarExpresion(expr.izquierda);
        const der = this.visitarExpresion(expr.derecha);
        return this.builder.operacion(expr.operador, izq, der, {
          linea: expr.tokenOp.linea,
          columna: expr.tokenOp.columna,
        });
      }
      case 'ComparacionExpr': {
        const izq = this.visitarExpresion(expr.izquierda);
        const der = this.visitarExpresion(expr.derecha);
        return this.builder.operacion(expr.operador, izq, der, {
          linea: expr.tokenOp.linea,
          columna: expr.tokenOp.columna,
        });
      }
      case 'AleatorioExpr': {
        const min = this.visitarLimite(expr.minimo);
        const max = this.visitarLimite(expr.maximo);
        return this.builder.aleatorio(min, max, expr.pos);
      }
      case 'LlamadaExpr': {
        const args = expr.argumentos.map((a) => this.visitarExpresion(a));
        const fnId = this.resolver(expr.nombre, this.funciones);
        return this.builder.llamar(fnId, args, expr.pos);
      }
    }
  }

  private visitarLimite(lim: LimiteAST): string {
    if (lim.tipo === 'LimiteVariable') {
      const id = this.resolver(lim.nombre, this.variables);
      return this.builder.leer(id, lim.pos);
    }
    return lim.negativo ? `-${lim.raw}` : lim.raw;
  }
}

export function generarIntermedio(
  programa: ProgramaAST,
  tiposEntrada: Map<EntradaAST, TipoEdu>,
): ProgramaIntermedio {
  const gen = new Generador(tiposEntrada);
  return gen.generar(programa);
}
