"""Analiza un programa .edu con el lexer y el parser, y muestra sus tokens."""

import argparse
import sys
from pathlib import Path

from antlr4 import CommonTokenStream, InputStream, Token
from antlr4.error.ErrorListener import ErrorListener

from generated.EducativoLexer import EducativoLexer
from generated.EducativoParser import EducativoParser


class ErroresLexicos(ErrorListener):
    def __init__(self):
        super().__init__()
        self.errores = []

    def syntaxError(self, recognizer, offendingSymbol, line, column, msg, e):
        self.errores.append(f"Error léxico en {line}:{column + 1}: {msg}")


class ErroresSintacticos(ErrorListener):
    def __init__(self):
        super().__init__()
        self.errores = []

    def syntaxError(self, recognizer, offendingSymbol, line, column, msg, e):
        self.errores.append(f"Error sintáctico en {line}:{column + 1}: {msg}")


def main():
    argumentos = argparse.ArgumentParser(description=__doc__)
    argumentos.add_argument("archivo", type=Path, help="Programa .edu para analizar")
    argumentos.add_argument("--arbol", action="store_true", help="Mostrar el árbol sintáctico")
    opciones = argumentos.parse_args()

    try:
        codigo = opciones.archivo.read_text(encoding="utf-8")
    except (OSError, UnicodeError) as error:
        argumentos.error(f"No se pudo leer el archivo: {error}")

    lexer = EducativoLexer(InputStream(codigo))
    errores = ErroresLexicos()
    lexer.removeErrorListeners()
    lexer.addErrorListener(errores)

    tokens = CommonTokenStream(lexer)
    tokens.fill()

    if errores.errores:
        for mensaje in errores.errores:
            print(mensaje, file=sys.stderr)
        return 1

    parser = EducativoParser(tokens)
    errores_sintacticos = ErroresSintacticos()
    parser.removeErrorListeners()
    parser.addErrorListener(errores_sintacticos)
    arbol = parser.programa()

    if errores_sintacticos.errores:
        for mensaje in errores_sintacticos.errores:
            print(mensaje, file=sys.stderr)
        return 1

    print(f"{'LÍNEA':<7} {'COLUMNA':<9} {'TOKEN':<15} LEXEMA")
    for token in tokens.tokens:
        nombre = "EOF" if token.type == Token.EOF else lexer.symbolicNames[token.type]
        print(f"{token.line:<7} {token.column + 1:<9} {nombre:<15} {token.text!r}")
    print("Análisis sintáctico correcto.")
    if opciones.arbol:
        print(arbol.toStringTree(recog=parser))
    return 0


if __name__ == "__main__":
    sys.exit(main())
