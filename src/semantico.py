"""Análisis semántico parcial: declaraciones y usos de variables."""

from dataclasses import dataclass

from generated.EducativoParserVisitor import EducativoParserVisitor


@dataclass(frozen=True)
class Simbolo:
    nombre: str
    linea: int
    columna: int


class TablaSimbolos:
    def __init__(self):
        self.ambitos = [{}]

    def abrir_ambito(self):
        self.ambitos.append({})

    def cerrar_ambito(self):
        self.ambitos.pop()

    def declarar(self, token):
        actual = self.ambitos[-1]
        anterior = actual.get(token.text)
        if anterior is None:
            actual[token.text] = Simbolo(token.text, token.line, token.column + 1)
        return anterior

    def buscar(self, nombre):
        for ambito in reversed(self.ambitos):
            if nombre in ambito:
                return ambito[nombre]
        return None


class AnalizadorSemantico(EducativoParserVisitor):
    """Recorre en orden de fuente un árbol sin errores léxicos ni sintácticos.

    Las funciones y bloques crean ámbitos. Los parámetros comparten ámbito
    con el cuerpo de su función. Se permite ocultar nombres de ámbitos externos.
    Cada instancia analiza un programa; aún no valida tipos ni inicialización.
    """

    def __init__(self):
        self.tabla = TablaSimbolos()
        self.errores = []

    def error(self, token, mensaje):
        self.errores.append(
            f"Error semántico en {token.line}:{token.column + 1}: {mensaje}"
        )

    def declarar(self, nodo):
        token = nodo.getSymbol()
        anterior = self.tabla.declarar(token)
        if anterior is not None:
            self.error(token, f"la variable '{token.text}' ya está declarada en este ámbito "
                       f"(primera declaración en {anterior.linea}:{anterior.columna}).")

    def comprobar_uso(self, nodo):
        token = nodo.getSymbol()
        if self.tabla.buscar(token.text) is None:
            self.error(token, f"la variable '{token.text}' no está declarada.")

    def visitDeclaracion(self, ctx):
        self.declarar(ctx.ID())

    def visitAsignacion(self, ctx):
        self.comprobar_uso(ctx.ID())
        self.visit(ctx.expresion())

    def visitEntrada(self, ctx):
        self.comprobar_uso(ctx.ID())

    def visitPrimaria(self, ctx):
        if ctx.ID() is not None:
            self.comprobar_uso(ctx.ID())
        return self.visitChildren(ctx)

    def visitLimite(self, ctx):
        if ctx.ID() is not None:
            self.comprobar_uso(ctx.ID())

    def visitBloque(self, ctx):
        self.tabla.abrir_ambito()
        try:
            return self.visitChildren(ctx)
        finally:
            self.tabla.cerrar_ambito()

    def visitFuncion(self, ctx):
        self.tabla.abrir_ambito()
        try:
            if ctx.parametros() is not None:
                for parametro in ctx.parametros().parametro():
                    self.declarar(parametro.ID())
            # Evita abrir otro ámbito: parámetros y declaraciones del cuerpo
            # deben detectar duplicados entre sí.
            return self.visitChildren(ctx.bloque())
        finally:
            self.tabla.cerrar_ambito()

    def visitLlamada(self, ctx):
        # El ID de la llamada es una función, no una variable.
        # Sus argumentos sí pueden contener usos de variables.
        if ctx.argumentos() is not None:
            return self.visit(ctx.argumentos())
