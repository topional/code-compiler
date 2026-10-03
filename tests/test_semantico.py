"""Pruebas de los dos errores semánticos requeridos para el parcial."""

import glob
import os
import subprocess
import sys
import unittest

from test_parser import PROYECTO, analizar
from semantico import AnalizadorSemantico


class SemanticoTests(unittest.TestCase):
    def comprobar(self, codigo):
        arbol, lexicos, sintacticos = analizar(codigo)
        self.assertEqual(lexicos, [])
        self.assertEqual(sintacticos, [])
        analizador = AnalizadorSemantico()
        analizador.visit(arbol)
        return analizador.errores

    def test_programas_validos(self):
        for archivo in sorted(glob.glob(os.path.join(PROYECTO, "examples", "*.edu"))):
            with self.subTest(archivo=os.path.basename(archivo)):
                with open(archivo, encoding="utf-8") as entrada:
                    self.assertEqual(self.comprobar(entrada.read()), [])

    def test_usos_sin_declaracion(self):
        casos = [
            ("mostrar edad", "1:9"),
            ("asignar edad valor de 10", "1:9"),
            ('preguntar "Edad" y guardar en edad', "1:31"),
            ("mostrar sumar(edad, 1)", "1:15"),
            ("mostrar numero aleatorio entre minimo y 6", "1:32"),
            ("si activo entonces\nfin", "1:4"),
            ("repetir cantidad veces\nfin", "1:9"),
            ("mientras activo hacer\nfin", "1:10"),
            ("definir dato devuelve numero\ndevolver edad\nfin", "2:10"),
        ]
        for codigo, posicion in casos:
            with self.subTest(codigo=codigo):
                errores = self.comprobar(codigo)
                self.assertEqual(len(errores), 1)
                self.assertIn("no está declarada", errores[0])
                self.assertIn("Error semántico en " + posicion, errores[0])

    def test_declaracion_posterior_no_resuelve_uso_anterior(self):
        errores = self.comprobar("mostrar edad\ncrear variable edad\nmostrar edad")
        self.assertEqual(len(errores), 1)
        self.assertIn("1:9", errores[0])

    def test_declaracion_duplicada(self):
        errores = self.comprobar("crear variable edad\ncrear variable edad\nmostrar edad")
        self.assertEqual(len(errores), 1)
        self.assertIn("2:16", errores[0])
        self.assertIn("ya está declarada", errores[0])
        self.assertIn("primera declaración en 1:16", errores[0])

    def test_parametros_y_declaraciones_del_cuerpo_comparten_ambito(self):
        for codigo in (
            "definir sumar con numero dato, numero dato devuelve numero\nfin",
            "definir sumar con numero dato devuelve numero\ncrear variable dato\nfin",
        ):
            with self.subTest(codigo=codigo):
                errores = self.comprobar(codigo)
                self.assertEqual(len(errores), 1)
                self.assertIn("ya está declarada", errores[0])

    def test_ambitos_locales_no_escapan(self):
        for codigo in (
            "si verdadero entonces\ncrear variable local\nfin\nmostrar local",
            "definir dato con numero local devuelve numero\ndevolver local\nfin\nmostrar local",
            "si verdadero entonces\ncrear variable local\nsino\nmostrar local\nfin",
        ):
            with self.subTest(codigo=codigo):
                errores = self.comprobar(codigo)
                self.assertEqual(len(errores), 1)
                self.assertIn("'local' no está declarada", errores[0])

    def test_acceso_exterior_y_ocultamiento_local(self):
        codigo = (
            "crear variable edad\nasignar edad valor de 10\n"
            "si verdadero entonces\nmostrar edad\ncrear variable edad\n"
            "asignar edad valor de 20\n"
            "mientras falso hacer\nmostrar edad\nfin\nfin\nmostrar edad\n"
            "definir dato con numero edad devuelve numero\ndevolver edad\nfin"
        )
        self.assertEqual(self.comprobar(codigo), [])

    def test_mayusculas_de_nombres_se_distinguen(self):
        self.assertEqual(self.comprobar("crear variable edad\ncrear variable Edad"), [])
        errores = self.comprobar("CREAR VARIABLE edad\nMOSTRAR Edad")
        self.assertEqual(len(errores), 1)
        self.assertIn("'Edad' no está declarada", errores[0])

    def test_acumula_errores_sin_crear_variables_por_asignacion(self):
        errores = self.comprobar("asignar edad valor de otra\nmostrar edad")
        self.assertEqual(len(errores), 3)

    def test_alcance_parcial_no_verifica_tipos_ni_inicializacion(self):
        for codigo in ("crear variable edad\nmostrar edad",
                       'crear variable edad\nasignar edad valor de 1 + "hola"',
                       "mostrar funcionPendiente()", "devolver 1", "si 10 entonces\nfin"):
            with self.subTest(codigo=codigo):
                self.assertEqual(self.comprobar(codigo), [])

    def test_driver_errores_semanticos(self):
        for nombre, posicion in (("variable_no_declarada.edu", "1:9"),
                                 ("variable_duplicada.edu", "2:16")):
            with self.subTest(nombre=nombre):
                resultado = subprocess.run(
                    [sys.executable, os.path.join(PROYECTO, "src/main.py"),
                     os.path.join(PROYECTO, "tests/fixtures/invalid", nombre)],
                    capture_output=True, text=True, encoding="utf-8",
                )
                self.assertEqual(resultado.returncode, 1)
                self.assertEqual(resultado.stdout, "")
                self.assertIn("Error semántico en " + posicion, resultado.stderr)

    def test_driver_programa_valido(self):
        resultado = subprocess.run(
            [sys.executable, os.path.join(PROYECTO, "src/main.py"),
             os.path.join(PROYECTO, "examples/semantico_completo.edu"), "--arbol"],
            capture_output=True, text=True, encoding="utf-8",
        )
        self.assertEqual(resultado.returncode, 0, resultado.stderr)
        self.assertEqual(resultado.stderr, "")
        self.assertIn("Análisis semántico parcial correcto.", resultado.stdout)
        self.assertIn("(programa", resultado.stdout)


if __name__ == "__main__":
    unittest.main()
