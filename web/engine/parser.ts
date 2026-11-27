/**
 * Analizador sintáctico descendente recursivo fiel a `grammar/EducativoParser.g4`.
 * Construye tanto el AST tipado como un árbol sintáctico visualizable para Rayos X.
 */

import type {
  BloqueAST,
  Diagnostico,
  ExpresionAST,
  LimiteAST,
  LlamadaExprAST,
  NodoArbolVisual,
  OperadorComparacion,
  ParametroAST,
  ProgramaAST,
  SentenciaAST,
  TipoEdu,
  Token,
} from './types';

class ErrorSintacticoInterno extends Error {
  constructor(
    public readonly mensaje: string,
    public readonly token: Token,
  ) {
    super(mensaje);
  }
}

export interface ResultadoParser {
  ast: ProgramaAST | null;
  arbolVisual: NodoArbolVisual | null;
  diagnosticos: Diagnostico[];
}

const INICIOS_SENTENCIA = new Set([
  'CREAR',
  'ASIGNAR',
  'MOSTRAR',
  'PREGUNTAR',
  'SI',
  'REPETIR',
  'MIENTRAS',
  'DEFINIR',
  'DEVOLVER',
  'ID',
  'JUEGO',
  'CALCULADORA',
]);

class Parser {
  private pos = 0;
  readonly diagnosticos: Diagnostico[] = [];

  constructor(private readonly tokens: Token[]) {}

  private actual(): Token {
    return this.tokens[this.pos] ?? this.tokens[this.tokens.length - 1];
  }

  private mirar(offset = 1): Token {
    return this.tokens[this.pos + offset] ?? this.tokens[this.tokens.length - 1];
  }

  private coincide(tipo: string): boolean {
    return this.actual().tipo === tipo;
  }

  private consumir(tipo: string, mensaje: string): Token {
    const tok = this.actual();
    if (tok.tipo !== tipo) {
      throw new ErrorSintacticoInterno(mensaje, tok);
    }
    this.pos += 1;
    return tok;
  }

  private avanzar(): Token {
    const tok = this.actual();
    if (this.pos < this.tokens.length - 1) {
      this.pos += 1;
    }
    return tok;
  }

  private descripcionToken(tok: Token): string {
    if (tok.tipo === 'EOF') return 'el final del programa';
    if (tok.tipo === 'SALTO_LINEA') return 'un salto de línea';
    return `'${tok.texto}'`;
  }

  private saltarLineasOpcionales(): void {
    while (this.coincide('SALTO_LINEA')) {
      this.avanzar();
    }
  }

  private consumirLineas(contexto: string): void {
    if (!this.coincide('SALTO_LINEA')) {
      throw new ErrorSintacticoInterno(
        `se esperaba un salto de línea ${contexto}, pero apareció ${this.descripcionToken(this.actual())}.`,
        this.actual(),
      );
    }
    while (this.coincide('SALTO_LINEA')) {
      this.avanzar();
    }
  }

  parsePrograma(): ProgramaAST {
    this.saltarLineasOpcionales();
    const sentencias: SentenciaAST[] = [];

    if (!this.coincide('EOF')) {
      while (!this.coincide('EOF')) {
        sentencias.push(this.parseSentencia());
        if (this.coincide('EOF')) {
          break;
        }
        if (this.coincide('SALTO_LINEA')) {
          this.saltarLineasOpcionales();
        } else {
          throw new ErrorSintacticoInterno(
            `solo puede haber una instrucción por línea; apareció ${this.descripcionToken(this.actual())}.`,
            this.actual(),
          );
        }
      }
    }

    this.consumir('EOF', `se esperaba el final del programa, pero apareció ${this.descripcionToken(this.actual())}.`);
    return { tipo: 'Programa', sentencias };
  }

