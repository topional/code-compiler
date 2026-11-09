"""Guarda las variables de cada ámbito."""

from dataclasses import dataclass
from fractions import Fraction


@dataclass
class Simbolo:
    nombre: str
    linea: int
    columna: int
    tipo: str | None = None
    inicializada: bool = False
    valor_numerico: Fraction | None = None


class TablaSimbolos:
    def __init__(self):
        self.ambitos = [{}]

    def abrir_ambito(self):
        self.ambitos.append({})

    def cerrar_ambito(self):
        self.ambitos.pop()

    def declarar(self, token, tipo=None, inicializada=False):
        actual = self.ambitos[-1]
        anterior = actual.get(token.text)
        if anterior is None:
            actual[token.text] = Simbolo(token.text, token.line, token.column + 1,
                                        tipo, inicializada)
        return anterior

    def buscar(self, nombre):
        for ambito in reversed(self.ambitos):
            if nombre in ambito:
                return ambito[nombre]
        return None

    def estado(self):
        """Guarda tipos, inicialización y constantes antes de una rama."""
        return [(simbolo, simbolo.tipo, simbolo.inicializada, simbolo.valor_numerico)
                for ambito in self.ambitos for simbolo in ambito.values()]

    @staticmethod
    def restaurar(estado):
        for simbolo, tipo, inicializada, valor_numerico in estado:
            simbolo.tipo = tipo
            simbolo.inicializada = inicializada
            simbolo.valor_numerico = valor_numerico
