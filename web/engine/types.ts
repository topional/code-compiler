/**
 * Tipos compartidos por el compilador, el intérprete y la interfaz de Chispa .edu.
 */

export type EtapaCompilacion =
  | 'lexer'
  | 'gramatica'
  | 'semantica'
  | 'intermedio'
  | 'ejecucion'
  | 'limite'
  | 'peticion'
  | 'protocolo'
  | 'servicio';

export type TipoEdu = 'numero' | 'texto' | 'logico';

export interface Diagnostico {
  etapa: EtapaCompilacion;
  mensaje: string;
  linea: number | null;
  columna: number | null;
}

export interface PistaPedagogica {
  titulo: string;
  explicacion: string;
  ejemplo?: string;
  autoFix?: {
    etiqueta: string;
    aplicar: (codigo: string) => string;
  };
}

export type CategoriaToken =
  | 'variable'
  | 'io'
  | 'control'
  | 'funcion'
  | 'operador'
  | 'valor'
  | 'identificador'
  | 'puntuacion'
  | 'salto';

export interface Token {
  tipo: string;
  texto: string;
  linea: number;
  columna: number; // 1-based
  indiceInicio: number;
  indiceFin: number;
  categoria: CategoriaToken;
}

export interface Instruccion {
  operacion: string;
  argumento1: string | null;
  argumento2: string | null;
  resultado: string | null;
  linea: number | null;
  columna: number | null;
  tipo: string | null;
  nombre: string | null;
}

export interface ProgramaIntermedio {
  version: 1;
  instrucciones: Instruccion[];
}

export interface NodoArbolVisual {
  etiqueta: string;
  detalle?: string;
  linea?: number;
  hijos: NodoArbolVisual[];
}

export interface ResumenSimbolo {
  nombre: string;
  ambito: string;
  tipo: TipoEdu | 'desconocido';
  inicializada: boolean;
  linea: number;
  columna: number;
  esFuncion?: boolean;
  firma?: string;
}

export interface ResultadoCompilacion {
  tokens: Token[];
  arbolVisual: NodoArbolVisual | null;
  simbolos: ResumenSimbolo[];
  intermedio: ProgramaIntermedio | null;
  diagnosticos: Diagnostico[];
  duracionMs: number;
}

export interface VariableMemoria {
  idInterno: string;
  nombre: string;
  tipo: TipoEdu | 'sin_valor';
  valor: string;
  ambito: string;
  cambioReciente: boolean;
}

export interface EstadoPaso {
  indiceInstruccion: number;
  operacion: string;
  linea: number | null;
  columna: number | null;
  variables: VariableMemoria[];
  pilaLlamadas: string[];
  pasosTotales: number;
}

export type EventoEjecucion =
  | { tipo: 'salida'; texto: string; linea: number | null }
  | { tipo: 'pregunta'; mensaje: string; tipoEsperado: TipoEdu; linea: number | null }
  | { tipo: 'entrada_invalida'; mensaje: string; linea: number | null }
  | { tipo: 'motivacion'; modo: 'juego' | 'calculadora'; linea: number | null }
  | { tipo: 'paso'; estado: EstadoPaso }
  | { tipo: 'fin'; pasosTotales: number; duracionMs: number }
  | { tipo: 'error'; diagnosticos: Diagnostico[] };

/* ---------- AST interno del Parser ---------- */

export interface Posicion {
  linea: number;
  columna: number;
}

export interface ProgramaAST {
  tipo: 'Programa';
  sentencias: SentenciaAST[];
}

export type SentenciaAST =
  | DeclaracionAST
  | AsignacionAST
  | SalidaAST
  | EntradaAST
  | CondicionalAST
  | RepeticionAST
  | MientrasAST
  | FuncionAST
  | RetornoAST
  | LlamadaSentenciaAST
  | MotivacionAST;

export interface DeclaracionAST {
  tipo: 'Declaracion';
  nombre: string;
  tokenId: Token;
  pos: Posicion;
}

export interface AsignacionAST {
  tipo: 'Asignacion';
  nombre: string;
  tokenId: Token;
  expresion: ExpresionAST;
  pos: Posicion;
}