  private parseSentencia(): SentenciaAST {
    const tok = this.actual();
    switch (tok.tipo) {
      case 'CREAR':
        return this.parseDeclaracion();
      case 'ASIGNAR':
        return this.parseAsignacion();
      case 'MOSTRAR':
        return this.parseSalida();
      case 'PREGUNTAR':
        return this.parseEntrada();
      case 'SI':
        return this.parseCondicional();
      case 'REPETIR':
        return this.parseRepeticion();
      case 'MIENTRAS':
        return this.parseMientras();
      case 'DEFINIR':
        return this.parseFuncion();
      case 'DEVOLVER':
        return this.parseRetorno();
      case 'ID': {
        const llamada = this.parseLlamada();
        return { tipo: 'LlamadaSentencia', llamada, pos: llamada.pos };
      }
      case 'JUEGO':
      case 'CALCULADORA': {
        this.avanzar();
        return {
          tipo: 'Motivacion',
          modo: tok.tipo === 'JUEGO' ? 'juego' : 'calculadora',
          pos: { linea: tok.linea, columna: tok.columna },
        };
      }
      default:
        throw new ErrorSintacticoInterno(
          `instrucción inesperada: ${this.descripcionToken(tok)}.`,
          tok,
        );
    }
  }

  private parseDeclaracion(): SentenciaAST {
    const inicio = this.consumir('CREAR', "se esperaba 'crear'.");
    this.consumir('VARIABLE', "después de 'crear' se esperaba la palabra 'variable'.");
    const id = this.consumir(
      'ID',
      `se esperaba el nombre de la variable después de 'crear variable', pero apareció ${this.descripcionToken(this.actual())}.`,
    );
    return {
      tipo: 'Declaracion',
      nombre: id.texto,
      tokenId: id,
      pos: { linea: inicio.linea, columna: inicio.columna },
    };
  }

  private parseAsignacion(): SentenciaAST {
    const inicio = this.consumir('ASIGNAR', "se esperaba 'asignar'.");
    const id = this.consumir(
      'ID',
      `se esperaba el nombre de la variable después de 'asignar', pero apareció ${this.descripcionToken(this.actual())}.`,
    );
    this.consumir(
      'VALOR',
      `falta 'valor de' en la asignación a '${id.texto}' (ejemplo: asignar ${id.texto} valor de 10).`,
    );
    this.consumir('DE', `falta 'de' después de 'valor' en la asignación a '${id.texto}'.`);
    const expresion = this.parseExpresion();
    return {
      tipo: 'Asignacion',
      nombre: id.texto,
      tokenId: id,
      expresion,
      pos: { linea: inicio.linea, columna: inicio.columna },
    };
  }

  private parseSalida(): SentenciaAST {
    const inicio = this.consumir('MOSTRAR', "se esperaba 'mostrar'.");
    const expresion = this.parseExpresion();
    return {
      tipo: 'Salida',
      expresion,
      pos: { linea: inicio.linea, columna: inicio.columna },
    };
  }

  private parseEntrada(): SentenciaAST {
    const inicio = this.consumir('PREGUNTAR', "se esperaba 'preguntar'.");
    const texto = this.consumir(
      'TEXTO',
      `después de 'preguntar' escribe el mensaje entre comillas (ejemplo: preguntar "¿Tu nombre?" guardar en nombre).`,
    );
    this.consumir('GUARDAR', "después del mensaje de 'preguntar' se esperaba 'guardar en'.");
    this.consumir('EN', "después de 'guardar' se esperaba 'en' seguido del nombre de la variable.");
    const id = this.consumir(
      'ID',
      `se esperaba el nombre de la variable después de 'guardar en', pero apareció ${this.descripcionToken(this.actual())}.`,
    );
    return {
      tipo: 'Entrada',
      mensajeRaw: texto.texto,
      nombre: id.texto,
      tokenId: id,
      pos: { linea: inicio.linea, columna: inicio.columna },
    };
  }

  private parseBloque(delimitadores: Set<string>, nombreConstruccion: string): BloqueAST {
    const inicioBloque = this.actual();
    this.consumirLineas(`después del encabezado de '${nombreConstruccion}'`);
    const sentencias: SentenciaAST[] = [];

    while (!delimitadores.has(this.actual().tipo) && !this.coincide('EOF')) {
      if (!INICIOS_SENTENCIA.has(this.actual().tipo)) {
        throw new ErrorSintacticoInterno(
          `instrucción inesperada dentro de '${nombreConstruccion}': ${this.descripcionToken(this.actual())}.`,
          this.actual(),
        );
      }
      sentencias.push(this.parseSentencia());
      this.consumirLineas(`al terminar una instrucción dentro de '${nombreConstruccion}'`);
    }

    return {
      tipo: 'Bloque',
      sentencias,
      pos: { linea: inicioBloque.linea, columna: inicioBloque.columna },
    };
  }

