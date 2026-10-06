"""Pruebas del parser."""

import glob
import os
import subprocess
import sys
import unittest

from antlr4 import CommonTokenStream, InputStream

PROYECTO = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
sys.path.insert(0, os.path.join(PROYECTO, "src"))

from generated.EducativoLexer import EducativoLexer
from generated.EducativoParser import EducativoParser
from main import ErroresLexicos, ErroresSintacticos


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
    return parser.programa(), lexicos.errores, sintacticos.errores


class ParserTests(unittest.TestCase):
    def test_ejemplos_del_proyecto(self):
        for archivo in sorted(glob.glob(os.path.join(PROYECTO, "examples", "*.edu"))):
            with self.subTest(archivo=os.path.basename(archivo)):
                with open(archivo, encoding="utf-8") as entrada:
                    _, lexicos, sintacticos = analizar(entrada.read())
                self.assertEqual(lexicos, [])
                self.assertEqual(sintacticos, [])

    def test_construcciones_validas(self):
        casos = [
            "crear variable edad", 'asignar nombre valor de "Ana"',
            "asignar activo valor de verdadero", "mostrar sumar(2, 3)",
            'preguntar "Edad" y guardar en edad',
            "si verdadero entonces\nfin", "si verdadero entonces\nsino\nfin",
            "repetir cantidad + 1 veces\nmostrar 10\nfin",
            "mientras no terminado hacer\nmostrar 10\nfin",
            "definir saludo devuelve texto\ndevolver \"Hola\"\nfin",
            "definir negar con logico estado devuelve logico\ndevolver no estado\nfin",
            "sumar(2, sumar(3, 4))", "saludo()", "juego", "CALCULADORA",
            "asignar dado valor de numero aleatorio entre -3 y 6",
            "asignar dado valor de numero ALEATORIO entre minimo y maximo",
            "mostrar (numero aleatorio entre 1 y 6) + 1",
        ]
        for codigo in casos:
            with self.subTest(codigo=codigo):
                _, lexicos, sintacticos = analizar(codigo)
                self.assertEqual(lexicos, [])
                self.assertEqual(sintacticos, [])

    def test_separacion_de_lineas_y_eof(self):
        for codigo in ("", "# comentario", "\n\n", "mostrar 1", "mostrar 1\n",
                       "mostrar 1\r\n\r\nmostrar 2", "mostrar 1 # final",
                       "si verdadero entonces\n# comentario\n\nmostrar 1\nfin"):
            with self.subTest(codigo=codigo):
                _, lexicos, sintacticos = analizar(codigo)
                self.assertEqual(lexicos, [])
                self.assertEqual(sintacticos, [])

    def test_bloques_anidados_y_sino(self):
        arbol, _, errores = analizar(
            "si verdadero entonces\n"
            "si falso entonces\nmostrar 1\nsino\nmostrar 2\nfin\n"
            "sino\nrepetir 2 veces\nmostrar 3\nfin\nfin"
        )
        self.assertEqual(errores, [])
        exterior = arbol.sentencia(0).condicional()
        interior = exterior.bloque(0).sentencia(0).condicional()
        self.assertEqual(len(exterior.bloque()), 2)
        self.assertEqual(len(interior.bloque()), 2)
        self.assertIsNotNone(exterior.bloque(1).sentencia(0).repeticion())

    def test_precedencia_aritmetica_y_menos_unario(self):
        arbol, _, errores = analizar("mostrar 2 + 3 * -4 - 5")
        self.assertEqual(errores, [])
        suma = (arbol.sentencia(0).salida().expresion().disyuncion()
                .conjuncion(0).negacion(0).comparacion().suma(0))
        self.assertEqual([p.getText() for p in suma.producto()], ["2", "3*-4", "5"])
        multiplicacion = suma.producto(1)
        self.assertEqual([u.getText() for u in multiplicacion.unaria()], ["3", "-4"])
        self.assertIsNotNone(multiplicacion.unaria(1).RESTA())

    def test_comparaciones_compuestas_y_logica(self):
        for operador in ("es igual a", "es diferente de", "es mayor que", "es menor que",
                         "es mayor o igual que", "es menor o igual que"):
            with self.subTest(operador=operador):
                arbol, _, errores = analizar(f"mostrar puntos {operador} 10 y no falso o verdadero")
                self.assertEqual(errores, [])
                disyuncion = arbol.sentencia(0).salida().expresion().disyuncion()
                self.assertEqual(len(disyuncion.conjuncion()), 2)
                conjuncion = disyuncion.conjuncion(0)
                self.assertEqual(len(conjuncion.negacion()), 2)
                comparacion = conjuncion.negacion(0).comparacion()
                self.assertEqual(comparacion.operadorComparacion().getText(), operador.replace(" ", ""))
                self.assertIsNotNone(conjuncion.negacion(1).NO())

    def test_y_del_rango_no_consume_el_operador_logico(self):
        arbol, _, errores = analizar("mostrar numero aleatorio entre 1 y 6 es mayor que 3 y verdadero")
        self.assertEqual(errores, [])
        conjuncion = arbol.sentencia(0).salida().expresion().disyuncion().conjuncion(0)
        self.assertEqual(len(conjuncion.negacion()), 2)
        aleatorio = (conjuncion.negacion(0).comparacion().suma(0)
                     .producto(0).unaria(0).primaria().aleatorio())
        self.assertEqual([limite.getText() for limite in aleatorio.limite()], ["1", "6"])

    def test_errores_de_estructura(self):
        casos = [
            "crear edad", "crear variable", "crear variable edad con 10",
            "asignar edad 10", "asignar edad valor 10", "asignar edad valor de",
            "mostrar", "mostrar 1 +", "mostrar (1 + 2", "mostrar 1 mostrar 2",
            'preguntar "Edad" guardar en edad', "preguntar edad y guardar en respuesta",
            "si verdadero\nmostrar 1\nfin", "si verdadero entonces\nmostrar 1",
            "si verdadero entonces mostrar 1 fin", "sino\nmostrar 1\nfin", "fin",
            "repetir 3\nmostrar 1\nfin", "mientras verdadero\nfin",
            "definir sumar con primero devuelve numero\nfin",
            "definir sumar devuelve numero\ndevolver 1", "sumar(1,)",
            "asignar dado valor de numero aleatorio 1 y 6",
            "asignar dado valor de numero aleatorio entre 1 6",
            "asignar dado valor de numero aleatorio entre 1 y",
            'asignar dado valor de numero aleatorio entre "uno" y 6',
            "elegir numero entre 1 y 6 y guardar en dado",
            "mostrar edad es mayor igual que 10", "mostrar 1 es menor que 2 es menor que 3",
        ]
        for codigo in casos:
            with self.subTest(codigo=codigo):
                _, lexicos, sintacticos = analizar(codigo)
                self.assertEqual(lexicos, [], "El caso debe fallar en sintaxis, no en léxico")
                self.assertTrue(sintacticos)

    def test_restricciones_semanticas_no_se_confunden_con_sintaxis(self):
        # Pasan la sintaxis; la semántica se revisa aparte.
        for codigo in ("mostrar desconocida", "devolver 1", "si 10 entonces\nfin",
                       "asignar dado valor de numero aleatorio entre 3.5 y 1"):
            with self.subTest(codigo=codigo):
                _, lexicos, sintacticos = analizar(codigo)
                self.assertEqual(lexicos, [])
                self.assertEqual(sintacticos, [])

    def test_driver_reporta_errores_sintacticos(self):
        for nombre, posicion in (("asignacion_sin_valor.edu", "1:14"),
                                 ("condicional_sin_fin.edu", "3:1")):
            with self.subTest(nombre=nombre):
                resultado = subprocess.run(
                    [sys.executable, os.path.join(PROYECTO, "src/main.py"),
                     os.path.join(PROYECTO, "tests/fixtures/invalid", nombre)],
                    capture_output=True, text=True, encoding="utf-8",
                )
                self.assertEqual(resultado.returncode, 1)
                self.assertEqual(resultado.stdout, "")
                self.assertIn("Error sintáctico en " + posicion, resultado.stderr)

    def test_driver_muestra_arbol_y_confirmacion(self):
        resultado = subprocess.run(
            [sys.executable, os.path.join(PROYECTO, "src/main.py"),
             os.path.join(PROYECTO, "examples/variables.edu"), "--arbol"],
            capture_output=True, text=True, encoding="utf-8",
        )
        self.assertEqual(resultado.returncode, 0, resultado.stderr)
        self.assertEqual(resultado.stderr, "")
        self.assertIn("Análisis sintáctico correcto.", resultado.stdout)
        self.assertIn("(programa", resultado.stdout)


if __name__ == "__main__":
    unittest.main()
