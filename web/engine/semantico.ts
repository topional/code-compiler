/**
 * Analizador semántico y tabla de símbolos fiel a `src/lenguaje/semantico.py`
 * y `src/lenguaje/tabla_simbolos.py`.
 */

import { Fraction } from './fraction';
import type {
  BloqueAST,
  Diagnostico,
  EntradaAST,
  ExpresionAST,
  FuncionAST,
  LimiteAST,
  ParametroAST,
  Posicion,
  ProgramaAST,
  ResumenSimbolo,
  SentenciaAST,
  TipoEdu,
  Token,
} from './types';

const ERROR = 'error' as const;
type TipoResultado = TipoEdu | typeof ERROR | null;

interface Simbolo {
  nombre: string;
  linea: number;
  columna: number;
  ambitoNombre: string;
  tipo: TipoEdu | null;
  inicializada: boolean;
  valorNumerico: Fraction | null;
}

type EstadoSimbolo = [Simbolo, TipoEdu | null, boolean, Fraction | null];

interface FuncionSemantica {
  nombre: string;
  parametros: ParametroAST[];
  retorno: TipoEdu;
  cuerpo: SentenciaAST[];
  variablesVisibles: Map<string, Simbolo>[];
  funcionesVisibles: Map<string, FuncionSemantica>[];
}

interface MarcoFuncion {
  funcion: FuncionSemantica;
  exteriores: Simbolo[];
  salidas: EstadoSimbolo[][];
  comprobarDefinicion: boolean;
}

export interface ResultadoSemantico {
  diagnosticos: Diagnostico[];
  tiposEntrada: Map<EntradaAST, TipoEdu>;
  simbolos: ResumenSimbolo[];
}

class AnalizadorSemantico {
  private ambitos: Map<string, Simbolo>[] = [new Map()];
  private nombresAmbitos: string[] = ['global'];
  private funciones: Map<string, FuncionSemantica>[] = [new Map()];
  private marcos: MarcoFuncion[] = [];
  private diagnosticosUnicos = new Set<string>();
  private todosLosSimbolos: Simbolo[] = [];
  private funcionesRegistradas: ResumenSimbolo[] = [];

  readonly errores: Diagnostico[] = [];
  readonly tiposEntrada = new Map<EntradaAST, TipoEdu>();

  private agregarError(pos: Posicion, mensaje: string): typeof ERROR {
    const clave = `${pos.linea}:${pos.columna}:${mensaje}`;
    if (!this.diagnosticosUnicos.has(clave)) {
      this.diagnosticosUnicos.add(clave);
      this.errores.push({
        etapa: 'semantica',
        mensaje,
        linea: pos.linea,
        columna: pos.columna,
      });
    }
    return ERROR;
  }

  private declarar(token: Token, tipo: TipoEdu | null = null, inicializada = false): void {
    const actual = this.ambitos[this.ambitos.length - 1];
    const anterior = actual.get(token.texto);
    if (anterior) {
      this.agregarError(
        { linea: token.linea, columna: token.columna },
        `la variable '${token.texto}' ya está declarada en este ámbito (primera declaración en ${anterior.linea}:${anterior.columna}). Usa 'asignar' para cambiar su valor.`,
      );
      return;
    }
    const nuevo: Simbolo = {
      nombre: token.texto,
      linea: token.linea,
      columna: token.columna,
      ambitoNombre: this.nombresAmbitos[this.nombresAmbitos.length - 1] ?? 'bloque',
      tipo,
      inicializada,
      valorNumerico: null,
    };
    actual.set(token.texto, nuevo);
    this.todosLosSimbolos.push(nuevo);
  }

  private buscarEnAmbitos(nombre: string): Simbolo | null {
    for (let i = this.ambitos.length - 1; i >= 0; i -= 1) {
      const sym = this.ambitos[i].get(nombre);
      if (sym) return sym;
    }
    return null;
  }