  private parseCondicional(): SentenciaAST {
    const inicio = this.consumir('SI', "se esperaba 'si'.");
    const condicion = this.parseExpresion();
    this.consumir('ENTONCES', "falta la palabra 'entonces' al final de la condición 'si'.");
    const entonces = this.parseBloque(new Set(['SINO', 'FIN']), 'si');
    let sino: BloqueAST | null = null;
    if (this.coincide('SINO')) {
      this.avanzar();
      sino = this.parseBloque(new Set(['FIN']), 'sino');
    }
    this.consumir('FIN', "falta 'fin' para cerrar el bloque 'si'.");
    return {
      tipo: 'Condicional',
      condicion,
      entonces,
      sino,
      pos: { linea: inicio.linea, columna: inicio.columna },
    };
  }

  private parseRepeticion(): SentenciaAST {
    const inicio = this.consumir('REPETIR', "se esperaba 'repetir'.");
    const cantidad = this.parseExpresion();
    this.consumir('VECES', "falta la palabra 'veces' después de la cantidad en 'repetir'.");
    const bloque = this.parseBloque(new Set(['FIN']), 'repetir');
    this.consumir('FIN', "falta 'fin' para cerrar el ciclo 'repetir'.");
    return {
      tipo: 'Repeticion',
      cantidad,
      bloque,
      pos: { linea: inicio.linea, columna: inicio.columna },
    };
  }

  private parseMientras(): SentenciaAST {
    const inicio = this.consumir('MIENTRAS', "se esperaba 'mientras'.");
    const condicion = this.parseExpresion();
    this.consumir('HACER', "falta la palabra 'hacer' al final de la condición 'mientras'.");
    const bloque = this.parseBloque(new Set(['FIN']), 'mientras');
    this.consumir('FIN', "falta 'fin' para cerrar el ciclo 'mientras'.");
    return {
      tipo: 'Mientras',
      condicion,
      bloque,
      pos: { linea: inicio.linea, columna: inicio.columna },
    };
  }

  private parseTipo(): { tipo: TipoEdu; token: Token } {
    const tok = this.actual();
    if (tok.tipo === 'TIPO_NUMERO') {
      this.avanzar();
      return { tipo: 'numero', token: tok };
    }
    if (tok.tipo === 'TIPO_TEXTO') {
      this.avanzar();
      return { tipo: 'texto', token: tok };
    }
    if (tok.tipo === 'TIPO_LOGICO') {
      this.avanzar();
      return { tipo: 'logico', token: tok };
    }
    throw new ErrorSintacticoInterno(
      `se esperaba un tipo ('numero', 'texto' o 'logico'), pero apareció ${this.descripcionToken(tok)}.`,
      tok,
    );
  }

  private parseFuncion(): SentenciaAST {
    const inicio = this.consumir('DEFINIR', "se esperaba 'definir'.");
    const id = this.consumir('ID', "se esperaba el nombre de la función después de 'definir'.");
    this.consumir('PAREN_IZQ', `faltan los paréntesis '(' ')' en la definición de '${id.texto}'.`);

    const parametros: ParametroAST[] = [];
    if (!this.coincide('PAREN_DER')) {
      while (true) {
        const { tipo: tipoParametro, token: tokTipo } = this.parseTipo();
        const paramId = this.consumir(
          'ID',
          `se esperaba el nombre del parámetro después de '${tokTipo.texto}'.`,
        );
        parametros.push({
          tipoParametro,
          nombre: paramId.texto,
          tokenId: paramId,
          pos: { linea: tokTipo.linea, columna: tokTipo.columna },
        });
        if (this.coincide('COMA')) {
          this.avanzar();
          continue;
        }
        break;
      }
    }

    this.consumir('PAREN_DER', `falta cerrar el paréntesis ')' en la función '${id.texto}'.`);
    this.consumir('DEVUELVE', `falta 'devuelve <tipo>' en la función '${id.texto}'.`);
    const { tipo: tipoRetorno } = this.parseTipo();
    const cuerpo = this.parseBloque(new Set(['FIN']), `definir ${id.texto}`);
    this.consumir('FIN', `falta 'fin' para cerrar la función '${id.texto}'.`);

    return {
      tipo: 'Funcion',
      nombre: id.texto,
      tokenId: id,
      parametros,
      tipoRetorno,
      cuerpo,
      pos: { linea: inicio.linea, columna: inicio.columna },
    };
  }

