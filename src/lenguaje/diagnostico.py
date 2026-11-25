"""Diagnósticos con ubicación compartidos por la terminal y la API."""

from dataclasses import dataclass


@dataclass(frozen=True)
class Diagnostico:
    etapa: str
    mensaje: str
    linea: int | None = None
    columna: int | None = None

    @classmethod
    def desde_token(cls, etapa, mensaje, token):
        return cls(etapa, mensaje, token.line, token.column + 1)

    def en_terminal(self, prefijo):
        ubicacion = ""
        if self.linea is not None:
            ubicacion = f" en {self.linea}"
            if self.columna is not None:
                ubicacion += f":{self.columna}"
        return f"{prefijo}{ubicacion}: {self.mensaje}"