  private buscar(token: Token): Simbolo | null {
    const sym = this.buscarEnAmbitos(token.texto);
    if (!sym) {
      this.agregarError(
        { linea: token.linea, columna: token.columna },
        `la variable '${token.texto}' no está declarada. Declárala antes con 'crear variable ${token.texto}'.`,
      );
    }
    return sym;
  }

  private leer(token: Token): TipoResultado {
    const sym = this.buscar(token);
    if (!sym) return ERROR;
    if (!sym.inicializada) {
      return this.agregarError(
        { linea: token.linea, columna: token.columna },
        `la variable '${sym.nombre}' se usa sin inicializar (declarada en ${sym.linea}:${sym.columna}). Asígnale un valor antes de leerla.`,
      );
    }
    return sym.tipo;
  }

  private estado(): EstadoSimbolo[] {
    const out: EstadoSimbolo[] = [];
    for (const ambito of this.ambitos) {
      for (const sym of ambito.values()) {
        out.push([sym, sym.tipo, sym.inicializada, sym.valorNumerico]);
      }
    }
    return out;
  }

  private restaurar(estado: EstadoSimbolo[]): void {
    for (const [sym, tipo, inicializada, valorNumerico] of estado) {
      sym.tipo = tipo;
      sym.inicializada = inicializada;
      sym.valorNumerico = valorNumerico;
    }
  }

  private olvidarConstantes(): void {
    for (const ambito of this.ambitos) {
      for (const sym of ambito.values()) {
        sym.valorNumerico = null;
      }
    }
  }

  private combinar(antes: EstadoSimbolo[], caminos: EstadoSimbolo[][], pos: Posicion): void {
    for (let i = 0; i < antes.length; i += 1) {
      const [simbolo, tipoPrevio] = antes[i];
      const tiposSet = new Set<TipoEdu>();
      for (const camino of caminos) {
        const t = camino[i][1];
        if (t !== null) tiposSet.add(t);
      }
      if (tiposSet.size > 1) {
        const lista = Array.from(tiposSet).sort().join(' y ');
        this.agregarError(
          pos,
          `las ramas asignan tipos incompatibles a '${simbolo.nombre}': ${lista}. Usa el mismo tipo en todas las ramas.`,
        );
      }
      let primerTipo: TipoEdu | null = null;
      for (const camino of caminos) {
        if (camino[i][1] !== null) {
          primerTipo = camino[i][1];
          break;
        }
      }
      simbolo.tipo = tipoPrevio ?? primerTipo;
      simbolo.inicializada = caminos.every((c) => c[i][2]);

      const valoresMap = new Map<string, Fraction | null>();
      for (const camino of caminos) {
        const v = camino[i][3];
        valoresMap.set(v ? v.key() : 'null', v);
      }
      simbolo.valorNumerico = valoresMap.size === 1 ? Array.from(valoresMap.values())[0] : null;
    }
  }

  private exigirTipo(
    pos: Posicion,
    tipo: TipoResultado,
    esperado: TipoEdu,
    descripcion: string,
  ): TipoResultado {
    if (tipo !== null && tipo !== ERROR && tipo !== esperado) {
      return this.agregarError(
        pos,
        `${descripcion} debe ser de tipo ${esperado}, pero recibió ${tipo}.`,
      );
    }
    return tipo;
  }

  private numeroConstante(expr: ExpresionAST): Fraction | null {
    switch (expr.tipo) {
      case 'NumeroLiteral':
        try {
          return Fraction.parse(expr.raw);
        } catch {
          this.agregarError(expr.pos, 'el literal numérico supera el tamaño admitido.');
          return null;
        }
      case 'VariableExpr': {
        const sym = this.buscarEnAmbitos(expr.nombre);
        return sym ? sym.valorNumerico : null;
      }
      case 'UnariaExpr': {
        if (expr.operador === '-') {
          const val = this.numeroConstante(expr.operando);
          return val ? val.neg() : null;
        }
        return null;
      }
      case 'BinariaExpr': {
        if (expr.operador === 'y' || expr.operador === 'o') return null;
        const izq = this.numeroConstante(expr.izquierda);
        const der = this.numeroConstante(expr.derecha);
        if (!izq || !der) return null;
        if (expr.operador === '+') return izq.add(der);
        if (expr.operador === '-') return izq.sub(der);
        if (expr.operador === '*') return izq.mul(der);
        if (!der.isZero) return izq.div(der);
        return null;
      }
      default:
        return null;
    }
  }