  private parseRetorno(): SentenciaAST {
    const inicio = this.consumir('DEVOLVER', "se esperaba 'devolver'.");
    const expresion = this.parseExpresion();
    return {
      tipo: 'Retorno',
      expresion,
      pos: { linea: inicio.linea, columna: inicio.columna },
    };
  }

  private parseLlamada(): LlamadaExprAST {
    const id = this.consumir('ID', 'se esperaba el nombre de una función.');
    this.consumir('PAREN_IZQ', `se esperaba '(' para llamar a '${id.texto}'.`);
    const argumentos: ExpresionAST[] = [];
    if (!this.coincide('PAREN_DER')) {
      argumentos.push(this.parseExpresion());
      while (this.coincide('COMA')) {
        this.avanzar();
        argumentos.push(this.parseExpresion());
      }
    }
    this.consumir('PAREN_DER', `falta cerrar el paréntesis ')' en la llamada a '${id.texto}'.`);
    return {
      tipo: 'LlamadaExpr',
      nombre: id.texto,
      tokenId: id,
      argumentos,
      pos: { linea: id.linea, columna: id.columna },
    };
  }

  /* ---------- Expresiones y precedencia ---------- */

  private parseExpresion(): ExpresionAST {
    return this.parseDisyuncion();
  }

  private parseDisyuncion(): ExpresionAST {
    let izquierda = this.parseConjuncion();
    while (this.coincide('O')) {
      const op = this.avanzar();
      const derecha = this.parseConjuncion();
      izquierda = {
        tipo: 'BinariaExpr',
        operador: 'o',
        tokenOp: op,
        izquierda,
        derecha,
        pos: izquierda.pos,
      };
    }
    return izquierda;
  }

  private parseConjuncion(): ExpresionAST {
    let izquierda = this.parseNegacion();
    while (this.coincide('Y')) {
      const op = this.avanzar();
      const derecha = this.parseNegacion();
      izquierda = {
        tipo: 'BinariaExpr',
        operador: 'y',
        tokenOp: op,
        izquierda,
        derecha,
        pos: izquierda.pos,
      };
    }
    return izquierda;
  }

  private parseNegacion(): ExpresionAST {
    if (this.coincide('NO')) {
      const op = this.avanzar();
      const operando = this.parseNegacion();
      return {
        tipo: 'UnariaExpr',
        operador: 'no',
        tokenOp: op,
        operando,
        pos: { linea: op.linea, columna: op.columna },
      };
    }
    return this.parseComparacion();
  }

