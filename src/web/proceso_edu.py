"""Proceso de compilación o ejecución con mensajes JSON por las tuberías."""

import json
import sys
from dataclasses import asdict

from lenguaje.diagnostico import Diagnostico


KIB = 1024
MAX_CODIGO = 64 * KIB
MAX_MENSAJE = 1024 * KIB
MAX_SALIDA = 64 * KIB
MAX_ESTADOS = 4 * MAX_MENSAJE


def codificar(datos):
    return json.dumps(datos, ensure_ascii=False, separators=(",", ":"), allow_nan=False).encode("utf-8")


def recibir():
    return json.loads(sys.stdin.buffer.readline())


def enviar(datos):
    sys.stdout.buffer.write(datos + b"\n")
    sys.stdout.buffer.flush()


def serializar_analisis(resultado):
    from antlr4 import Token

    arbol = None
    if resultado.arbol is not None and not any(d.etapa == "gramatica" for d in resultado.diagnosticos):
        cantidad = 0
        instrucciones = resultado.arbol.instrucciones()
        while instrucciones is not None and instrucciones.sentencia() is not None:
            cantidad += 1
            instrucciones = instrucciones.restoPrograma().instrucciones()
        arbol = {"sentencias": cantidad}

    return {
        "tokens": [
            {"tipo": resultado.lexer.symbolicNames[token.type], "texto": token.text,
             "linea": token.line, "columna": token.column + 1}
            for token in resultado.tokens.tokens if token.type != Token.EOF
        ],
        "arbol": arbol,
        "simbolos": [
            {"nombre": simbolo.nombre, "tipo": simbolo.tipo, "linea": simbolo.linea,
             "columna": simbolo.columna, "esFuncion": es_funcion}
            for simbolo, es_funcion in resultado.simbolos
        ],
    }


def compilar_programa(codigo, analisis):
    from lenguaje.compilador import compilar
    from lenguaje.intermedio import serializar_intermedio

    resultado = compilar(codigo, registrar_simbolos=analisis)
    if resultado.diagnosticos:
        datos = {"diagnosticos": [asdict(d) for d in resultado.diagnosticos]}
    else:
        datos = serializar_intermedio(resultado.instrucciones)
    if analisis:
        datos["analisis"] = serializar_analisis(resultado)
    return datos


class LimiteEjecucion(Exception):
    pass


def evento(tipo, *, presupuesto=None, **campos):
    datos = codificar({"tipo": tipo, **campos})
    if len(datos) > MAX_MENSAJE:
        raise LimiteEjecucion("Se superó el límite de 1 MiB por mensaje.")
    if presupuesto is not None and len(datos) > presupuesto:
        raise LimiteEjecucion("Se superó el límite de 4 MiB de estados de ejecución.")
    enviar(datos)
    return len(datos)


def ejecutar_programa(intermedio, modo):
    from lenguaje.intermedio import ErrorIntermedio, validar_intermedio
    from lenguaje.interprete import ErrorEjecucion, ejecutar

    total_salida = 0
    restante_estado = MAX_ESTADOS

    def mostrar(texto):
        nonlocal total_salida
        total_salida += max(1, len(texto.encode("utf-8")))
        if total_salida > MAX_SALIDA:
            raise LimiteEjecucion("Se superó el límite de 64 KiB de salida.")
        evento("salida", texto=texto)

    def preguntar(mensaje):
        evento("pregunta", mensaje=mensaje)
        return recibir()

    def observar(estado, final):
        nonlocal restante_estado
        pausado = modo == "paso" and not final
        restante_estado -= evento("estado", presupuesto=restante_estado, pausado=pausado, **estado)
        if pausado:
            recibir()

    try:
        ejecutar(validar_intermedio(intermedio), leer=preguntar, escribir=mostrar,
                 entrada_invalida=lambda mensaje: evento("entrada_invalida", mensaje=mensaje),
                 observar=None if modo == "normal" else observar)
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
            solicitud = recibir()
            enviar(codificar(compilar_programa(solicitud["codigo"], solicitud["analisis"])))
        else:
            inicio = recibir()
            ejecutar_programa(inicio["intermedio"], inicio["modo"])
    except (LimiteEjecucion, MemoryError, RecursionError, UnicodeError) as error:
        mensaje = str(error) if isinstance(error, LimiteEjecucion) else "Se superó un límite del programa."
        diagnosticos = [asdict(Diagnostico("limite", mensaje))]
        if modo == "compilar":
            enviar(codificar({"diagnosticos": diagnosticos}))
        else:
            evento("error", diagnosticos=diagnosticos)


if __name__ == "__main__":
    main(sys.argv[1])
