"""Ejecuta un programa de código intermedio exportado en JSON."""

import argparse
import sys
from pathlib import Path

from lenguaje.intermedio import ErrorIntermedio, cargar_intermedio
from lenguaje.interprete import ErrorEjecucion, ejecutar


def main():
    argumentos = argparse.ArgumentParser(description=__doc__)
    argumentos.add_argument("archivo", type=Path, help="Archivo de código intermedio JSON")
    opciones = argumentos.parse_args()
    try:
        ejecutar(cargar_intermedio(opciones.archivo),
                 leer=lambda mensaje: input(f"{mensaje} "), escribir=print)
    except (ErrorIntermedio, ErrorEjecucion) as error:
        print(error, file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