  private parseComparacion(): ExpresionAST {
    const izquierda = this.parseSuma();
    if (!this.coincide('ES')) {
      return izquierda;
    }

    const tokenOp = this.avanzar(); // ES
    let operador: OperadorComparacion;
    let esOrden = false;

    if (this.coincide('IGUAL')) {
      this.avanzar();
      this.consumir('A', "después de 'es igual' se esperaba 'a'.");
      operador = '==';
    } else if (this.coincide('DIFERENTE')) {
      this.avanzar();
      this.consumir('DE', "después de 'es diferente' se esperaba 'de'.");
      operador = '!=';
    } else if (this.coincide('MAYOR')) {
      this.avanzar();
      esOrden = true;
      if (this.coincide('O')) {
        this.avanzar();
        this.consumir('IGUAL', "después de 'es mayor o' se esperaba 'igual que'.");
        this.consumir('QUE', "después de 'es mayor o igual' se esperaba 'que'.");
        operador = '>=';
      } else {
        this.consumir('QUE', "después de 'es mayor' se esperaba 'que'.");
        operador = '>';
      }
    } else if (this.coincide('MENOR')) {
      this.avanzar();
      esOrden = true;
      if (this.coincide('O')) {
        this.avanzar();
        this.consumir('IGUAL', "después de 'es menor o' se esperaba 'igual que'.");
        this.consumir('QUE', "después de 'es menor o igual' se esperaba 'que'.");
        operador = '<=';
      } else {
        this.consumir('QUE', "después de 'es menor' se esperaba 'que'.");
        operador = '<';
      }
    } else {
      throw new ErrorSintacticoInterno(
        `después de 'es' se esperaba una comparación ('igual a', 'diferente de', 'mayor que', 'menor que', etc.), pero apareció ${this.descripcionToken(this.actual())}.`,
        this.actual(),
      );
    }

    const derecha = this.parseSuma();
    return {
      tipo: 'ComparacionExpr',
      operador,
      esOrden,
      tokenOp,
      izquierda,
      derecha,
      pos: izquierda.pos,
    };
  }

  private parseSuma(): ExpresionAST {
    let izquierda = this.parseProducto();
    while (this.coincide('SUMA') || this.coincide('RESTA')) {
      const op = this.avanzar();
      const derecha = this.parseProducto();
      izquierda = {
        tipo: 'BinariaExpr',
        operador: op.tipo === 'SUMA' ? '+' : '-',
        tokenOp: op,
        izquierda,
        derecha,
        pos: izquierda.pos,
      };
    }
    return izquierda;
  }

  private parseProducto(): ExpresionAST {
    let izquierda = this.parseUnaria();
    while (this.coincide('MULT') || this.coincide('DIV')) {
      const op = this.avanzar();
      const derecha = this.parseUnaria();
      izquierda = {
        tipo: 'BinariaExpr',
        operador: op.tipo === 'MULT' ? '*' : '/',
        tokenOp: op,
        izquierda,
        derecha,
        pos: izquierda.pos,
      };
    }
    return izquierda;
  }

  private parseUnaria(): ExpresionAST {
    if (this.coincide('RESTA')) {
      const op = this.avanzar();
      const operando = this.parseUnaria();
      return {
        tipo: 'UnariaExpr',
        operador: '-',
        tokenOp: op,
        operando,
        pos: { linea: op.linea, columna: op.columna },
      };
    }
    return this.parsePrimaria();
  }

  private parsePrimaria(): ExpresionAST {
    const tok = this.actual();

    if (tok.tipo === 'NUMERO') {
      this.avanzar();
      return {
        tipo: 'NumeroLiteral',
        raw: tok.texto,
        token: tok,
        pos: { linea: tok.linea, columna: tok.columna },
      };
    }

    if (tok.tipo === 'TEXTO') {
      this.avanzar();
      return {
        tipo: 'TextoLiteral',
        raw: tok.texto,
        token: tok,
        pos: { linea: tok.linea, columna: tok.columna },
      };
    }

    if (tok.tipo === 'VERDADERO' || tok.tipo === 'FALSO') {
      this.avanzar();
      return {
        tipo: 'LogicoLiteral',
        valor: tok.tipo === 'VERDADERO',
        pos: { linea: tok.linea, columna: tok.columna },
      };
    }

    if (tok.tipo === 'ID') {
      if (this.mirar(1).tipo === 'PAREN_IZQ') {
        return this.parseLlamada();
      }
      this.avanzar();
      return {
        tipo: 'VariableExpr',
        nombre: tok.texto,
        token: tok,
        pos: { linea: tok.linea, columna: tok.columna },
      };
    }

    if (tok.tipo === 'PAREN_IZQ') {
      this.avanzar();
      const expr = this.parseExpresion();
      this.consumir('PAREN_DER', "falta cerrar el paréntesis ')'.");
      return expr;
    }

    if (tok.tipo === 'TIPO_NUMERO') {
      return this.parseAleatorio();
    }

    throw new ErrorSintacticoInterno(
      `se esperaba un valor o expresión, pero apareció ${this.descripcionToken(tok)}.`,
      tok,
    );
  }