  private limiteConstante(limite: LimiteAST): Fraction | null {
    if (limite.tipo === 'LimiteNumero') {
      try {
        const val = Fraction.parse(limite.raw);
        return limite.negativo ? val.neg() : val;
      } catch {
        this.agregarError(limite.pos, 'el literal numérico supera el tamaño admitido.');
        return null;
      }
    }
    const sym = this.buscarEnAmbitos(limite.nombre);
    return sym ? sym.valorNumerico : null;
  }

  private sentenciaTermina(s: SentenciaAST): boolean {
    if (s.tipo === 'Retorno') return true;
    if (s.tipo === 'Condicional' && s.sino !== null) {
      return (
        this.retornoGarantizado(s.entonces.sentencias) &&
        this.retornoGarantizado(s.sino.sentencias)
      );
    }
    return false;
  }

  private retornoGarantizado(sentencias: SentenciaAST[]): boolean {
    for (const s of sentencias) {
      if (this.sentenciaTermina(s)) return true;
    }
    return false;
  }

  analizar(programa: ProgramaAST): ResultadoSemantico {
    for (const s of programa.sentencias) {
      this.visitarSentencia(s);
    }

    const vistos = new Set<string>();
    const simbolos: ResumenSimbolo[] = [];

    for (const fn of this.funcionesRegistradas) {
      simbolos.push(fn);
    }
    for (const s of this.todosLosSimbolos) {
      const clave = `${s.ambitoNombre}:${s.nombre}:${s.linea}:${s.columna}`;
      if (vistos.has(clave)) continue;
      vistos.add(clave);
      simbolos.push({
        nombre: s.nombre,
        ambito: s.ambitoNombre,
        tipo: s.tipo ?? 'desconocido',
        inicializada: s.inicializada,
        linea: s.linea,
        columna: s.columna,
      });
    }

    return {
      diagnosticos: this.errores,
      tiposEntrada: this.tiposEntrada,
      simbolos,
    };
  }

  private visitarSentenciasBloque(sentencias: SentenciaAST[]): void {
    for (const s of sentencias) {
      this.visitarSentencia(s);
      const marcoActual = this.marcos[this.marcos.length - 1];
      if (marcoActual && !marcoActual.comprobarDefinicion && this.sentenciaTermina(s)) {
        break;
      }
    }
  }

  private visitarBloque(bloque: BloqueAST, nombreAmbito: string): void {
    this.funciones.push(new Map());
    this.ambitos.push(new Map());
    this.nombresAmbitos.push(nombreAmbito);
    try {
      this.visitarSentenciasBloque(bloque.sentencias);
    } finally {
      this.nombresAmbitos.pop();
      this.ambitos.pop();
      this.funciones.pop();
    }
  }

