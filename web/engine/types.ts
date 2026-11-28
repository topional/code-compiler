/**
 * Tipos compartidos entre el cliente de la API Python (`docs/api.md`)
 * y la interfaz de Chispa · Code Compiler.
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

export interface TokenAnalisis {
  tipo: string;
  texto: string;
  linea: number;
  columna: number;
}

export interface ResumenArbolAnalisis {
  sentencias: number;
}

export interface SimboloAnalisis {
  nombre: string;
  tipo: TipoEdu | null;
  linea: number;
  columna: number;
  esFuncion: boolean;
}

export interface AnalisisCompilacion {
  tokens: TokenAnalisis[];
  arbol: ResumenArbolAnalisis | null;
  simbolos: SimboloAnalisis[];
}

export interface ResultadoCompilacionApi {
  intermedio: ProgramaIntermedio | null;
  diagnosticos: Diagnostico[];
  analisis: AnalisisCompilacion | null;
  duracionMs: number;
  falloConexion: boolean;
}

export interface VariableMemoria {
  idInterno: string;
  nombre: string;
  tipo: TipoEdu | 'sin_valor';
  valor: string;
  ambito: string;
  cambioReciente: boolean;
}

export type ModoEjecucionRemota = 'normal' | 'continuo' | 'paso';

export interface EventoEstadoRemoto {
  tipo: 'estado';
  linea: number | null;
  columna: number | null;
  pausado: boolean;
  pila: string[];
  variables: VariableMemoria[];
}

export type EventoEjecucionRemota =
  | { tipo: 'salida'; texto: string }
  | { tipo: 'pregunta'; mensaje: string }
  | { tipo: 'entrada_invalida'; mensaje: string }
  | EventoEstadoRemoto
  | { tipo: 'fin'; duracionMs: number }
  | { tipo: 'error'; diagnosticos: Diagnostico[]; falloConexion?: boolean };
