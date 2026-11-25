"""Traduce el árbol validado a código intermedio mediante un builder propio."""

from generated.EducativoParserVisitor import EducativoParserVisitor

from .builder import Builder
from .diagnostico import Diagnostico


class ErrorGeneracion(Exception):
    def __init__(self, ctx, construccion):
        self.diagnostico = Diagnostico.desde_token("intermedio", construccion, ctx.start)
        super().__init__(self.diagnostico.en_terminal("Error de generación"))


class GeneradorCodigo(EducativoParserVisitor):
    def __init__(self, tipos_entrada=None):
        self.builder = Builder()
        self.variables = [{}]
        self.funciones = [{}]
        self.contador_variables = 0
        self.contador_funciones = 0
        self.tipos_entrada = tipos_entrada if tipos_entrada is not None else {}

    @staticmethod
    def origen(ctx):
        return {"linea": ctx.start.line, "columna": ctx.start.column + 1}

    def resolver(self, nombre, ambitos, ctx):
        for ambito in reversed(ambitos):
            if nombre in ambito:
                return ambito[nombre]
        raise ErrorGeneracion(ctx, f"el nombre '{nombre}' no tiene una declaración visible.")

    def declarar_variable(self, nombre):
        self.contador_variables += 1
        identificador = f"%v{self.contador_variables}_{nombre}"
        self.variables[-1][nombre] = identificador
        return identificador

    def visitPrograma(self, ctx):
        self.visit(ctx.instrucciones())
        return self.builder.instrucciones

    def visitInstrucciones(self, ctx):
        while ctx is not None and ctx.sentencia() is not None:
            self.visit(ctx.sentencia())
            ctx = ctx.restoPrograma().instrucciones()

    def visitInstruccionesBloque(self, ctx):
        while ctx.sentencia() is not None:
            self.visit(ctx.sentencia())
            ctx = ctx.instruccionesBloque()

    def visitSentencia(self, ctx):
        return self.visit(ctx.getChild(0))

    def visitDeclaracion(self, ctx):
        nombre = ctx.ID().getText()
        identificador = self.declarar_variable(nombre)
        self.builder.declarar(identificador, nombre=nombre, **self.origen(ctx))

    def visitAsignacion(self, ctx):
        resultado = self.visit(ctx.expresion())
        destino = self.resolver(ctx.ID().getText(), self.variables, ctx)
        self.builder.asignar(destino, resultado, **self.origen(ctx))

    def visitSalida(self, ctx):
        self.builder.mostrar(self.visit(ctx.expresion()), **self.origen(ctx))

    def visitEntrada(self, ctx):
        destino = self.resolver(ctx.ID().getText(), self.variables, ctx)
        self.builder.preguntar(ctx.TEXTO().getText(), destino,
                               tipo=self.tipos_entrada.get(ctx, "automatico"),
                               **self.origen(ctx))

    def visitBloque(self, ctx):
        self.builder.abrir_ambito(**self.origen(ctx))
        self.variables.append({})
        self.funciones.append({})
        try:
            self.visit(ctx.instruccionesBloque())
        finally:
            self.funciones.pop()
            self.variables.pop()
        self.builder.cerrar_ambito(**self.origen(ctx))

    def visitCondicional(self, ctx):
        origen = self.origen(ctx)
        alternativa = self.builder.nueva_etiqueta()
        fin = self.builder.nueva_etiqueta()
        condicion = self.visit(ctx.expresion())
        self.builder.saltar_si_falso(condicion, alternativa, **origen)
        self.visit(ctx.bloque())
        self.builder.saltar(fin, **origen)
        self.builder.etiqueta(alternativa, **origen)
        if ctx.alternativa().bloque() is not None:
            self.visit(ctx.alternativa().bloque())
        self.builder.etiqueta(fin, **origen)

    def visitMientras(self, ctx):
        origen = self.origen(ctx)
        inicio = self.builder.nueva_etiqueta()
        fin = self.builder.nueva_etiqueta()
        self.builder.etiqueta(inicio, **origen)
        condicion = self.visit(ctx.expresion())
        self.builder.saltar_si_falso(condicion, fin, **origen)
        self.visit(ctx.bloque())
        self.builder.saltar(inicio, **origen)
        self.builder.etiqueta(fin, **origen)

    def visitRepeticion(self, ctx):
        origen = self.origen(ctx)
        # La cantidad se evalúa una vez, incluso si contiene una llamada.
        cantidad = self.visit(ctx.expresion())
        self.builder.comprobar_repeticiones(cantidad, **origen)
        contador = self.builder.temporal()
        self.builder.asignar(contador, "0", **origen)
        inicio = self.builder.nueva_etiqueta()
        fin = self.builder.nueva_etiqueta()
        self.builder.etiqueta(inicio, **origen)
        condicion = self.builder.operacion("<", contador, cantidad, **origen)
        self.builder.saltar_si_falso(condicion, fin, **origen)
        self.visit(ctx.bloque())
        siguiente = self.builder.operacion("+", contador, "1", **origen)
        self.builder.asignar(contador, siguiente, **origen)
        self.builder.saltar(inicio, **origen)
        self.builder.etiqueta(fin, **origen)

    def visitFuncion(self, ctx):
        origen = self.origen(ctx)
        nombre = ctx.ID().getText()
        self.contador_funciones += 1
        identificador = f"%f{self.contador_funciones}_{nombre}"
        # Registrar antes del cuerpo permite llamadas recursivas.
        self.funciones[-1][nombre] = identificador
        entrada = self.builder.nueva_etiqueta()
        fin = self.builder.nueva_etiqueta()
        self.builder.funcion(identificador, entrada, ctx.tipo().getText().lower(),
                             nombre=nombre, **origen)
        self.builder.saltar(fin, **origen)
        self.builder.etiqueta(entrada, **origen)
        self.variables.append({})
        self.funciones.append({})
        try:
            parametros = ctx.parametrosOpt().parametros()
            posicion = 0
            while parametros is not None and parametros.parametro() is not None:
                parametro = parametros.parametro()
                nombre_parametro = parametro.ID().getText()
                destino = self.declarar_variable(nombre_parametro)
                self.builder.parametro(
                    posicion, destino, tipo=parametro.tipo().getText().lower(),
                    nombre=nombre_parametro, **self.origen(parametro),
                )
                posicion += 1
                parametros = parametros.restoParametros()
            # Parámetros y cuerpo comparten ámbito, igual que en el semántico.
            self.visit(ctx.bloque().instruccionesBloque())
        finally:
            self.funciones.pop()
            self.variables.pop()
        self.builder.fin_funcion(identificador, **origen)
        self.builder.etiqueta(fin, **origen)

    def visitLlamada(self, ctx):
        argumentos = []
        nodo = ctx.argumentosOpt().argumentos()
        while nodo is not None and nodo.expresion() is not None:
            argumentos.append(self.visit(nodo.expresion()))
            nodo = nodo.restoArgumentos()
        funcion = self.resolver(ctx.ID().getText(), self.funciones, ctx)
        return self.builder.llamar(funcion, argumentos, **self.origen(ctx))

    def visitRetorno(self, ctx):
        self.builder.devolver(self.visit(ctx.expresion()), **self.origen(ctx))

    def visitMotivacion(self, ctx):
        self.builder.motivacion(ctx.start.text.lower(), **self.origen(ctx))

    def visitExpresion(self, ctx):
        return self.visit(ctx.disyuncion())

    def visitDisyuncion(self, ctx):
        return self.cadena(ctx.conjuncion(), ctx.restoO())

    def visitConjuncion(self, ctx):
        return self.cadena(ctx.negacion(), ctx.restoY())

    def visitNegacion(self, ctx):
        if ctx.NO() is not None:
            return self.builder.negar(self.visit(ctx.negacion()), **self.origen(ctx))
        return self.visit(ctx.comparacion())

    def visitComparacion(self, ctx):
        izquierdo = self.visit(ctx.suma())
        alternativa = ctx.comparacionOpt()
        operador = alternativa.operadorComparacion()
        if operador is None:
            return izquierdo
        derecho = self.visit(alternativa.suma())
        if operador.MAYOR() is not None:
            simbolo = ">=" if operador.IGUAL() is not None else ">"
        elif operador.MENOR() is not None:
            simbolo = "<=" if operador.IGUAL() is not None else "<"
        else:
            simbolo = "!=" if operador.DIFERENTE() is not None else "=="
        return self.builder.operacion(simbolo, izquierdo, derecho, **self.origen(operador))

    def cadena(self, primero, resto):
        resultado = self.visit(primero)
        while resto.getChildCount() != 0:
            token = resto.getChild(0).getSymbol()
            derecho = self.visit(resto.getChild(1))
            resultado = self.builder.operacion(
                token.text.lower(), resultado, derecho,
                linea=token.line, columna=token.column + 1,
            )
            resto = resto.getChild(2)
        return resultado

    def visitSuma(self, ctx):
        return self.cadena(ctx.producto(), ctx.restoSuma())

    def visitProducto(self, ctx):
        return self.cadena(ctx.unaria(), ctx.restoProducto())

    def visitUnaria(self, ctx):
        if ctx.RESTA() is not None:
            return self.builder.operacion("-", "0", self.visit(ctx.unaria()),
                                          **self.origen(ctx))
        return self.visit(ctx.primaria())

    def visitPrimaria(self, ctx):
        if ctx.NUMERO() is not None:
            return ctx.NUMERO().getText()
        if ctx.TEXTO() is not None:
            return ctx.TEXTO().getText()
        if ctx.VERDADERO() is not None:
            return "verdadero"
        if ctx.FALSO() is not None:
            return "falso"
        if ctx.ID() is not None:
            identificador = self.resolver(ctx.ID().getText(), self.variables, ctx)
            # Capturar antes de evaluar el siguiente operando evita que una
            # llamada con efectos exteriores cambie un valor ya leído.
            return self.builder.leer(identificador, **self.origen(ctx))
        if ctx.llamada() is not None:
            return self.visit(ctx.llamada())
        if ctx.expresion() is not None:
            return self.visit(ctx.expresion())
        return self.visit(ctx.aleatorio())

    def visitAleatorio(self, ctx):
        minimo, maximo = [self.visit(limite) for limite in ctx.limite()]
        return self.builder.aleatorio(minimo, maximo, **self.origen(ctx))

    def visitLimite(self, ctx):
        if ctx.ID() is not None:
            identificador = self.resolver(ctx.ID().getText(), self.variables, ctx)
            return self.builder.leer(identificador, **self.origen(ctx))
        numero = ctx.NUMERO().getText()
        return f"-{numero}" if ctx.RESTA() is not None else numero
