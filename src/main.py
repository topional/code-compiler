"""Analiza un archivo .edu y permite generar código de tres direcciones."""

import argparse
import json
import sys
from dataclasses import asdict
from pathlib import Path
from tempfile import NamedTemporaryFile

from antlr4 import CommonTokenStream, FileStream, Token
from antlr4.error.ErrorListener import ErrorListener

from generated.EducativoLexer import EducativoLexer
from generated.EducativoParser import EducativoParser
from generador import ErrorGeneracion, GeneradorCodigo
from semantico import AnalizadorSemantico


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


def mostrar_tokens(tokens, lexer):
    print(f"{'LÍNEA':<7} {'COLUMNA':<9} {'TOKEN':<15} LEXEMA")
    for token in tokens.tokens:
        nombre = "EOF" if token.type == Token.EOF else lexer.symbolicNames[token.type]
        print(f"{token.line:<7} {token.column + 1:<9} {nombre:<15} {token.text!r}")


def exportar_intermedio(entrada, salida, instrucciones):
    if (salida.suffix.lower() == ".edu" or salida.resolve().suffix.lower() == ".edu"
            or (salida.exists() and salida.samefile(entrada))):
        raise ValueError("la salida no puede sobrescribir un programa .edu ni el archivo de entrada.")

    datos = {"version": 1, "instrucciones": [asdict(i) for i in instrucciones]}
    temporal = None
    try:
        with NamedTemporaryFile(mode="w", encoding="utf-8", newline="\n",
                                dir=salida.parent, delete=False) as archivo:
            temporal = Path(archivo.name)
            json.dump(datos, archivo, ensure_ascii=False, indent=2)
            archivo.write("\n")
        temporal.replace(salida)
        temporal = None
    finally:
        if temporal is not None:
            temporal.unlink(missing_ok=True)


def main():
    argumentos = argparse.ArgumentParser(description=__doc__)
    argumentos.add_argument("archivo", help="Programa .edu para analizar")
    argumentos.add_argument("--arbol", action="store_true", help="Mostrar el árbol sintáctico")
    argumentos.add_argument("--etapa", choices=("lexer", "gramatica", "semantica", "intermedio"),
                            default="semantica", help="Última etapa que se analiza (por defecto: semantica)")
    argumentos.add_argument("--salida", type=Path, help="Guardar el código intermedio en un archivo JSON")
    opciones = argumentos.parse_args()
    if opciones.salida is not None and opciones.etapa != "intermedio":
        argumentos.error("--salida requiere --etapa intermedio")

    try:
        entrada = FileStream(opciones.archivo, encoding="utf-8")
    except (OSError, UnicodeError) as error:
        argumentos.error(f"No se pudo leer el archivo: {error}")

    lexer = EducativoLexer(entrada)
    errores = ErroresLexicos()
    lexer.removeErrorListeners()
    lexer.addErrorListener(errores)

    tokens = CommonTokenStream(lexer)
    tokens.fill()

    if errores.errores:
        for mensaje in errores.errores:
            print(mensaje, file=sys.stderr)
        return 1

    if opciones.etapa == "lexer":
        mostrar_tokens(tokens, lexer)
        print("Análisis léxico correcto.")
        return 0

    parser = EducativoParser(tokens)
    errores_sintacticos = ErroresSintacticos()
    parser.removeErrorListeners()
    parser.addErrorListener(errores_sintacticos)
    arbol = parser.programa()

    if errores_sintacticos.errores:
        for mensaje in errores_sintacticos.errores:
            print(mensaje, file=sys.stderr)
        return 1

    if opciones.etapa in ("semantica", "intermedio"):
        semantico = AnalizadorSemantico()
        semantico.visit(arbol)
        if semantico.errores:
            for mensaje in semantico.errores:
                print(mensaje, file=sys.stderr)
            return 1

    if opciones.etapa == "intermedio":
        generador = GeneradorCodigo(tipos_entrada=semantico.tipos_entrada)
        try:
            instrucciones = generador.visit(arbol)
        except ErrorGeneracion as error:
            print(error, file=sys.stderr)
            return 1
        if opciones.salida is not None:
            try:
                exportar_intermedio(Path(opciones.archivo), opciones.salida, instrucciones)
            except (OSError, ValueError, RuntimeError) as error:
                print(f"No se pudo guardar el código intermedio: {error}", file=sys.stderr)
                return 1
        return 0

    mostrar_tokens(tokens, lexer)
    print("Análisis sintáctico correcto.")
    if opciones.etapa == "semantica":
        print("Análisis semántico correcto.")
    if opciones.arbol:
        print(arbol.toStringTree(recog=parser))
    return 0


if __name__ == "__main__":
    sys.exit(main())
