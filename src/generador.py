"""Genera tres direcciones para variables, aritmética y salida."""

from generated.EducativoParserVisitor import EducativoParserVisitor


class ErrorGeneracion(Exception):
    def __init__(self, ctx, construccion):
        token = ctx.start
        super().__init__(
            f"Error de generación en {token.line}:{token.column + 1}: "
            f"{construccion} todavía no está soportado por el generador."
        )


class GeneradorCodigo(EducativoParserVisitor):
    def __init__(self):
        self.instrucciones = []
        self.contador = 0

    def emitir_operacion(self, operador, izquierdo, derecho):
        self.contador += 1
        # '%' distingue los temporales de los identificadores del programa.
        temporal = f"%t{self.contador}"
        self.instrucciones.append(f"{temporal} = {izquierdo} {operador} {derecho}")
        return temporal

    def visitPrograma(self, ctx):
        self.visit(ctx.instrucciones())
        return self.instrucciones

    def visitInstrucciones(self, ctx):
        while ctx is not None and ctx.sentencia() is not None:
            self.visit(ctx.sentencia())
            ctx = ctx.restoPrograma().instrucciones()

    def visitSentencia(self, ctx):
        if ctx.declaracion() is not None:
            return self.visit(ctx.declaracion())
        if ctx.asignacion() is not None:
            return self.visit(ctx.asignacion())
        if ctx.salida() is not None:
            return self.visit(ctx.salida())
        raise ErrorGeneracion(ctx, f"El uso de '{ctx.start.text}'")

    def visitDeclaracion(self, ctx):
        self.instrucciones.append(f"declarar {ctx.ID().getText()}")

    def visitAsignacion(self, ctx):
        resultado = self.visit(ctx.expresion())
        self.instrucciones.append(f"{ctx.ID().getText()} = {resultado}")

    def visitSalida(self, ctx):
        resultado = self.visit(ctx.expresion())
        self.instrucciones.append(f"mostrar {resultado}")

    def visitExpresion(self, ctx):
        return self.visit(ctx.disyuncion())

    def visitDisyuncion(self, ctx):
        if ctx.restoO().getChildCount() != 0:
            raise ErrorGeneracion(ctx.restoO(), "El operador 'o'")
        return self.visit(ctx.conjuncion())

    def visitConjuncion(self, ctx):
        if ctx.restoY().getChildCount() != 0:
            raise ErrorGeneracion(ctx.restoY(), "El operador 'y'")
        return self.visit(ctx.negacion())

    def visitNegacion(self, ctx):
        if ctx.NO() is not None:
            raise ErrorGeneracion(ctx, "El operador 'no'")
        return self.visit(ctx.comparacion())

    def visitComparacion(self, ctx):
        if ctx.comparacionOpt().operadorComparacion() is not None:
            raise ErrorGeneracion(ctx.comparacionOpt(), "El operador de comparación")
        return self.visit(ctx.suma())

    def cadena(self, primero, resto):
        resultado = self.visit(primero)
        # La gramática contiene operador, operando y siguiente resto, o epsilon.
        while resto.getChildCount() != 0:
            operador = resto.getChild(0).getText()
            derecho = self.visit(resto.getChild(1))
            resultado = self.emitir_operacion(operador, resultado, derecho)
            resto = resto.getChild(2)
        return resultado

    def visitSuma(self, ctx):
        return self.cadena(ctx.producto(), ctx.restoSuma())

    def visitProducto(self, ctx):
        return self.cadena(ctx.unaria(), ctx.restoProducto())

    def visitUnaria(self, ctx):
        if ctx.RESTA() is not None:
            operando = self.visit(ctx.unaria())
            return self.emitir_operacion("-", "0", operando)
        return self.visit(ctx.primaria())

    def visitPrimaria(self, ctx):
        if ctx.NUMERO() is not None:
            return ctx.NUMERO().getText()
        if ctx.TEXTO() is not None:
            return ctx.TEXTO().getText()
        if ctx.ID() is not None:
            return ctx.ID().getText()
        if ctx.expresion() is not None:
            return self.visit(ctx.expresion())
        raise ErrorGeneracion(ctx, f"El uso de '{ctx.start.text}' en una expresión")
