"""Revisa variables, inicialización y tipos."""

from generated.EducativoParserVisitor import EducativoParserVisitor
from tabla_simbolos import TablaSimbolos

ERROR = "error"


class AnalizadorSemantico(EducativoParserVisitor):
    """Recorre el árbol y revisa la semántica.

    None indica tipo desconocido; ERROR indica un error previo.
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

    def visitPrograma(self, ctx):
        self.visit(ctx.instrucciones())

    def visitInstrucciones(self, ctx):
        # Recorre la lista sin acumular llamadas recursivas en el visitor.
        while ctx is not None and ctx.sentencia() is not None:
            self.visit(ctx.sentencia())
            ctx = ctx.restoPrograma().instrucciones()

    def visitInstruccionesBloque(self, ctx):
        while ctx.sentencia() is not None:
            self.visit(ctx.sentencia())
            ctx = ctx.instruccionesBloque()

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
            # Sin tipo previo, la entrada es texto.
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

    def cadena(self, primero, resto, esperado):
        resultado = self.visit(primero)
        # Cada resto contiene: operador, operando y otro resto; o epsilon.
        while resto.getChildCount() != 0:
            operador = resto.getChild(0).getSymbol()
            tipo = self.visit(resto.getChild(1))
            resultado = self.operacion(operador, [resultado, tipo], esperado)
            resto = resto.getChild(2)
        return resultado

    def visitDisyuncion(self, ctx):
        return self.cadena(ctx.conjuncion(), ctx.restoO(), "logico")

    def visitConjuncion(self, ctx):
        return self.cadena(ctx.negacion(), ctx.restoY(), "logico")

    def visitNegacion(self, ctx):
        if ctx.NO() is not None:
            return self.operacion(ctx.NO().getSymbol(), [self.visit(ctx.negacion())], "logico")
        return self.visit(ctx.comparacion())

    def visitComparacion(self, ctx):
        tipos = [self.visit(ctx.suma())]
        alternativa = ctx.comparacionOpt()
        if alternativa.suma() is not None:
            tipos.append(self.visit(alternativa.suma()))
        if ERROR in tipos:
            return ERROR
        # Falta revisar los tipos de las comparaciones.
        return "logico" if alternativa.operadorComparacion() is not None else tipos[0]

    def visitSuma(self, ctx):
        return self.cadena(ctx.producto(), ctx.restoSuma(), "numero")

    def visitProducto(self, ctx):
        return self.cadena(ctx.unaria(), ctx.restoProducto(), "numero")

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
        # Falta validar enteros y el orden del rango.
        return "numero"

    def visitLimite(self, ctx):
        return self.leer(ctx.ID()) if ctx.ID() is not None else "numero"

    def visitBloque(self, ctx):
        funciones_exteriores = self.funciones.copy()
        self.tabla.abrir_ambito()
        try:
            return self.visit(ctx.instruccionesBloque())
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
        bloques = [ctx.bloque()]
        alternativa = ctx.alternativa().bloque()
        if alternativa is not None:
            bloques.append(alternativa)
        for bloque in bloques:
            self.tabla.restaurar(antes)
            self.visit(bloque)
            caminos.append(self.tabla.estado())
        if alternativa is None:
            caminos.append(antes)
        self.combinar(antes, caminos, ctx.start)

    def ciclo(self, ctx):
        self.visit(ctx.expresion())
        antes = self.tabla.estado()
        self.visit(ctx.bloque())
        # El ciclo puede ejecutarse cero veces.
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
            parametros = ctx.parametrosOpt().parametros()
            if parametros is not None:
                parametro = parametros.parametro()
                resto = parametros.restoParametros()
                while parametro is not None:
                    self.declarar(parametro.ID(), parametro.tipo().getText().lower(), True)
                    parametro = resto.parametro()
                    resto = resto.restoParametros()
            # Parámetros y cuerpo comparten el mismo ámbito.
            return self.visit(ctx.bloque().instruccionesBloque())
        finally:
            self.tabla.cerrar_ambito()
            self.funciones = funciones_exteriores
            # Definir la función no ejecuta su cuerpo.
            self.tabla.restaurar(antes)

    def visitLlamada(self, ctx):
        tipos = []
        argumentos = ctx.argumentosOpt().argumentos()
        if argumentos is not None:
            expresion = argumentos.expresion()
            resto = argumentos.restoArgumentos()
            while expresion is not None:
                tipos.append(self.visit(expresion))
                expresion = resto.expresion()
                resto = resto.restoArgumentos()
        if ERROR in tipos:
            return ERROR
        # Falta validar funciones y argumentos.
        return self.funciones.get(ctx.ID().getText())
