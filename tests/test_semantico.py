"""Pruebas del analizador semántico."""

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
        errores = self.comprobar("mostrar edad\ncrear variable edad\nasignar edad valor de 1\nmostrar edad")
        self.assertEqual(len(errores), 1)
        self.assertIn("1:9", errores[0])

    def test_declaracion_duplicada(self):
        errores = self.comprobar("crear variable edad\ncrear variable edad\nasignar edad valor de 1\nmostrar edad")
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

    def test_comprobaciones_pendientes(self):
        for codigo in ("mostrar funcionPendiente()", "devolver 1", "si 10 entonces\nfin",
                       'mostrar 1 es igual a "hola"', "mostrar numero aleatorio entre 3.5 y 1"):
            with self.subTest(codigo=codigo):
                self.assertEqual(self.comprobar(codigo), [])

    def test_variable_sin_inicializar(self):
        for uso in ("mostrar edad", "asignar edad valor de edad + 1",
                    "mostrar dato(edad)", "mostrar numero aleatorio entre edad y 6"):
            with self.subTest(uso=uso):
                errores = self.comprobar("crear variable edad\n" + uso)
                self.assertEqual(len(errores), 1)
                self.assertIn("se usa sin inicializar", errores[0])
                self.assertIn("Asígnale un valor", errores[0])

    def test_tipos_inferidos_y_reasignacion(self):
        for primero, segundo in (("10", "2.5"), ('"Ana"', '"Luis"'), ("verdadero", "falso")):
            with self.subTest(primero=primero):
                self.assertEqual(self.comprobar(
                    f"crear variable dato\nasignar dato valor de {primero}\n"
                    f"asignar dato valor de {segundo}\nmostrar dato"), [])
        errores = self.comprobar('crear variable edad\nasignar edad valor de 10\n'
                                'asignar edad valor de "hola"\nmostrar edad')
        self.assertEqual(len(errores), 1)
        self.assertIn("3:9", errores[0])
        self.assertIn("tipo texto", errores[0])
        self.assertIn("tipo numero", errores[0])

    def test_operaciones_con_tipos_incompatibles(self):
        for expresion, operador in (('1 + "hola"', "+"), ('"hola" - 1', "-"),
                                    ("verdadero * 2", "*"), ('1 / "dos"', "/"),
                                    ('-"hola"', "-"), ("no 1", "no"),
                                    ("1 y verdadero", "y"), ("falso o 2", "o")):
            with self.subTest(expresion=expresion):
                errores = self.comprobar("mostrar " + expresion)
                self.assertEqual(len(errores), 1)
                self.assertIn(f"el operador '{operador}' requiere", errores[0])

    def test_expresiones_validas_con_tipos(self):
        for expresion in ("2 + 3 * -4 / 2.5", "no falso y verdadero o falso",
                          "(2 + 3) * 4", "no 1 es menor que 2", '"hola"',
                          "numero aleatorio entre -3 y 6 + 1"):
            with self.subTest(expresion=expresion):
                self.assertEqual(self.comprobar("mostrar " + expresion), [])

    def test_asignacion_invalida_no_inicializa(self):
        errores = self.comprobar('crear variable edad\nasignar edad valor de 1 + "hola"\nmostrar edad')
        self.assertEqual(len(errores), 2)
        self.assertIn("operador '+'", errores[0])
        self.assertIn("sin inicializar", errores[1])

    def test_entrada_inicializa_y_conserva_tipo_conocido(self):
        for codigo in (
            'crear variable nombre\npreguntar "Nombre" y guardar en nombre\nmostrar nombre',
            'crear variable edad\nasignar edad valor de 0\npreguntar "Edad" y guardar en edad\nmostrar edad + 1',
        ):
            with self.subTest(codigo=codigo):
                self.assertEqual(self.comprobar(codigo), [])
        errores = self.comprobar('crear variable nombre\npreguntar "Nombre" y guardar en nombre\nmostrar nombre + 1')
        self.assertEqual(len(errores), 1)
        self.assertIn("texto y numero", errores[0])

    def test_inicializacion_requiere_ambas_ramas(self):
        inicio = "crear variable edad\nsi verdadero entonces\nasignar edad valor de 1\n"
        self.assertEqual(self.comprobar(inicio + "sino\nasignar edad valor de 2\nfin\nmostrar edad"), [])
        for final in ("fin\nmostrar edad", "sino\nmostrar edad\nfin"):
            with self.subTest(final=final):
                errores = self.comprobar(inicio + final)
                self.assertEqual(len(errores), 1)
                self.assertIn("sin inicializar", errores[0])

    def test_tipos_distintos_en_ramas(self):
        errores = self.comprobar('crear variable dato\nsi verdadero entonces\n'
                                'asignar dato valor de 1\nsino\nasignar dato valor de "hola"\nfin')
        self.assertEqual(len(errores), 1)
        self.assertIn("ramas asignan tipos incompatibles", errores[0])

    def test_ciclos_no_garantizan_inicializacion(self):
        for encabezado in ("mientras falso hacer", "repetir 0 veces"):
            with self.subTest(encabezado=encabezado):
                errores = self.comprobar("crear variable edad\n" + encabezado +
                                        "\nasignar edad valor de 1\nfin\nmostrar edad")
                self.assertEqual(len(errores), 1)
                self.assertIn("sin inicializar", errores[0])

    def test_definir_funcion_no_inicializa_exteriores(self):
        errores = self.comprobar("crear variable edad\ndefinir dato devuelve numero\n"
                                "asignar edad valor de 1\ndevolver edad\nfin\nmostrar edad")
        self.assertEqual(len(errores), 1)
        self.assertIn("6:9", errores[0])

    def test_parametros_y_tipo_de_resultado_de_funciones(self):
        inicio = "definir doble con numero dato devuelve numero\ndevolver dato * 2\nfin\n"
        self.assertEqual(self.comprobar(inicio + "mostrar doble(3) + 1"), [])
        errores = self.comprobar(inicio + 'crear variable nombre\nasignar nombre valor de "Ana"\n'
                                'asignar nombre valor de doble(3)')
        self.assertEqual(len(errores), 1)
        self.assertIn("valor de tipo numero", errores[0])

    def test_driver_errores_semanticos(self):
        for nombre, posicion in (("variable_no_declarada.edu", "1:9"),
                                 ("variable_duplicada.edu", "2:16"),
                                 ("variable_sin_inicializar.edu", "2:9"),
                                 ("tipo_incompatible.edu", "3:9")):
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
