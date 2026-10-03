"""Análisis semántico parcial de declaraciones, inicialización y tipos."""

from generated.EducativoParserVisitor import EducativoParserVisitor
from tabla_simbolos import TablaSimbolos

ERROR = "error"


class AnalizadorSemantico(EducativoParserVisitor):
    """Cada instancia recorre un programa en orden de fuente.

    Las funciones y bloques crean ámbitos. Los parámetros comparten ámbito
    con su cuerpo. None representa un tipo aún desconocido; ERROR evita
    propagar diagnósticos derivados de un error anterior.
    """

    def __init__(self):
        self.tabla = TablaSimbolos()
        self.errores = []
        self.funciones = {}

    def error(self, token, mensaje):
        self.errores.append(
            f"Error semántico en {token.line}:{token.column + 1}: {mensaje}"
        )
        return ERROR

    def declarar(self, nodo, tipo=None, inicializada=False):
        token = nodo.getSymbol()
        anterior = self.tabla.declarar(token, tipo, inicializada)
        if anterior is not None:
            self.error(token, f"la variable '{token.text}' ya está declarada en este ámbito "
                       f"(primera declaración en {anterior.linea}:{anterior.columna}). "
                       "Usa 'asignar' para cambiar su valor.")

    def buscar(self, nodo):
        token = nodo.getSymbol()
        simbolo = self.tabla.buscar(token.text)
        if simbolo is None:
            self.error(token, f"la variable '{token.text}' no está declarada. "
                       f"Declárala antes con 'crear variable {token.text}'.")
        return simbolo

    def leer(self, nodo):
        simbolo = self.buscar(nodo)
        if simbolo is None:
            return ERROR
        if not simbolo.inicializada:
            return self.error(nodo.getSymbol(),
                              f"la variable '{simbolo.nombre}' se usa sin inicializar "
                              f"(declarada en {simbolo.linea}:{simbolo.columna}). "
                              "Asígnale un valor antes de leerla.")
        return simbolo.tipo

    def visitDeclaracion(self, ctx):
        self.declarar(ctx.ID())

    def visitAsignacion(self, ctx):
        simbolo = self.buscar(ctx.ID())
        tipo = self.visit(ctx.expresion())
        if simbolo is None or tipo == ERROR:
            return
        if simbolo.tipo is not None and tipo is not None and simbolo.tipo != tipo:
            self.error(ctx.ID().getSymbol(),
                       f"no se puede asignar un valor de tipo {tipo} a '{simbolo.nombre}', "
                       f"que tiene tipo {simbolo.tipo}. Asigna un valor de tipo {simbolo.tipo}.")
            return
        if simbolo.tipo is None:
            simbolo.tipo = tipo
        simbolo.inicializada = True

    def visitEntrada(self, ctx):
        simbolo = self.buscar(ctx.ID())
        if simbolo is not None:
            # La entrada conserva un tipo ya conocido; sin tipo previo es texto.
            simbolo.tipo = simbolo.tipo or "texto"
            simbolo.inicializada = True

    def visitExpresion(self, ctx):
        return self.visit(ctx.disyuncion())

    def operacion(self, token, tipos, esperado):
        if ERROR in tipos:
            return ERROR
        if any(tipo is not None and tipo != esperado for tipo in tipos):
            descripcion = " y ".join(tipo or "desconocido" for tipo in tipos)
            return self.error(token, f"el operador '{token.text}' requiere operandos de tipo "
                              f"{esperado}, pero recibió {descripcion}. "
                              f"Usa valores de tipo {esperado}.")
        return None if None in tipos else esperado

    def cadena(self, ctx, operandos, esperado):
        tipos = [self.visit(operando) for operando in operandos]
        resultado = tipos[0]
        for i, tipo in enumerate(tipos[1:]):
            operador = ctx.getChild(2 * i + 1).getSymbol()
            resultado = self.operacion(operador, [resultado, tipo], esperado)
        return resultado

    def visitDisyuncion(self, ctx):
        return self.cadena(ctx, ctx.conjuncion(), "logico")

    def visitConjuncion(self, ctx):
        return self.cadena(ctx, ctx.negacion(), "logico")

    def visitNegacion(self, ctx):
        if ctx.NO() is not None:
            return self.operacion(ctx.NO().getSymbol(), [self.visit(ctx.negacion())], "logico")
        return self.visit(ctx.comparacion())

    def visitComparacion(self, ctx):
        tipos = [self.visit(suma) for suma in ctx.suma()]
        if ERROR in tipos:
            return ERROR
        # Compatibilidad de comparaciones se ampliará en la siguiente etapa.
        return "logico" if ctx.operadorComparacion() is not None else tipos[0]

    def visitSuma(self, ctx):
        return self.cadena(ctx, ctx.producto(), "numero")

    def visitProducto(self, ctx):
        return self.cadena(ctx, ctx.unaria(), "numero")

    def visitUnaria(self, ctx):
        if ctx.RESTA() is not None:
            return self.operacion(ctx.RESTA().getSymbol(), [self.visit(ctx.unaria())], "numero")
        return self.visit(ctx.primaria())

    def visitPrimaria(self, ctx):
        if ctx.ID() is not None:
            return self.leer(ctx.ID())
        if ctx.NUMERO() is not None:
            return "numero"
        if ctx.TEXTO() is not None:
            return "texto"
        if ctx.VERDADERO() is not None or ctx.FALSO() is not None:
            return "logico"
        if ctx.llamada() is not None:
            return self.visit(ctx.llamada())
        if ctx.expresion() is not None:
            return self.visit(ctx.expresion())
        return self.visit(ctx.aleatorio())

    def visitAleatorio(self, ctx):
        tipos = [self.visit(limite) for limite in ctx.limite()]
        if ERROR in tipos:
            return ERROR
        # Enteros y orden del rango quedan pendientes; sí se detectan lecturas sin valor.
        return "numero"

    def visitLimite(self, ctx):
        return self.leer(ctx.ID()) if ctx.ID() is not None else "numero"

    def visitBloque(self, ctx):
        funciones_exteriores = self.funciones.copy()
        self.tabla.abrir_ambito()
        try:
            return self.visitChildren(ctx)
        finally:
            self.tabla.cerrar_ambito()
            self.funciones = funciones_exteriores

    def combinar(self, antes, caminos, token):
        for i, (simbolo, tipo_previo, _) in enumerate(antes):
            tipos = {camino[i][1] for camino in caminos if camino[i][1] is not None}
            if len(tipos) > 1:
                self.error(token, f"las ramas asignan tipos incompatibles a '{simbolo.nombre}': "
                           f"{' y '.join(sorted(tipos))}. Usa el mismo tipo en todas las ramas.")
            simbolo.tipo = tipo_previo or next((camino[i][1] for camino in caminos
                                               if camino[i][1] is not None), None)
            simbolo.inicializada = all(camino[i][2] for camino in caminos)

    def visitCondicional(self, ctx):
        self.visit(ctx.expresion())
        antes = self.tabla.estado()
        caminos = []
        for bloque in ctx.bloque():
            self.tabla.restaurar(antes)
            self.visit(bloque)
            caminos.append(self.tabla.estado())
        if ctx.SINO() is None:
            caminos.append(antes)
        self.combinar(antes, caminos, ctx.start)

    def ciclo(self, ctx):
        self.visit(ctx.expresion())
        antes = self.tabla.estado()
        self.visit(ctx.bloque())
        # Un ciclo podría no ejecutarse: sus asignaciones no garantizan un valor.
        self.combinar(antes, [antes, self.tabla.estado()], ctx.start)

    def visitMientras(self, ctx):
        self.ciclo(ctx)

    def visitRepeticion(self, ctx):
        self.ciclo(ctx)

    def visitFuncion(self, ctx):
        self.funciones[ctx.ID().getText()] = ctx.tipo().getText().lower()
        funciones_exteriores = self.funciones.copy()
        antes = self.tabla.estado()
        self.tabla.abrir_ambito()
        try:
            if ctx.parametros() is not None:
                for parametro in ctx.parametros().parametro():
                    self.declarar(parametro.ID(), parametro.tipo().getText().lower(), True)
            return self.visitChildren(ctx.bloque())
        finally:
            self.tabla.cerrar_ambito()
            self.funciones = funciones_exteriores
            # Definir una función no ejecuta sus asignaciones a variables exteriores.
            self.tabla.restaurar(antes)

    def visitLlamada(self, ctx):
        tipos = []
        if ctx.argumentos() is not None:
            tipos = [self.visit(expresion) for expresion in ctx.argumentos().expresion()]
        if ERROR in tipos:
            return ERROR
        # Firmas y funciones inexistentes quedan para la siguiente etapa.
        return self.funciones.get(ctx.ID().getText())
