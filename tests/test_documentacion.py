"""Comprueba las producciones y los ejemplos publicados, sin duplicarlos."""

import re
import sys
import unittest
from pathlib import Path

from antlr4 import CommonTokenStream, InputStream, Token

PROYECTO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PROYECTO / "src"))

from generated.EducativoLexer import EducativoLexer
from generated.EducativoParser import EducativoParser
from main import ErroresLexicos, ErroresSintacticos


def bloques(texto):
    # El salto que cierra la cerca no pertenece al código del ejemplo.
    # Así se conservan los saltos iniciales/finales escritos explícitamente.
    return re.findall(r"```text\n(.*?)\n```", texto, re.S)


def producciones(texto):
    reglas = {}
    for linea in bloques(texto)[0].splitlines():
        nombre, alternativas = linea.split(" → ")
        if nombre in reglas:
            raise ValueError(f"Producción duplicada: {nombre}")
        reglas[nombre] = [([] if opcion == "ε" else opcion.split())
                          for opcion in alternativas.split(" | ")]
    return reglas


def validar_derivacion(pasos, inicial, reglas):
    if len(pasos) < 2 or pasos[0] != [inicial]:
        raise ValueError("Símbolo inicial incorrecto o derivación vacía")
    for numero, (antes, despues) in enumerate(zip(pasos, pasos[1:]), 1):
        indice = next((i for i, simbolo in enumerate(antes) if simbolo in reglas), None)
        if indice is None:
            raise ValueError(f"Paso {numero}: se intenta expandir una cadena terminal")
        opciones = [antes[:indice] + opcion + antes[indice + 1:]
                    for opcion in reglas[antes[indice]]]
        if despues not in opciones:
            raise ValueError(f"Paso {numero}: sustitución izquierda inválida de {antes[indice]}")
    if any(simbolo in reglas for simbolo in pasos[-1]):
        raise ValueError("La derivación conserva no terminales")


def analizar(codigo):
    lexer = EducativoLexer(InputStream(codigo))
    lexicos = ErroresLexicos()
    lexer.removeErrorListeners()
    lexer.addErrorListener(lexicos)
    tokens = CommonTokenStream(lexer)
    tokens.fill()
    parser = EducativoParser(tokens)
    sintacticos = ErroresSintacticos()
    parser.removeErrorListeners()
    parser.addErrorListener(sintacticos)
    arbol = parser.programa()
    return arbol, tokens, lexicos.errores, sintacticos.errores


def buscar_regla(arbol, indice):
    if hasattr(arbol, "getRuleIndex") and arbol.getRuleIndex() == indice:
        return arbol
    for hijo in arbol.getChildren():
        if hasattr(hijo, "getRuleIndex"):
            encontrado = buscar_regla(hijo, indice)
            if encontrado is not None:
                return encontrado
    return None


class DocumentacionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.reglas = producciones((PROYECTO.parent / "docs/gramatica.md").read_text(encoding="utf-8"))
        texto = (PROYECTO.parent / "docs/derivaciones.md").read_text(encoding="utf-8")
        cls.familias = re.findall(r"^## ([^\n]+)\n(.*?)(?=^## |\Z)", texto, re.M | re.S)

    def test_cantidades_y_derivaciones_por_la_izquierda(self):
        self.assertEqual(len(self.familias), 17)
        for familia, contenido in self.familias:
            with self.subTest(familia=familia):
                inicial = re.search(r"Símbolo inicial: `([^`]+)`", contenido).group(1)
                self.assertIn(inicial, self.reglas)
                self.assertEqual(re.findall(r"^### Ejemplo (\d+)$", contenido, re.M),
                                 ["1", "2", "3", "4"])
                ejemplos = bloques(contenido)
                self.assertEqual(len(ejemplos), 9)  # Cuatro pares y un quinto código.
                for numero in range(4):
                    with self.subTest(ejemplo=numero + 1):
                        pasos = [linea.removeprefix("⇒ ").split()
                                 for linea in ejemplos[2 * numero + 1].splitlines()]
                        validar_derivacion(pasos, inicial, self.reglas)

    def test_los_85_ejemplos_y_terminales_derivados(self):
        categorias = {"id": EducativoLexer.ID, "num": EducativoLexer.NUMERO,
                      "cad": EducativoLexer.TEXTO, "nl": EducativoLexer.SALTO_LINEA,
                      "eof": Token.EOF}
        terminales = {simbolo for opciones in self.reglas.values()
                      for opcion in opciones for simbolo in opcion} - self.reglas.keys()
        for simbolo in terminales - categorias.keys():
            lexer = EducativoLexer(InputStream(simbolo))
            token = lexer.nextToken()
            self.assertNotEqual(token.type, EducativoLexer.ID, simbolo)
            self.assertEqual(lexer.nextToken().type, Token.EOF, simbolo)
            categorias[simbolo] = token.type
        equivalencias = {"sentenciaMientras": "mientras", "expresionAleatoria": "aleatorio"}
        for familia, contenido in self.familias:
            inicial = re.search(r"Símbolo inicial: `([^`]+)`", contenido).group(1)
            ejemplos = bloques(contenido)
            for numero, codigo in enumerate(ejemplos[::2], 1):
                with self.subTest(familia=familia, ejemplo=numero):
                    arbol, tokens, lexicos, sintacticos = analizar(codigo)
                    self.assertEqual(lexicos, [])
                    self.assertEqual(sintacticos, [])
                    if numero == 5:
                        continue
                    regla = equivalencias.get(inicial, inicial)
                    contexto = buscar_regla(arbol, EducativoParser.ruleNames.index(regla))
                    self.assertIsNotNone(contexto)
                    # ANTLR excluye EOF del intervalo del contexto programa.
                    if inicial == "programa":
                        obtenidos = [t.type for t in tokens.tokens]
                    else:
                        obtenidos = [t.type for t in tokens.tokens[
                            contexto.start.tokenIndex:contexto.stop.tokenIndex + 1]]
                    final = ejemplos[2 * (numero - 1) + 1].splitlines()[-1].removeprefix("⇒ ").split()
                    self.assertEqual(obtenidos, [categorias[s] for s in final])

    def test_validador_rechaza_pasos_incorrectos(self):
        reglas = {"S": [["A", "B"]], "A": [["a"]], "B": [["b"], []]}
        casos = [
            [["S"], ["A", "B"], ["A", "b"], ["a", "b"]],  # Expande a la derecha.
            [["S"], ["A", "B"], ["a", "b"]],  # Expande dos símbolos.
            [["S"], ["A", "B"], ["x", "B"], ["x", "b"]],  # Producción inexistente.
            [["S"], ["A", "B"]],  # No termina en terminales.
            [["A"], ["a"]],  # Inicial incorrecto.
        ]
        for pasos in casos:
            with self.subTest(pasos=pasos), self.assertRaises(ValueError):
                validar_derivacion(pasos, "S", reglas)
        validar_derivacion([["S"], ["A", "B"], ["a", "B"], ["a"]], "S", reglas)


if __name__ == "__main__":
    unittest.main()
