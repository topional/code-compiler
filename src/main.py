"""Analiza un archivo .edu y permite generar código de tres direcciones."""

import argparse
import json
import sys
from pathlib import Path
from tempfile import NamedTemporaryFile

from antlr4 import Token

from lenguaje.compilador import PREFIJOS, compilar
from lenguaje.intermedio import serializar_intermedio


def mostrar_tokens(tokens, lexer):
    print(f"{'LÍNEA':<7} {'COLUMNA':<9} {'TOKEN':<15} LEXEMA")
    for token in tokens.tokens:
        nombre = "EOF" if token.type == Token.EOF else lexer.symbolicNames[token.type]
        print(f"{token.line:<7} {token.column + 1:<9} {nombre:<15} {token.text!r}")


def exportar_intermedio(entrada, salida, instrucciones):
    if (salida.suffix.lower() == ".edu" or salida.resolve().suffix.lower() == ".edu"
            or (salida.exists() and salida.samefile(entrada))):
        raise ValueError("la salida no puede sobrescribir un programa .edu ni el archivo de entrada.")

    datos = serializar_intermedio(instrucciones)
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
    argumentos.add_argument("--etapa", choices=PREFIJOS,
                            default="semantica", help="Última etapa que se analiza (por defecto: semantica)")
    argumentos.add_argument("--salida", type=Path, help="Guardar el código intermedio en un archivo JSON")
    opciones = argumentos.parse_args()
    if opciones.salida is not None and opciones.etapa != "intermedio":
        argumentos.error("--salida requiere --etapa intermedio")

    try:
        entrada = Path(opciones.archivo).read_bytes().decode("utf-8")
    except (OSError, UnicodeError) as error:
        argumentos.error(f"No se pudo leer el archivo: {error}")

    resultado = compilar(entrada, etapa=opciones.etapa)
    if resultado.diagnosticos:
        for diagnostico in resultado.diagnosticos:
            print(diagnostico.en_terminal(PREFIJOS[diagnostico.etapa]), file=sys.stderr)
        return 1

    if opciones.etapa == "lexer":
        mostrar_tokens(resultado.tokens, resultado.lexer)
        print("Análisis léxico correcto.")
        return 0

    if opciones.etapa == "intermedio":
        if opciones.salida is not None:
            try:
                exportar_intermedio(Path(opciones.archivo), opciones.salida, resultado.instrucciones)
            except (OSError, ValueError, RuntimeError) as error:
                print(f"No se pudo guardar el código intermedio: {error}", file=sys.stderr)
                return 1
        return 0

    mostrar_tokens(resultado.tokens, resultado.lexer)
    print("Análisis sintáctico correcto.")
    if opciones.etapa == "semantica":
        print("Análisis semántico correcto.")
    if opciones.arbol:
        print(resultado.arbol.toStringTree(recog=resultado.parser))
    return 0


if __name__ == "__main__":
    sys.exit(main())