  private parseAleatorio(): ExpresionAST {
    const inicio = this.consumir('TIPO_NUMERO', "se esperaba 'numero aleatorio entre ...'.");
    this.consumir('ALEATORIO', "después de 'numero' en una expresión se esperaba 'aleatorio'.");
    this.consumir('ENTRE', "después de 'numero aleatorio' se esperaba 'entre'.");
    const minimo = this.parseLimite();
    this.consumir('Y', "falta 'y' entre el límite mínimo y máximo de 'numero aleatorio entre'.");
    const maximo = this.parseLimite();
    return {
      tipo: 'AleatorioExpr',
      minimo,
      maximo,
      pos: { linea: inicio.linea, columna: inicio.columna },
    };
  }

  private parseLimite(): LimiteAST {
    const tok = this.actual();
    if (tok.tipo === 'RESTA') {
      this.avanzar();
      const num = this.consumir(
        'NUMERO',
        "después de '-' en un límite aleatorio se esperaba un número literal.",
      );
      return {
        tipo: 'LimiteNumero',
        raw: num.texto,
        negativo: true,
        token: num,
        pos: { linea: tok.linea, columna: tok.columna },
      };
    }
    if (tok.tipo === 'NUMERO') {
      this.avanzar();
      return {
        tipo: 'LimiteNumero',
        raw: tok.texto,
        negativo: false,
        token: tok,
        pos: { linea: tok.linea, columna: tok.columna },
      };
    }
    if (tok.tipo === 'ID') {
      this.avanzar();
      return {
        tipo: 'LimiteVariable',
        nombre: tok.texto,
        token: tok,
        pos: { linea: tok.linea, columna: tok.columna },
      };
    }
    throw new ErrorSintacticoInterno(
      `un límite de 'numero aleatorio' debe ser un número o una variable, pero apareció ${this.descripcionToken(tok)}.`,
      tok,
    );
  }
}

/* ---------- Conversión del AST a árbol visualizable ---------- */

function exprAVisual(expr: ExpresionAST): NodoArbolVisual {
  switch (expr.tipo) {
    case 'NumeroLiteral':
      return { etiqueta: 'Número', detalle: expr.raw, linea: expr.pos.linea, hijos: [] };
    case 'TextoLiteral':
      return { etiqueta: 'Texto', detalle: expr.raw, linea: expr.pos.linea, hijos: [] };
    case 'LogicoLiteral':
      return {
        etiqueta: 'Lógico',
        detalle: expr.valor ? 'verdadero' : 'falso',
        linea: expr.pos.linea,
        hijos: [],
      };
    case 'VariableExpr':
      return { etiqueta: 'Variable', detalle: expr.nombre, linea: expr.pos.linea, hijos: [] };
    case 'LlamadaExpr':
      return {
        etiqueta: 'Llamada',
        detalle: `${expr.nombre}(${expr.argumentos.length})`,
        linea: expr.pos.linea,
        hijos: expr.argumentos.map(exprAVisual),
      };
    case 'AleatorioExpr':
      return {
        etiqueta: 'Aleatorio',
        detalle: `${expr.minimo.tipo === 'LimiteVariable' ? expr.minimo.nombre : (expr.minimo.negativo ? '-' : '') + expr.minimo.raw} .. ${expr.maximo.tipo === 'LimiteVariable' ? expr.maximo.nombre : (expr.maximo.negativo ? '-' : '') + expr.maximo.raw}`,
        linea: expr.pos.linea,
        hijos: [],
      };
    case 'UnariaExpr':
      return {
        etiqueta: `Unaria (${expr.operador})`,
        linea: expr.pos.linea,
        hijos: [exprAVisual(expr.operando)],
      };
    case 'BinariaExpr':
      return {
        etiqueta: `Operación (${expr.operador})`,
        linea: expr.pos.linea,
        hijos: [exprAVisual(expr.izquierda), exprAVisual(expr.derecha)],
      };
    case 'ComparacionExpr':
      return {
        etiqueta: `Comparación (${expr.operador})`,
        linea: expr.pos.linea,
        hijos: [exprAVisual(expr.izquierda), exprAVisual(expr.derecha)],
      };
  }
}

