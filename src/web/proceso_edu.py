"""Proceso de compilación o ejecución con mensajes JSON por las tuberías."""

import json
import sys
from dataclasses import asdict

from lenguaje.diagnostico import Diagnostico


KIB = 1024
MAX_CODIGO = 64 * KIB
MAX_MENSAJE = 1024 * KIB
MAX_SALIDA = 64 * KIB


def codificar(datos):
    return json.dumps(datos, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode("utf-8")


def recibir():
    return json.loads(sys.stdin.buffer.readline())


def enviar(datos):
    sys.stdout.buffer.write(datos + b"\n")
    sys.stdout.buffer.flush()


def compilar_programa(codigo):
    from lenguaje.compilador import compilar
    from lenguaje.intermedio import serializar_intermedio

    resultado = compilar(codigo)
    if resultado.diagnosticos:
        return {"diagnosticos": [asdict(d) for d in resultado.diagnosticos]}
    return serializar_intermedio(resultado.instrucciones)


class LimiteEjecucion(Exception):
    pass


def evento(tipo, **campos):
    datos = codificar({"tipo": tipo, **campos})
    if len(datos) > MAX_MENSAJE:
        raise LimiteEjecucion("Se superó el límite de 1 MiB por mensaje.")
    enviar(datos)


def ejecutar_programa(intermedio):
    from lenguaje.intermedio import ErrorIntermedio, validar_intermedio
    from lenguaje.interprete import ErrorEjecucion, ejecutar

    total_salida = 0

    def mostrar(texto):
        nonlocal total_salida
        total_salida += max(1, len(texto.encode("utf-8")))
        if total_salida > MAX_SALIDA:
            raise LimiteEjecucion("Se superó el límite de 64 KiB de salida.")
        evento("salida", texto=texto)

    def preguntar(mensaje):
        evento("pregunta", mensaje=mensaje)
        return recibir()

    try:
        ejecutar(validar_intermedio(intermedio), leer=preguntar, escribir=mostrar,
                 entrada_invalida=lambda mensaje: evento("entrada_invalida", mensaje=mensaje))
    except (ErrorIntermedio, ErrorEjecucion) as error:
        evento("error", diagnosticos=[asdict(error.diagnostico)])
    else:
        evento("fin")


def limitar_recursos():
    if sys.platform == "linux":
        import resource

        memoria = 256 * 1024 * KIB
        resource.setrlimit(resource.RLIMIT_AS, (memoria, memoria))
        resource.setrlimit(resource.RLIMIT_CPU, (2, 2))


def main(modo):
    limitar_recursos()
    try:
        if modo == "compilar":
            enviar(codificar(compilar_programa(recibir())))
        else:
            ejecutar_programa(recibir())
    except (LimiteEjecucion, MemoryError, RecursionError, UnicodeError) as error:
        mensaje = str(error) if isinstance(error, LimiteEjecucion) else "Se superó un límite del programa."
        diagnosticos = [asdict(Diagnostico("limite", mensaje))]
        if modo == "compilar":
            enviar(codificar({"diagnosticos": diagnosticos}))
        else:
            evento("error", diagnosticos=diagnosticos)


if __name__ == "__main__":
    main(sys.argv[1])
