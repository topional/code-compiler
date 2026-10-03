"""Pruebas de reconocimiento, límites entre tokens y errores del driver."""

import glob
import os
import subprocess
import sys
import tempfile
import unittest

from antlr4 import CommonTokenStream, InputStream, Token

PROYECTO = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
sys.path.insert(0, os.path.join(PROYECTO, "src"))

from generated.EducativoLexer import EducativoLexer
from main import ErroresLexicos


def analizar(codigo):
    lexer = EducativoLexer(InputStream(codigo))
    errores = ErroresLexicos()
    lexer.removeErrorListeners()
    lexer.addErrorListener(errores)
    stream = CommonTokenStream(lexer)
    stream.fill()
    tokens = [
        (lexer.symbolicNames[token.type], token.text)
        for token in stream.tokens
        if token.type != Token.EOF
    ]
    return tokens, errores.errores, stream.tokens[-1]


class LexerTests(unittest.TestCase):
    def test_numero_aleatorio_y_limites(self):
        for limites, esperados in (
            ("1 y 6", [("NUMERO", "1"), ("Y", "y"), ("NUMERO", "6")]),
            ("minimo y maximo", [("ID", "minimo"), ("Y", "y"), ("ID", "maximo")]),
        ):
            with self.subTest(limites=limites):
                tokens, errores, _ = analizar(
                    "asignar dado valor de numero ALEATORIO entre " + limites
                )
                self.assertEqual(errores, [])
                self.assertEqual(tokens, [
                    ("ASIGNAR", "asignar"), ("ID", "dado"),
                    ("VALOR", "valor"), ("DE", "de"),
                    ("TIPO_NUMERO", "numero"), ("ALEATORIO", "ALEATORIO"),
                    ("ENTRE", "entre"),
                ] + esperados)
        tokens, errores, _ = analizar("aleatorio aleatorioDato elegir")
        self.assertEqual(errores, [])
        self.assertEqual(tokens, [
            ("ALEATORIO", "aleatorio"), ("ID", "aleatorioDato"), ("ID", "elegir"),
        ])

    def test_calculadora_y_nombres_similares(self):
        tokens, errores, _ = analizar("calculadora calculadoraPersonal Calculadora CALCULADORA")
        self.assertEqual(errores, [])
        self.assertEqual(tokens, [
            ("CALCULADORA", "calculadora"),
            ("ID", "calculadoraPersonal"),
            ("CALCULADORA", "Calculadora"),
            ("CALCULADORA", "CALCULADORA"),
        ])

    def test_palabras_reservadas_y_nombres_mas_largos(self):
        tokens, errores, _ = analizar(
            "mostrar mostrarEdad si sino sinopsis devolver devuelve devolverDato asignar asignarPuntos"
        )
        self.assertEqual(errores, [])
        self.assertEqual(
            tokens,
            [
                ("MOSTRAR", "mostrar"), ("ID", "mostrarEdad"),
                ("SI", "si"), ("SINO", "sino"), ("ID", "sinopsis"),
                ("DEVOLVER", "devolver"), ("DEVUELVE", "devuelve"),
                ("ID", "devolverDato"),
                ("ASIGNAR", "asignar"), ("ID", "asignarPuntos"),
            ],
        )

    def test_identificadores_espanoles_y_mayusculas(self):
        tokens, errores, _ = analizar("año número2 acción _contador AÑO Número2")
        self.assertEqual(errores, [])
        self.assertTrue(all(tipo == "ID" for tipo, _ in tokens))
        self.assertEqual([texto for _, texto in tokens],
                         ["año", "número2", "acción", "_contador", "AÑO", "Número2"])

    def test_palabras_mixtas_preservan_el_lexema(self):
        tokens, errores, _ = analizar(
            'CrEaR VARIABLE edad\nASIGNAR edad VaLoR DE 11\n'
            'crear variable nombre\nasignar nombre valor de "Ana"\n'
            'Mostrar 10\nMOSTRAR "Hola ANA"'
        )
        self.assertEqual(errores, [])
        self.assertEqual(tokens, [
            ("CREAR", "CrEaR"), ("VARIABLE", "VARIABLE"), ("ID", "edad"),
            ("SALTO_LINEA", "\n"),
            ("ASIGNAR", "ASIGNAR"), ("ID", "edad"), ("VALOR", "VaLoR"),
            ("DE", "DE"), ("NUMERO", "11"), ("SALTO_LINEA", "\n"),
            ("CREAR", "crear"), ("VARIABLE", "variable"), ("ID", "nombre"),
            ("SALTO_LINEA", "\n"), ("ASIGNAR", "asignar"), ("ID", "nombre"),
            ("VALOR", "valor"), ("DE", "de"), ("TEXTO", '"Ana"'),
            ("SALTO_LINEA", "\n"), ("MOSTRAR", "Mostrar"), ("NUMERO", "10"),
            ("SALTO_LINEA", "\n"), ("MOSTRAR", "MOSTRAR"), ("TEXTO", '"Hola ANA"'),
        ])

    def test_comparacion_compuesta_y_operador_logico(self):
        tokens, errores, _ = analizar(
            "puntos es mayor o igual que 10 y no terminado"
        )
        self.assertEqual(errores, [])
        self.assertEqual(
            [tipo for tipo, _ in tokens],
            ["ID", "ES", "MAYOR", "O", "IGUAL", "QUE", "NUMERO", "Y", "NO", "ID"],
        )

    def test_signos_numeros_y_agrupacion(self):
        tokens, errores, _ = analizar("sumar(-12.5, (3 + 2) * 4 / 2)")
        self.assertEqual(errores, [])
        self.assertEqual(tokens[2:4], [("RESTA", "-"), ("NUMERO", "12.5")])
        self.assertEqual([texto for tipo, texto in tokens if tipo == "NUMERO"],
                         ["12.5", "3", "2", "4", "2"])
        self.assertIn(("COMA", ","), tokens)
        self.assertEqual(tokens[-1], ("PAREN_DER", ")"))

    def test_texto_preserva_escapes_y_comentario_interno(self):
        cadena = r'"Hola \"Ana\" # texto \n \r \t \\"'
        tokens, errores, _ = analizar("mostrar " + cadena)
        self.assertEqual(errores, [])
        self.assertEqual(tokens, [("MOSTRAR", "mostrar"), ("TEXTO", cadena)])

    def test_comentarios_y_finales_de_linea(self):
        tokens, errores, _ = analizar(
            '# comentario\r\nmostrar "# texto" # comentario\n# al final'
        )
        self.assertEqual(errores, [])
        self.assertEqual(tokens, [
            ("SALTO_LINEA", "\r\n"), ("MOSTRAR", "mostrar"),
            ("TEXTO", '"# texto"'), ("SALTO_LINEA", "\n"),
        ])

    def test_entrada_vacia_y_eof_sin_salto_final(self):
        for codigo in ("", "  \t", "# comentario", "juego"):
            with self.subTest(codigo=codigo):
                _, errores, ultimo = analizar(codigo)
                self.assertEqual(errores, [])
                self.assertEqual(ultimo.type, Token.EOF)

    def test_caracter_invalido_indica_posicion(self):
        _, errores, _ = analizar("mostrar @")
        self.assertEqual(len(errores), 1)
        self.assertIn("1:9", errores[0])

    def test_literales_mal_formados(self):
        for codigo in ('mostrar "sin cerrar', 'mostrar "dos\nlíneas"',
                       r'mostrar "escape \q"', r'mostrar "escape \N"',
                       "mostrar .5", "mostrar 1.2.3"):
            with self.subTest(codigo=codigo):
                _, errores, _ = analizar(codigo)
                self.assertTrue(errores)

    def test_ejemplos_validos(self):
        for archivo in sorted(glob.glob(os.path.join(PROYECTO, "examples", "*.edu"))):
            with self.subTest(archivo=os.path.basename(archivo)):
                with open(archivo, encoding="utf-8") as entrada:
                    tokens, errores, _ = analizar(entrada.read())
                self.assertEqual(errores, [])
                self.assertTrue(tokens)

    def test_driver_valido_muestra_tokens(self):
        resultado = subprocess.run(
            [sys.executable, os.path.join(PROYECTO, "src/main.py"),
             os.path.join(PROYECTO, "examples/lexer_completo.edu")],
            capture_output=True, text=True, encoding="utf-8",
        )
        self.assertEqual(resultado.returncode, 0, resultado.stderr)
        self.assertEqual(resultado.stderr, "")
        self.assertIn("TIPO_NUMERO", resultado.stdout)
        self.assertIn("EOF", resultado.stdout)

    def test_driver_invalido_retorna_error(self):
        resultado = subprocess.run(
            [sys.executable, os.path.join(PROYECTO, "src/main.py"),
             os.path.join(PROYECTO, "tests/fixtures/invalid/caracter.edu")],
            capture_output=True, text=True, encoding="utf-8",
        )
        self.assertEqual(resultado.returncode, 1)
        self.assertIn("Error léxico en 1:9", resultado.stderr)
        self.assertEqual(resultado.stdout, "")

    def test_driver_archivo_inexistente(self):
        with tempfile.TemporaryDirectory() as carpeta:
            resultado = subprocess.run(
                [sys.executable, os.path.join(PROYECTO, "src/main.py"),
                 os.path.join(carpeta, "no_existe.edu")],
                capture_output=True, text=True, encoding="utf-8",
            )
        self.assertEqual(resultado.returncode, 2)
        self.assertIn("No se pudo leer el archivo", resultado.stderr)


if __name__ == "__main__":
    unittest.main()
