"""Serializa y valida el formato JSON de código intermedio."""

import json
from dataclasses import asdict, fields
from pathlib import Path

from .diagnostico import Diagnostico
from .instruccion import Instruccion


VERSION = 1
CAMPOS = {campo.name for campo in fields(Instruccion)}


class ErrorIntermedio(Exception):
    def __init__(self, mensaje, linea=None, columna=None):
        self.diagnostico = Diagnostico("intermedio", mensaje, linea, columna)
        super().__init__(mensaje)


def serializar_intermedio(instrucciones):
    return {"version": VERSION, "instrucciones": [asdict(i) for i in instrucciones]}


def cargar_intermedio(ruta):
    try:
        datos = json.loads(Path(ruta).read_text(encoding="utf-8"))
    except (OSError, ValueError, RecursionError) as error:
        raise ErrorIntermedio(f"No se pudo leer el JSON de código intermedio: {error}") from None
    return validar_intermedio(datos)


def posicion_valida(valor):
    return type(valor) is int and valor > 0


def validar_intermedio(datos):
    if not isinstance(datos, dict) or type(datos.get("version")) is not int or datos["version"] != VERSION:
        raise ErrorIntermedio("Código intermedio inválido: se requiere la versión 1.")
    instrucciones = datos.get("instrucciones")
    if not isinstance(instrucciones, list):
        raise ErrorIntermedio("Código intermedio inválido: 'instrucciones' debe ser una lista.")

    programa = []
    for numero, datos_instruccion in enumerate(instrucciones, 1):
        prefijo = f"Código intermedio inválido en la instrucción {numero}"
        if not isinstance(datos_instruccion, dict) or datos_instruccion.keys() - CAMPOS:
            raise ErrorIntermedio(f"{prefijo}: se esperaba un objeto con campos de Instruccion.")
        linea = datos_instruccion.get("linea")
        columna = datos_instruccion.get("columna")
        ubicacion = (linea if posicion_valida(linea) else None, columna if posicion_valida(columna) else None)
        for nombre, valor in datos_instruccion.items():
            if valor is None:
                continue
            valido = posicion_valida(valor) if nombre in ("linea", "columna") else isinstance(valor, str)
            if not valido:
                raise ErrorIntermedio(f"{prefijo}: campo '{nombre}' inválido.", *ubicacion)
        if not isinstance(datos_instruccion.get("operacion"), str):
            raise ErrorIntermedio(f"{prefijo}: falta una operación válida.", *ubicacion)
        programa.append(Instruccion(**datos_instruccion))
    return programa
