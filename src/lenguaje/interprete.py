"""Ejecuta instrucciones de código intermedio."""

import json
import operator
from dataclasses import dataclass, field
from fractions import Fraction
from random import randint

from .diagnostico import Diagnostico
from .intermedio import ErrorIntermedio


NUMERICAS = {
    "+": operator.add, "-": operator.sub, "*": operator.mul, "/": operator.truediv,
    "<": operator.lt, ">": operator.gt, "<=": operator.le, ">=": operator.ge,
}
IGUALDAD = {"==": operator.eq, "!=": operator.ne}
LOGICAS = {"y": operator.and_, "o": operator.or_}
TIPOS = {"numero": Fraction, "texto": str, "logico": bool}
LOGICOS = {"verdadero": True, "falso": False}

BINARIA = ("argumento1", "argumento2", "resultado")
UNARIA = ("argumento1", "resultado")
REQUERIDOS = {
    **dict.fromkeys(NUMERICAS | IGUALDAD | LOGICAS, BINARIA),
    "aleatorio": BINARIA, "funcion": BINARIA, "llamar": BINARIA,
    "asignar": UNARIA, "leer": UNARIA, "no": UNARIA, "saltar_si_falso": UNARIA,
    "preguntar": UNARIA, "parametro": (*UNARIA, "tipo"),
    "argumento": ("argumento1", "argumento2"),
    "declarar": ("resultado",), "etiqueta": ("resultado",), "saltar": ("resultado",),
    "mostrar": ("argumento1",), "devolver": ("argumento1",),
    "comprobar_repeticiones": ("argumento1",), "fin_funcion": ("argumento1",),
    "motivacion": ("argumento1",), "abrir_ambito": (), "cerrar_ambito": (),
}


class ErrorEjecucion(Exception):
    def __init__(self, diagnostico):
        self.diagnostico = diagnostico
        super().__init__(diagnostico.en_terminal("Error de ejecución"))


@dataclass
class Ambito:
    exterior: "Ambito | None" = None
    nombres: dict = field(default_factory=dict)

    def buscar(self, identificador):
        ambito = self
        while ambito is not None:
            if identificador in ambito.nombres:
                return ambito.nombres
            ambito = ambito.exterior
        raise ValueError(f"'{identificador}' no está declarado en este ámbito.")


@dataclass
class Funcion:
    entrada: int
    tipo_retorno: str
    ambito: Ambito


@dataclass
class Marco:
    ambitos: list[Ambito]
    argumentos: list = field(default_factory=list)
    tipo_retorno: str | None = None
    temporales: dict = field(default_factory=dict)
    pendientes: list = field(default_factory=list)

    @property
    def ambito(self):
        return self.ambitos[-1]

    def valor(self, operando):
        if operando.startswith("%t"):
            if operando not in self.temporales:
                raise ValueError(f"el temporal '{operando}' no tiene un valor.")
            return self.temporales[operando]
        if operando.startswith("%v"):
            valor = self.ambito.buscar(operando)[operando]
            if valor is None:
                nombre = operando.partition("_")[2] or operando
                raise ValueError(f"la variable '{nombre}' no está inicializada.")
            return valor
        if operando.startswith('"'):
            # El lexer admite tabulaciones literales dentro de las comillas.
            return json.loads(operando, strict=False)
        if operando in LOGICOS:
            return LOGICOS[operando]
        return Fraction(operando)

    def guardar(self, destino, valor):
        if destino.startswith("%t"):
            self.temporales[destino] = valor
        else:
            self.ambito.buscar(destino)[destino] = valor


