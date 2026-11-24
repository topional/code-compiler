"""Construye código intermedio estructurado; no ejecuta instrucciones."""

from instruccion import Instruccion


class Builder:
    def __init__(self):
        self.instrucciones: list[Instruccion] = []
        self.contador = 0
        self.contador_etiquetas = 0

    def emitir(self, operacion, argumento1=None, argumento2=None, resultado=None,
               *, linea=None, columna=None, tipo=None, nombre=None):
        self.instrucciones.append(Instruccion(
            operacion=operacion, argumento1=argumento1, argumento2=argumento2,
            resultado=resultado, linea=linea, columna=columna,
            tipo=tipo, nombre=nombre,
        ))

    def temporal(self):
        self.contador += 1
        return f"%t{self.contador}"

    def nueva_etiqueta(self):
        self.contador_etiquetas += 1
        return f"%L{self.contador_etiquetas}"

    def declarar(self, identificador, **origen):
        self.emitir("declarar", resultado=identificador, **origen)

    def asignar(self, nombre, valor, **origen):
        self.emitir("asignar", valor, resultado=nombre, **origen)

    def leer(self, nombre, **origen):
        temporal = self.temporal()
        self.emitir("leer", nombre, resultado=temporal, **origen)
        return temporal

    def operacion(self, operador, izquierdo, derecho, **origen):
        if operador not in ("+", "-", "*", "/", "==", "!=", ">", "<", ">=", "<=", "y", "o"):
            raise ValueError(f"Operador binario no soportado: {operador}")
        temporal = self.temporal()
        self.emitir(operador, izquierdo, derecho, temporal, **origen)
        return temporal

    def negar(self, valor, **origen):
        temporal = self.temporal()
        self.emitir("no", valor, resultado=temporal, **origen)
        return temporal

    def mostrar(self, valor, **origen):
        self.emitir("mostrar", valor, **origen)

    def preguntar(self, mensaje, destino, **origen):
        self.emitir("preguntar", mensaje, resultado=destino, **origen)

    def etiqueta(self, nombre, **origen):
        self.emitir("etiqueta", resultado=nombre, **origen)

    def saltar(self, destino, **origen):
        self.emitir("saltar", resultado=destino, **origen)

    def saltar_si_falso(self, condicion, destino, **origen):
        self.emitir("saltar_si_falso", condicion, resultado=destino, **origen)

    def abrir_ambito(self, **origen):
        self.emitir("abrir_ambito", **origen)

    def cerrar_ambito(self, **origen):
        self.emitir("cerrar_ambito", **origen)

    def comprobar_repeticiones(self, cantidad, **origen):
        self.emitir("comprobar_repeticiones", cantidad, **origen)

    def aleatorio(self, minimo, maximo, **origen):
        temporal = self.temporal()
        self.emitir("aleatorio", minimo, maximo, temporal, **origen)
        return temporal

    def funcion(self, identificador, entrada, retorno, **origen):
        self.emitir("funcion", entrada, retorno, identificador, **origen)

    def parametro(self, posicion, destino, **origen):
        self.emitir("parametro", str(posicion), resultado=destino, **origen)

    def llamar(self, nombre, argumentos, **origen):
        # Los argumentos ya están evaluados: una llamada anidada no los mezcla.
        for posicion, valor in enumerate(argumentos):
            self.emitir("argumento", valor, str(posicion), **origen)
        temporal = self.temporal()
        self.emitir("llamar", nombre, str(len(argumentos)), temporal, **origen)
        return temporal

    def devolver(self, valor, **origen):
        self.emitir("devolver", valor, **origen)

    def fin_funcion(self, nombre, **origen):
        self.emitir("fin_funcion", nombre, **origen)

    def motivacion(self, nombre, **origen):
        self.emitir("motivacion", nombre, **origen)