  private visitarSentencia(s: SentenciaAST): void {
    switch (s.tipo) {
      case 'Declaracion':
        this.declarar(s.tokenId);
        return;

      case 'Asignacion': {
        const sym = this.buscar(s.tokenId);
        const tipo = this.visitarExpresion(s.expresion);
        if (!sym || tipo === ERROR) return;
        if (sym.tipo !== null && tipo !== null && sym.tipo !== tipo) {
          this.agregarError(
            { linea: s.tokenId.linea, columna: s.tokenId.columna },
            `no se puede asignar un valor de tipo ${tipo} a '${sym.nombre}', que tiene tipo ${sym.tipo}. Asigna un valor de tipo ${sym.tipo}.`,
          );
          return;
        }
        if (sym.tipo === null) {
          sym.tipo = tipo;
        }
        sym.inicializada = true;
        sym.valorNumerico = tipo === 'numero' ? this.numeroConstante(s.expresion) : null;
        return;
      }

      case 'Salida':
        this.visitarExpresion(s.expresion);
        return;

      case 'Entrada': {
        const sym = this.buscar(s.tokenId);
        if (sym) {
          sym.tipo = sym.tipo ?? 'texto';
          this.tiposEntrada.set(s, sym.tipo);
          sym.inicializada = true;
          sym.valorNumerico = null;
        }
        return;
      }

      case 'Condicional': {
        this.exigirTipo(
          s.condicion.pos,
          this.visitarExpresion(s.condicion),
          'logico',
          "la condición de 'si'",
        );
        const antes = this.estado();
        const caminos: EstadoSimbolo[][] = [];
        const bloques: { bloque: BloqueAST; nombre: string }[] = [
          { bloque: s.entonces, nombre: `si:${s.pos.linea}` },
        ];
        if (s.sino) {
          bloques.push({ bloque: s.sino, nombre: `sino:${s.sino.pos.linea}` });
        }
        for (const item of bloques) {
          this.restaurar(antes);
          this.visitarBloque(item.bloque, item.nombre);
          if (!this.retornoGarantizado(item.bloque.sentencias)) {
            caminos.push(this.estado());
          }
        }
        if (!s.sino) {
          caminos.push(antes);
        }
        if (caminos.length > 0) {
          this.combinar(antes, caminos, s.pos);
        } else {
          this.restaurar(antes);
        }
        return;
      }

      case 'Mientras': {
        this.olvidarConstantes();
        this.exigirTipo(
          s.condicion.pos,
          this.visitarExpresion(s.condicion),
          'logico',
          "la condición de 'mientras'",
        );
        this.visitarCiclo(s.bloque, s.pos, `mientras:${s.pos.linea}`);
        return;
      }

      case 'Repeticion': {
        const tipo = this.exigirTipo(
          s.cantidad.pos,
          this.visitarExpresion(s.cantidad),
          'numero',
          'la cantidad de repeticiones',
        );
        if (tipo === 'numero') {
          const val = this.numeroConstante(s.cantidad);
          if (val !== null && (!val.isInteger || val.num < 0n)) {
            this.agregarError(
              s.cantidad.pos,
              'la cantidad de repeticiones debe ser un entero no negativo.',
            );
          }
        }
        this.visitarCiclo(s.bloque, s.pos, `repetir:${s.pos.linea}`);
        return;
      }

      case 'Funcion':
        this.visitarFuncion(s);
        return;

      case 'Retorno': {
        const tipo = this.visitarExpresion(s.expresion);
        if (this.marcos.length === 0) {
          this.agregarError(s.pos, "'devolver' solo puede usarse dentro de una función.");
          return;
        }
        const marco = this.marcos[this.marcos.length - 1];
        this.exigirTipo(s.expresion.pos, tipo, marco.funcion.retorno, 'el valor devuelto');
        if (!marco.comprobarDefinicion) {
          marco.salidas.push(
            marco.exteriores.map((sym) => [sym, sym.tipo, sym.inicializada, sym.valorNumerico]),
          );
        }
        return;
      }

      case 'LlamadaSentencia':
        this.visitarExpresion(s.llamada);
        return;

      case 'Motivacion':
        return;
    }
  }

  private visitarCiclo(bloque: BloqueAST, pos: Posicion, nombreAmbito: string): void {
    const antes = this.estado();
    this.olvidarConstantes();
    this.visitarBloque(bloque, nombreAmbito);
    if (this.retornoGarantizado(bloque.sentencias)) {
      this.restaurar(antes);
    } else {
      this.combinar(antes, [antes, this.estado()], pos);
    }
  }

