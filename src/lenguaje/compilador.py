"""Analiza texto .edu y genera instrucciones de código intermedio."""

from dataclasses import dataclass, field

from antlr4 import CommonTokenStream, InputStream
from antlr4.error.ErrorListener import ErrorListener

from generated.EducativoLexer import EducativoLexer
from generated.EducativoParser import EducativoParser

from .diagnostico import Diagnostico
from .generador import ErrorGeneracion, GeneradorCodigo
from .instruccion import Instruccion
from .semantico import AnalizadorSemantico
from .tabla_simbolos import Simbolo


PREFIJOS = {
    "lexer": "Error léxico", "gramatica": "Error sintáctico",
    "semantica": "Error semántico", "intermedio": "Error de generación",
}


class ErroresAntlr(ErrorListener):
    def __init__(self, etapa, diagnosticos):
        self.etapa = etapa
        self.diagnosticos = diagnosticos

    def syntaxError(self, recognizer, offendingSymbol, line, column, msg, e):
        self.diagnosticos.append(Diagnostico(self.etapa, msg, line, column + 1))


@dataclass
class Compilacion:
    lexer: EducativoLexer
    tokens: CommonTokenStream
    parser: EducativoParser | None = None
    arbol: EducativoParser.ProgramaContext | None = None
    instrucciones: list[Instruccion] | None = None
    diagnosticos: list[Diagnostico] = field(default_factory=list)
    simbolos: list[tuple[Simbolo, bool]] = field(default_factory=list)


def compilar(codigo, *, etapa="intermedio", registrar_simbolos=False):
    """Analiza código fuente hasta la etapa indicada y devuelve sus resultados."""
    if etapa not in PREFIJOS:
        raise ValueError(f"Etapa desconocida: {etapa}")
    lexer = EducativoLexer(InputStream(codigo))
    tokens = CommonTokenStream(lexer)
    resultado = Compilacion(lexer, tokens)
    lexer.removeErrorListeners()
    lexer.addErrorListener(ErroresAntlr("lexer", resultado.diagnosticos))
    tokens.fill()
    if resultado.diagnosticos or etapa == "lexer":
        return resultado

    parser = EducativoParser(tokens)
    resultado.parser = parser
    parser.removeErrorListeners()
    parser.addErrorListener(ErroresAntlr("gramatica", resultado.diagnosticos))
    resultado.arbol = parser.programa()
    if resultado.diagnosticos or etapa == "gramatica":
        return resultado

    semantico = AnalizadorSemantico(registrar_simbolos=registrar_simbolos)
    semantico.visit(resultado.arbol)
    resultado.diagnosticos.extend(semantico.errores)
    if registrar_simbolos:
        resultado.simbolos = [simbolo for _, simbolo in sorted(semantico.simbolos.items())]
    if resultado.diagnosticos or etapa == "semantica":
        return resultado

    generador = GeneradorCodigo(tipos_entrada=semantico.tipos_entrada)
    try:
        resultado.instrucciones = generador.visit(resultado.arbol)
    except ErrorGeneracion as error:
        resultado.diagnosticos.append(error.diagnostico)
    return resultado
