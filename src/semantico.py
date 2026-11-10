"""Revisa variables, inicialización y tipos."""

from dataclasses import dataclass
from fractions import Fraction

from generated.EducativoParserVisitor import EducativoParserVisitor
from tabla_simbolos import TablaSimbolos

ERROR = "error"


@dataclass(eq=False)
class Funcion:
    parametros: list
    retorno: str
    cuerpo: object
    variables_visibles: list
    funciones_visibles: list


@dataclass
class MarcoFuncion:
    funcion: Funcion
    exteriores: list
    salidas: list
    comprobar_definicion: bool


class AnalizadorSemantico(EducativoParserVisitor):
    """Recorre el árbol y revisa la semántica.

    None indica tipo desconocido; ERROR indica un error previo.
    """

    def __init__(self):
        self.tabla = TablaSimbolos()
        self.errores = []
        self.funciones = [{}]
        self.marcos = []
        self.diagnosticos = set()

    def error(self, token, mensaje):
        diagnostico = f"Error semántico en {token.line}:{token.column + 1}: {mensaje}"
        if diagnostico not in self.diagnosticos:
            self.diagnosticos.add(diagnostico)
            self.errores.append(diagnostico)
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
            sentencia = ctx.sentencia()
            self.visit(sentencia)
            if (self.marcos and not self.marcos[-1].comprobar_definicion
                    and self.sentencia_termina(sentencia)):
                break
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
        simbolo.valor_numerico = self.numero_constante(ctx.expresion()) if tipo == "numero" else None

    def visitEntrada(self, ctx):
        simbolo = self.buscar(ctx.ID())
        if simbolo is not None:
            # Sin tipo previo, la entrada es texto.
            simbolo.tipo = simbolo.tipo or "texto"
            simbolo.inicializada = True
            simbolo.valor_numerico = None

    def numero_constante(self, ctx):
        """Calcula solo números conocidos; no ejecuta llamadas ni aleatorios."""
        regla = ctx.parser.ruleNames[ctx.getRuleIndex()]
        if regla in ("primaria", "limite"):
            if ctx.NUMERO() is not None:
                valor = Fraction(ctx.NUMERO().getText())
                return -valor if regla == "limite" and ctx.RESTA() is not None else valor
            if ctx.ID() is not None:
                simbolo = self.tabla.buscar(ctx.ID().getText())
                return simbolo.valor_numerico if simbolo is not None else None
            if regla == "primaria" and ctx.expresion() is not None:
                return self.numero_constante(ctx.expresion())
            return None
        if regla == "unaria" and ctx.RESTA() is not None:
            valor = self.numero_constante(ctx.unaria())
            return -valor if valor is not None else None
        if regla in ("suma", "producto"):
            valor = self.numero_constante(ctx.getChild(0))
            resto = ctx.getChild(1)
            while resto.getChildCount() != 0:
                derecho = self.numero_constante(resto.getChild(1))
                if valor is None or derecho is None:
                    return None
                operador = resto.getChild(0).getText()
                if operador == "+":
                    valor += derecho
                elif operador == "-":
                    valor -= derecho
                elif operador == "*":
                    valor *= derecho
                elif derecho != 0:
                    valor /= derecho
                else:
                    return None
                resto = resto.getChild(2)
            return valor
        if ctx.getChildCount() == 1:
            return self.numero_constante(ctx.getChild(0))
        if regla in ("disyuncion", "conjuncion", "comparacion"):
            if ctx.getChild(1).getChildCount() == 0:
                return self.numero_constante(ctx.getChild(0))
        return None

    def exigir_tipo(self, ctx, tipo, esperado, descripcion):
        if tipo not in (None, ERROR, esperado):
            return self.error(ctx.start, f"{descripcion} debe ser de tipo {esperado}, "
                              f"pero recibió {tipo}.")
        return tipo

    def olvidar_constantes(self):
        for ambito in self.tabla.ambitos:
            for simbolo in ambito.values():
                simbolo.valor_numerico = None

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
        operador = alternativa.operadorComparacion()
        if operador is None:
            return tipos[0]
        if None in tipos:
            return "logico"
        if operador.MAYOR() is None and operador.MENOR() is None:
            if tipos[0] != tipos[1]:
                return self.error(operador.start, f"no se pueden comparar valores de tipo {tipos[0]} y {tipos[1]}.")
        elif tipos != ["numero", "numero"]:
            return self.error(operador.start, "las comparaciones de orden requieren operandos de tipo numero.")
        return "logico"

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
        limites = ctx.limite()
        tipos = [self.visit(limite) for limite in limites]
        valores = [self.numero_constante(limite) for limite in limites]
        invalido = ERROR in tipos
        for limite, tipo, valor in zip(limites, tipos, valores):
            if self.exigir_tipo(limite, tipo, "numero", "el límite del aleatorio") == ERROR:
                invalido = True
            elif valor is not None and valor.denominator != 1:
                self.error(limite.start, "el límite del aleatorio debe ser entero.")
                invalido = True
        if not invalido and all(valor is not None for valor in valores) and valores[0] > valores[1]:
            self.error(ctx.start, "el límite mínimo del aleatorio no puede ser mayor que el máximo.")
            invalido = True
        if invalido:
            return ERROR
        return "numero"

    def visitLimite(self, ctx):
        return self.leer(ctx.ID()) if ctx.ID() is not None else "numero"

    def visitBloque(self, ctx):
        self.funciones.append({})
        self.tabla.abrir_ambito()
        try:
            return self.visit(ctx.instruccionesBloque())
        finally:
            self.tabla.cerrar_ambito()
            self.funciones.pop()

    def combinar(self, antes, caminos, token):
        for i, (simbolo, tipo_previo, _, _) in enumerate(antes):
            tipos = {camino[i][1] for camino in caminos if camino[i][1] is not None}
            if len(tipos) > 1:
                self.error(token, f"las ramas asignan tipos incompatibles a '{simbolo.nombre}': "
                           f"{' y '.join(sorted(tipos))}. Usa el mismo tipo en todas las ramas.")
            simbolo.tipo = tipo_previo or next((camino[i][1] for camino in caminos
                                               if camino[i][1] is not None), None)
            simbolo.inicializada = all(camino[i][2] for camino in caminos)
            valores = {camino[i][3] for camino in caminos}
            simbolo.valor_numerico = valores.pop() if len(valores) == 1 else None

    def visitCondicional(self, ctx):
        condicion = ctx.expresion()
        self.exigir_tipo(condicion, self.visit(condicion), "logico", "la condición de 'si'")
        antes = self.tabla.estado()
        caminos = []
        bloques = [ctx.bloque()]
        alternativa = ctx.alternativa().bloque()
        if alternativa is not None:
            bloques.append(alternativa)
        for bloque in bloques:
            self.tabla.restaurar(antes)
            self.visit(bloque)
            # Una rama que siempre retorna no llega a la siguiente instrucción.
            if not self.retorno_garantizado(bloque.instruccionesBloque()):
                caminos.append(self.tabla.estado())
        if alternativa is None:
            caminos.append(antes)
        if caminos:
            self.combinar(antes, caminos, ctx.start)
        else:
            self.tabla.restaurar(antes)

    def ciclo(self, ctx):
        antes = self.tabla.estado()
        # Un ciclo puede cambiar los valores en iteraciones posteriores.
        self.olvidar_constantes()
        self.visit(ctx.bloque())
        # El ciclo puede ejecutarse cero veces.
        if self.retorno_garantizado(ctx.bloque().instruccionesBloque()):
            self.tabla.restaurar(antes)
        else:
            self.combinar(antes, [antes, self.tabla.estado()], ctx.start)

    def visitMientras(self, ctx):
        self.olvidar_constantes()
        condicion = ctx.expresion()
        self.exigir_tipo(condicion, self.visit(condicion), "logico", "la condición de 'mientras'")
        self.ciclo(ctx)

    def visitRepeticion(self, ctx):
        cantidad = ctx.expresion()
        tipo = self.exigir_tipo(cantidad, self.visit(cantidad), "numero", "la cantidad de repeticiones")
        if tipo == "numero":
            valor = self.numero_constante(cantidad)
            if valor is not None and (valor.denominator != 1 or valor < 0):
                self.error(cantidad.start, "la cantidad de repeticiones debe ser un entero no negativo.")
        self.ciclo(ctx)

    def visitFuncion(self, ctx):
        nombre = ctx.ID().getText()
        parametros = ctx.parametrosOpt().parametros()
        declarados = []
        if parametros is not None:
            declarados.append(parametros.parametro())
            resto = parametros.restoParametros()
            while resto.parametro() is not None:
                declarados.append(resto.parametro())
                resto = resto.restoParametros()
        tipo_retorno = ctx.tipo().getText().lower()
        cuerpo = ctx.bloque().instruccionesBloque()
        funcion = Funcion(declarados, tipo_retorno, cuerpo,
                          [ambito.copy() for ambito in self.tabla.ambitos], [])
        if nombre in self.funciones[-1]:
            self.error(ctx.ID().getSymbol(), f"la función '{nombre}' ya está declarada en este ámbito.")
        else:
            self.funciones[-1][nombre] = funcion
        funcion.funciones_visibles = [ambito.copy() for ambito in self.funciones]
        if not self.retorno_garantizado(cuerpo):
            self.error(ctx.ID().getSymbol(), f"la función '{nombre}' debe devolver un valor en todos los caminos.")
        self.analizar_funcion(funcion, ctx.start, comprobar_definicion=True)

    def analizar_funcion(self, funcion, token, comprobar_definicion=False):
        variables_llamador = self.tabla.ambitos
        funciones_llamador = self.funciones
        # Las copias conservan los símbolos originales y congelan su visibilidad léxica.
        self.tabla.ambitos = [*funcion.variables_visibles, {}]
        self.funciones = [*funcion.funciones_visibles, {}]
        antes = self.tabla.estado()
        marco = MarcoFuncion(funcion, [entrada[0] for entrada in antes], [], comprobar_definicion)
        self.marcos.append(marco)
        try:
            if comprobar_definicion:
                # La inicialización exterior se exige en la llamada, cuando se conoce su estado.
                for simbolo in marco.exteriores:
                    simbolo.inicializada = True
                    simbolo.valor_numerico = None
            for parametro in funcion.parametros:
                self.declarar(parametro.ID(), parametro.tipo().getText().lower(), True)
            self.visit(funcion.cuerpo)
        finally:
            self.marcos.pop()
            self.tabla.ambitos = variables_llamador
            self.funciones = funciones_llamador
            self.tabla.restaurar(antes)
        if marco.salidas and not comprobar_definicion:
            if not self.retorno_garantizado(funcion.cuerpo):
                marco.salidas.append(antes)
            self.combinar(antes, marco.salidas, token)

    def sentencia_termina(self, sentencia):
        if sentencia.retorno() is not None:
            return True
        condicional = sentencia.condicional()
        if condicional is not None and condicional.alternativa().bloque() is not None:
            return (self.retorno_garantizado(condicional.bloque().instruccionesBloque()) and
                    self.retorno_garantizado(condicional.alternativa().bloque().instruccionesBloque()))
        return False

    def retorno_garantizado(self, instrucciones):
        while instrucciones.sentencia() is not None:
            if self.sentencia_termina(instrucciones.sentencia()):
                return True
            instrucciones = instrucciones.instruccionesBloque()
        return False

    def visitRetorno(self, ctx):
        tipo = self.visit(ctx.expresion())
        if not self.marcos:
            return self.error(ctx.start, "'devolver' solo puede usarse dentro de una función.")
        marco = self.marcos[-1]
        self.exigir_tipo(ctx.expresion(), tipo, marco.funcion.retorno, "el valor devuelto")
        if not marco.comprobar_definicion:
            marco.salidas.append([(s, s.tipo, s.inicializada, s.valor_numerico)
                                   for s in marco.exteriores])

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
        nombre = ctx.ID().getText()
        firma = next((ambito[nombre] for ambito in reversed(self.funciones) if nombre in ambito), None)
        if firma is None:
            return self.error(ctx.ID().getSymbol(), f"la función '{nombre}' no está declarada.")
        esperados = [p.tipo().getText().lower() for p in firma.parametros]
        if len(tipos) != len(esperados):
            return self.error(ctx.ID().getSymbol(), f"la función '{nombre}' espera {len(esperados)} argumentos, pero recibió {len(tipos)}.")
        for posicion, (tipo, esperado) in enumerate(zip(tipos, esperados), 1):
            if tipo is not None and tipo != esperado:
                self.error(ctx.ID().getSymbol(), f"el argumento {posicion} de '{nombre}' debe ser de tipo {esperado}, pero recibió {tipo}.")
                return ERROR
        if any(marco.funcion is firma for marco in self.marcos):
            # Un ciclo de llamadas no prueba inicialización nueva ni conserva constantes.
            for ambito in firma.variables_visibles:
                for simbolo in ambito.values():
                    simbolo.valor_numerico = None
        else:
            self.analizar_funcion(firma, ctx.start)
        return firma.retorno