export interface SalidaAST {
  tipo: 'Salida';
  expresion: ExpresionAST;
  pos: Posicion;
}

export interface EntradaAST {
  tipo: 'Entrada';
  mensajeRaw: string;
  nombre: string;
  tokenId: Token;
  pos: Posicion;
}

export interface BloqueAST {
  tipo: 'Bloque';
  sentencias: SentenciaAST[];
  pos: Posicion;
}

export interface CondicionalAST {
  tipo: 'Condicional';
  condicion: ExpresionAST;
  entonces: BloqueAST;
  sino: BloqueAST | null;
  pos: Posicion;
}

export interface RepeticionAST {
  tipo: 'Repeticion';
  cantidad: ExpresionAST;
  bloque: BloqueAST;
  pos: Posicion;
}

export interface MientrasAST {
  tipo: 'Mientras';
  condicion: ExpresionAST;
  bloque: BloqueAST;
  pos: Posicion;
}

export interface ParametroAST {
  tipoParametro: TipoEdu;
  nombre: string;
  tokenId: Token;
  pos: Posicion;
}

export interface FuncionAST {
  tipo: 'Funcion';
  nombre: string;
  tokenId: Token;
  parametros: ParametroAST[];
  tipoRetorno: TipoEdu;
  cuerpo: BloqueAST;
  pos: Posicion;
}

export interface RetornoAST {
  tipo: 'Retorno';
  expresion: ExpresionAST;
  pos: Posicion;
}

export interface LlamadaSentenciaAST {
  tipo: 'LlamadaSentencia';
  llamada: LlamadaExprAST;
  pos: Posicion;
}

export interface MotivacionAST {
  tipo: 'Motivacion';
  modo: 'juego' | 'calculadora';
  pos: Posicion;
}

export type ExpresionAST =
  | NumeroLiteralAST
  | TextoLiteralAST
  | LogicoLiteralAST
  | VariableExprAST
  | LlamadaExprAST
  | AleatorioExprAST
  | UnariaExprAST
  | BinariaExprAST
  | ComparacionExprAST;

export interface NumeroLiteralAST {
  tipo: 'NumeroLiteral';
  raw: string;
  token: Token;
  pos: Posicion;
}

export interface TextoLiteralAST {
  tipo: 'TextoLiteral';
  raw: string;
  token: Token;
  pos: Posicion;
}

export interface LogicoLiteralAST {
  tipo: 'LogicoLiteral';
  valor: boolean;
  pos: Posicion;
}

export interface VariableExprAST {
  tipo: 'VariableExpr';
  nombre: string;
  token: Token;
  pos: Posicion;
}

export interface LlamadaExprAST {
  tipo: 'LlamadaExpr';
  nombre: string;
  tokenId: Token;
  argumentos: ExpresionAST[];
  pos: Posicion;
}

export type LimiteAST =
  | { tipo: 'LimiteNumero'; raw: string; negativo: boolean; token: Token; pos: Posicion }
  | { tipo: 'LimiteVariable'; nombre: string; token: Token; pos: Posicion };

export interface AleatorioExprAST {
  tipo: 'AleatorioExpr';
  minimo: LimiteAST;
  maximo: LimiteAST;
  pos: Posicion;
}

export interface UnariaExprAST {
  tipo: 'UnariaExpr';
  operador: 'no' | '-';
  tokenOp: Token;
  operando: ExpresionAST;
  pos: Posicion;
}

export interface BinariaExprAST {
  tipo: 'BinariaExpr';
  operador: '+' | '-' | '*' | '/' | 'y' | 'o';
  tokenOp: Token;
  izquierda: ExpresionAST;
  derecha: ExpresionAST;
  pos: Posicion;
}

export type OperadorComparacion = '==' | '!=' | '>' | '<' | '>=' | '<=';

export interface ComparacionExprAST {
  tipo: 'ComparacionExpr';
  operador: OperadorComparacion;
  esOrden: boolean;
  tokenOp: Token;
  izquierda: ExpresionAST;
  derecha: ExpresionAST;
  pos: Posicion;
}