def etiquetas_del_programa(instrucciones):
    etiquetas = {}
    for posicion, instruccion in enumerate(instrucciones):
        operacion = instruccion.operacion
        prefijo = f"Código intermedio inválido en la instrucción {posicion + 1}"
        ubicacion = (instruccion.linea, instruccion.columna)
        if operacion not in REQUERIDOS:
            raise ErrorIntermedio(f"{prefijo}: operación desconocida '{operacion}'.", *ubicacion)
        for campo in REQUERIDOS[operacion]:
            if not getattr(instruccion, campo):
                raise ErrorIntermedio(f"{prefijo}: falta '{campo}' para '{operacion}'.", *ubicacion)
        if operacion == "etiqueta":
            if instruccion.resultado in etiquetas:
                raise ErrorIntermedio(f"{prefijo}: etiqueta duplicada '{instruccion.resultado}'.", *ubicacion)
            etiquetas[instruccion.resultado] = posicion

    for posicion, instruccion in enumerate(instrucciones, 1):
        if instruccion.operacion in ("saltar", "saltar_si_falso"):
            destino = instruccion.resultado
        elif instruccion.operacion == "funcion":
            destino = instruccion.argumento1
        else:
            continue
        if destino not in etiquetas:
            raise ErrorIntermedio(f"Código intermedio inválido en la instrucción {posicion}: "
                                  f"no existe la etiqueta '{destino}'.", instruccion.linea, instruccion.columna)
    return etiquetas


def exigir_tipo(valor, tipo):
    if tipo not in TIPOS:
        raise ValueError(f"tipo desconocido '{tipo}'.")
    if not isinstance(valor, TIPOS[tipo]):
        raise ValueError(f"se esperaba un valor de tipo {tipo}.")
    return valor


def entero(valor, mensaje):
    if not isinstance(valor, Fraction) or valor.denominator != 1:
        raise ValueError(mensaje)
    return valor.numerator


def formatear(valor):
    if isinstance(valor, bool):
        return "verdadero" if valor else "falso"
    return str(valor)


def preguntar(mensaje, tipo, leer, escribir):
    if tipo not in TIPOS:
        raise ValueError(f"tipo de entrada desconocido '{tipo}'.")
    while True:
        entrada = leer(mensaje)
        try:
            if tipo == "numero":
                return Fraction(entrada.strip())
            if tipo == "logico":
                return LOGICOS[entrada.strip().lower()]
            return entrada
        except (ValueError, ZeroDivisionError, KeyError):
            escribir(f"Entrada inválida. Se esperaba un valor de tipo {tipo}.")


def error_de_ejecucion(instruccion, mensaje):
    return ErrorEjecucion(Diagnostico("ejecucion", mensaje, instruccion.linea, instruccion.columna))


