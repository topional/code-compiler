"""Representa una orden del código intermedio, sin ejecutarla."""

from dataclasses import dataclass


@dataclass
class Instruccion:
    operacion: str
    argumento1: str | None = None
    argumento2: str | None = None
    resultado: str | None = None
    linea: int | None = None
    columna: int | None = None
    tipo: str | None = None
    nombre: str | None = None