function sentenciaAVisual(s: SentenciaAST): NodoArbolVisual {
  switch (s.tipo) {
    case 'Declaracion':
      return { etiqueta: 'Declaración', detalle: `crear variable ${s.nombre}`, linea: s.pos.linea, hijos: [] };
    case 'Asignacion':
      return {
        etiqueta: 'Asignación',
        detalle: s.nombre,
        linea: s.pos.linea,
        hijos: [exprAVisual(s.expresion)],
      };
    case 'Salida':
      return { etiqueta: 'Mostrar', linea: s.pos.linea, hijos: [exprAVisual(s.expresion)] };
    case 'Entrada':
      return {
        etiqueta: 'Preguntar',
        detalle: `${s.mensajeRaw} → ${s.nombre}`,
        linea: s.pos.linea,
        hijos: [],
      };
    case 'Condicional': {
      const hijos: NodoArbolVisual[] = [
        { etiqueta: 'Condición', linea: s.condicion.pos.linea, hijos: [exprAVisual(s.condicion)] },
        { etiqueta: 'Entonces', linea: s.entonces.pos.linea, hijos: s.entonces.sentencias.map(sentenciaAVisual) },
      ];
      if (s.sino) {
        hijos.push({
          etiqueta: 'Sino',
          linea: s.sino.pos.linea,
          hijos: s.sino.sentencias.map(sentenciaAVisual),
        });
      }
      return { etiqueta: 'Si / Sino', linea: s.pos.linea, hijos };
    }
    case 'Repeticion':
      return {
        etiqueta: 'Repetir',
        linea: s.pos.linea,
        hijos: [
          { etiqueta: 'Veces', linea: s.cantidad.pos.linea, hijos: [exprAVisual(s.cantidad)] },
          { etiqueta: 'Bloque', linea: s.bloque.pos.linea, hijos: s.bloque.sentencias.map(sentenciaAVisual) },
        ],
      };
    case 'Mientras':
      return {
        etiqueta: 'Mientras',
        linea: s.pos.linea,
        hijos: [
          { etiqueta: 'Condición', linea: s.condicion.pos.linea, hijos: [exprAVisual(s.condicion)] },
          { etiqueta: 'Bloque', linea: s.bloque.pos.linea, hijos: s.bloque.sentencias.map(sentenciaAVisual) },
        ],
      };
    case 'Funcion':
      return {
        etiqueta: 'Función',
        detalle: `${s.nombre}(${s.parametros.map((p) => `${p.tipoParametro} ${p.nombre}`).join(', ')}) → ${s.tipoRetorno}`,
        linea: s.pos.linea,
        hijos: s.cuerpo.sentencias.map(sentenciaAVisual),
      };
    case 'Retorno':
      return { etiqueta: 'Devolver', linea: s.pos.linea, hijos: [exprAVisual(s.expresion)] };
    case 'LlamadaSentencia':
      return exprAVisual(s.llamada);
    case 'Motivacion':
      return { etiqueta: 'Motivación', detalle: s.modo, linea: s.pos.linea, hijos: [] };
  }
}

export function parsear(tokens: Token[]): ResultadoParser {
  const parser = new Parser(tokens);
  try {
    const ast = parser.parsePrograma();
    const arbolVisual: NodoArbolVisual = {
      etiqueta: 'Programa',
      detalle: `${ast.sentencias.length} ${ast.sentencias.length === 1 ? 'instrucción' : 'instrucciones'}`,
      linea: 1,
      hijos: ast.sentencias.map(sentenciaAVisual),
    };
    return { ast, arbolVisual, diagnosticos: [] };
  } catch (err) {
    if (err instanceof ErrorSintacticoInterno) {
      return {
        ast: null,
        arbolVisual: null,
        diagnosticos: [
          {
            etapa: 'gramatica',
            mensaje: err.mensaje,
            linea: err.token.linea,
            columna: err.token.columna,
          },
        ],
      };
    }
    throw err;
  }
}