  private visitarFuncion(fn: FuncionAST): void {
    const funcion: FuncionSemantica = {
      nombre: fn.nombre,
      parametros: fn.parametros,
      retorno: fn.tipoRetorno,
      cuerpo: fn.cuerpo.sentencias,
      variablesVisibles: this.ambitos.map((a) => new Map(a)),
      funcionesVisibles: [],
    };

    const ambitoFuncionesActual = this.funciones[this.funciones.length - 1];
    if (ambitoFuncionesActual.has(fn.nombre)) {
      this.agregarError(
        { linea: fn.tokenId.linea, columna: fn.tokenId.columna },
        `la función '${fn.nombre}' ya está declarada en este ámbito.`,
      );
    } else {
      ambitoFuncionesActual.set(fn.nombre, funcion);
      this.funcionesRegistradas.push({
        nombre: fn.nombre,
        ambito: this.nombresAmbitos[this.nombresAmbitos.length - 1] ?? 'global',
        tipo: fn.tipoRetorno,
        inicializada: true,
        linea: fn.tokenId.linea,
        columna: fn.tokenId.columna,
        esFuncion: true,
        firma: `${fn.nombre}(${fn.parametros.map((p) => `${p.tipoParametro} ${p.nombre}`).join(', ')}) → ${fn.tipoRetorno}`,
      });
    }

    funcion.funcionesVisibles = this.funciones.map((f) => new Map(f));

    if (!this.retornoGarantizado(fn.cuerpo.sentencias)) {
      this.agregarError(
        { linea: fn.tokenId.linea, columna: fn.tokenId.columna },
        `la función '${fn.nombre}' debe devolver un valor en todos los caminos.`,
      );
    }

    this.analizarFuncion(funcion, fn.pos, true);
  }

  private analizarFuncion(
    funcion: FuncionSemantica,
    pos: Posicion,
    comprobarDefinicion = false,
  ): void {
    const variablesLlamador = this.ambitos;
    const funcionesLlamador = this.funciones;
    const nombresLlamador = this.nombresAmbitos;

    this.ambitos = [...funcion.variablesVisibles, new Map()];
    this.funciones = [...funcion.funcionesVisibles, new Map()];
    this.nombresAmbitos = [...nombresLlamador, `función ${funcion.nombre}`];

    const antes = this.estado();
    const marco: MarcoFuncion = {
      funcion,
      exteriores: antes.map((e) => e[0]),
      salidas: [],
      comprobarDefinicion,
    };
    this.marcos.push(marco);
    try {
      if (comprobarDefinicion) {
        for (const sym of marco.exteriores) {
          sym.inicializada = true;
          sym.valorNumerico = null;
        }
      }
      for (const p of funcion.parametros) {
        this.declarar(p.tokenId, p.tipoParametro, true);
      }
      this.visitarSentenciasBloque(funcion.cuerpo);
    } finally {
      this.marcos.pop();
      this.ambitos = variablesLlamador;
      this.funciones = funcionesLlamador;
      this.nombresAmbitos = nombresLlamador;
      this.restaurar(antes);
    }

    if (marco.salidas.length > 0 && !comprobarDefinicion) {
      if (!this.retornoGarantizado(funcion.cuerpo)) {
        marco.salidas.push(antes);
      }
      this.combinar(antes, marco.salidas, pos);
    }
  }

  private operacion(token: Token, tipos: TipoResultado[], esperado: TipoEdu): TipoResultado {
    if (tipos.includes(ERROR)) return ERROR;
    if (tipos.some((t) => t !== null && t !== esperado)) {
      const descripcion = tipos.map((t) => t ?? 'desconocido').join(' y ');
      return this.agregarError(
        { linea: token.linea, columna: token.columna },
        `el operador '${token.texto}' requiere operandos de tipo ${esperado}, pero recibió ${descripcion}. Usa valores de tipo ${esperado}.`,
      );
    }
    return tipos.includes(null) ? null : esperado;
  }