def ejecutar(instrucciones, *, leer, escribir, entrada_invalida=None):
    """Ejecuta instrucciones con callbacks para preguntas, salida y avisos de entrada."""
    if entrada_invalida is None:
        entrada_invalida = escribir
    etiquetas = etiquetas_del_programa(instrucciones)
    marco = Marco([Ambito()])
    pila = []
    posicion = 0
    while posicion < len(instrucciones):
        instruccion = instrucciones[posicion]
        operacion = instruccion.operacion
        primero, segundo, destino = instruccion.argumento1, instruccion.argumento2, instruccion.resultado
        posicion += 1
        try:
            match operacion:
                case "declarar":
                    marco.ambito.nombres[destino] = None
                case "asignar" | "leer":
                    marco.guardar(destino, marco.valor(primero))
                case op if op in NUMERICAS:
                    izquierdo = exigir_tipo(marco.valor(primero), "numero")
                    derecho = exigir_tipo(marco.valor(segundo), "numero")
                    marco.guardar(destino, NUMERICAS[op](izquierdo, derecho))
                case op if op in IGUALDAD:
                    izquierdo, derecho = marco.valor(primero), marco.valor(segundo)
                    if type(izquierdo) is not type(derecho):
                        raise ValueError("no se pueden comparar valores de tipos diferentes.")
                    marco.guardar(destino, IGUALDAD[op](izquierdo, derecho))
                case op if op in LOGICAS:
                    izquierdo = exigir_tipo(marco.valor(primero), "logico")
                    derecho = exigir_tipo(marco.valor(segundo), "logico")
                    marco.guardar(destino, LOGICAS[op](izquierdo, derecho))
                case "no":
                    marco.guardar(destino, not exigir_tipo(marco.valor(primero), "logico"))
                case "mostrar":
                    escribir(formatear(marco.valor(primero)))
                case "preguntar":
                    nombres = marco.ambito.buscar(destino)
                    tipo = instruccion.tipo or "automatico"
                    if tipo == "automatico":
                        valor = nombres[destino]
                        tipo = next((nombre for nombre, clase in TIPOS.items()
                                     if isinstance(valor, clase)), "texto")
                    mensaje = exigir_tipo(marco.valor(primero), "texto")
                    nombres[destino] = preguntar(mensaje, tipo, leer, entrada_invalida)
                case "saltar":
                    posicion = etiquetas[destino]
                case "saltar_si_falso":
                    if not exigir_tipo(marco.valor(primero), "logico"):
                        posicion = etiquetas[destino]
                case "abrir_ambito":
                    marco.ambitos.append(Ambito(marco.ambito))
                case "cerrar_ambito":
                    if len(marco.ambitos) == 1:
                        raise ValueError("no hay un bloque abierto para cerrar.")
                    marco.ambitos.pop()
                case "comprobar_repeticiones":
                    mensaje = "la cantidad de repeticiones debe ser un entero no negativo."
                    if entero(marco.valor(primero), mensaje) < 0:
                        raise ValueError(mensaje)
                case "aleatorio":
                    mensaje = "los límites del aleatorio deben ser enteros."
                    minimo = entero(marco.valor(primero), mensaje)
                    maximo = entero(marco.valor(segundo), mensaje)
                    if minimo > maximo:
                        raise ValueError("el límite mínimo del aleatorio no puede ser mayor que el máximo.")
                    marco.guardar(destino, Fraction(randint(minimo, maximo)))
                case "funcion":
                    marco.ambito.nombres[destino] = Funcion(etiquetas[primero], segundo, marco.ambito)
                case "argumento":
                    if int(segundo) != len(marco.pendientes):
                        raise ValueError("los argumentos de la llamada están fuera de orden.")
                    marco.pendientes.append(marco.valor(primero))
                case "llamar":
                    funcion = marco.ambito.buscar(primero)[primero]
                    if not isinstance(funcion, Funcion):
                        raise ValueError(f"'{primero}' no es una función.")
                    argumentos = marco.pendientes
                    if len(argumentos) != int(segundo):
                        raise ValueError("la cantidad de argumentos de la llamada es incorrecta.")
                    marco.pendientes = []
                    pila.append((marco, posicion, destino))
                    marco = Marco([Ambito(funcion.ambito)], argumentos, funcion.tipo_retorno)
                    posicion = funcion.entrada
                case "parametro":
                    indice = int(primero)
                    if not 0 <= indice < len(marco.argumentos):
                        raise ValueError("falta un argumento para el parámetro.")
                    marco.ambito.nombres[destino] = exigir_tipo(marco.argumentos[indice], instruccion.tipo)
                case "devolver":
                    if not pila:
                        raise ValueError("'devolver' requiere una llamada activa.")
                    valor = exigir_tipo(marco.valor(primero), marco.tipo_retorno)
                    marco, posicion, destino = pila.pop()
                    marco.guardar(destino, valor)
                case "fin_funcion":
                    raise ValueError("la función terminó sin devolver un valor.")
                case "etiqueta" | "motivacion":
                    pass
        except ZeroDivisionError:
            raise error_de_ejecucion(instruccion, "división por cero.") from None
        except EOFError:
            raise error_de_ejecucion(instruccion, "se agotó la entrada al preguntar.") from None
        except ValueError as error:
            raise error_de_ejecucion(instruccion, str(error)) from None
    if pila or len(marco.ambitos) != 1:
        raise error_de_ejecucion(instruccion, "el programa terminó con una llamada o un bloque abierto.")