  private visitarExpresion(expr: ExpresionAST): TipoResultado {
    switch (expr.tipo) {
      case 'NumeroLiteral':
        return 'numero';
      case 'TextoLiteral':
        return 'texto';
      case 'LogicoLiteral':
        return 'logico';
      case 'VariableExpr':
        return this.leer(expr.token);

      case 'UnariaExpr': {
        const tipoOp = this.visitarExpresion(expr.operando);
        return this.operacion(expr.tokenOp, [tipoOp], expr.operador === 'no' ? 'logico' : 'numero');
      }

      case 'BinariaExpr': {
        const izq = this.visitarExpresion(expr.izquierda);
        const der = this.visitarExpresion(expr.derecha);
        const esperado: TipoEdu = expr.operador === 'y' || expr.operador === 'o' ? 'logico' : 'numero';
        return this.operacion(expr.tokenOp, [izq, der], esperado);
      }

      case 'ComparacionExpr': {
        const izq = this.visitarExpresion(expr.izquierda);
        const der = this.visitarExpresion(expr.derecha);
        if (izq === ERROR || der === ERROR) return ERROR;
        if (izq === null || der === null) return 'logico';
        if (!expr.esOrden) {
          if (izq !== der) {
            return this.agregarError(
              { linea: expr.tokenOp.linea, columna: expr.tokenOp.columna },
              `no se pueden comparar valores de tipo ${izq} y ${der}.`,
            );
          }
        } else if (izq !== 'numero' || der !== 'numero') {
          return this.agregarError(
            { linea: expr.tokenOp.linea, columna: expr.tokenOp.columna },
            'las comparaciones de orden requieren operandos de tipo numero.',
          );
        }
        return 'logico';
      }

      case 'AleatorioExpr': {
        const limites = [expr.minimo, expr.maximo];
        const tipos = limites.map((l) => (l.tipo === 'LimiteVariable' ? this.leer(l.token) : 'numero'));
        const valores = limites.map((l) => this.limiteConstante(l));
        let invalido = tipos.includes(ERROR);
        for (let i = 0; i < 2; i += 1) {
          if (this.exigirTipo(limites[i].pos, tipos[i], 'numero', 'el límite del aleatorio') === ERROR) {
            invalido = true;
          } else if (valores[i] !== null && !valores[i]!.isInteger) {
            this.agregarError(limites[i].pos, 'el límite del aleatorio debe ser entero.');
            invalido = true;
          }
        }
        if (!invalido && valores[0] !== null && valores[1] !== null && valores[0].compare(valores[1]) > 0) {
          this.agregarError(
            expr.pos,
            'el límite mínimo del aleatorio no puede ser mayor que el máximo.',
          );
          invalido = true;
        }
        return invalido ? ERROR : 'numero';
      }

      case 'LlamadaExpr': {
        const tipos = expr.argumentos.map((arg) => this.visitarExpresion(arg));
        if (tipos.includes(ERROR)) return ERROR;
        let firma: FuncionSemantica | null = null;
        for (let i = this.funciones.length - 1; i >= 0; i -= 1) {
          const encontrada = this.funciones[i].get(expr.nombre);
          if (encontrada) {
            firma = encontrada;
            break;
          }
        }
        if (!firma) {
          return this.agregarError(
            { linea: expr.tokenId.linea, columna: expr.tokenId.columna },
            `la función '${expr.nombre}' no está declarada.`,
          );
        }
        const esperados = firma.parametros.map((p) => p.tipoParametro);
        if (tipos.length !== esperados.length) {
          return this.agregarError(
            { linea: expr.tokenId.linea, columna: expr.tokenId.columna },
            `la función '${expr.nombre}' espera ${esperados.length} argumentos, pero recibió ${tipos.length}.`,
          );
        }
        for (let i = 0; i < tipos.length; i += 1) {
          if (tipos[i] !== null && tipos[i] !== esperados[i]) {
            this.agregarError(
              { linea: expr.tokenId.linea, columna: expr.tokenId.columna },
              `el argumento ${i + 1} de '${expr.nombre}' debe ser de tipo ${esperados[i]}, pero recibió ${tipos[i]}.`,
            );
            return ERROR;
          }
        }
        if (this.marcos.some((m) => m.funcion === firma)) {
          for (const ambito of firma.variablesVisibles) {
            for (const sym of ambito.values()) {
              sym.valorNumerico = null;
            }
          }
        } else {
          this.analizarFuncion(firma, expr.pos, false);
        }
        return firma.retorno;
      }
    }
  }
}

export function analizarSemantica(programa: ProgramaAST): ResultadoSemantico {
  const analizador = new AnalizadorSemantico();
  return analizador.analizar(programa);
}
