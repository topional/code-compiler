"""Pruebas del flujo .edu → JSON → ejecución independiente."""

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from textwrap import dedent


RAIZ = Path(__file__).resolve().parents[1]


class PruebasInterprete(unittest.TestCase):
    def setUp(self):
        temporal = tempfile.TemporaryDirectory()
        self.addCleanup(temporal.cleanup)
        self.fuente = Path(temporal.name) / "programa.edu"
        self.intermedio = self.fuente.with_suffix(".ir.json")

    def proceso(self, *argumentos, entrada=""):
        resultado = subprocess.run(
            [sys.executable, *argumentos], cwd=RAIZ, input=entrada, capture_output=True,
            encoding="utf-8", env={**os.environ, "PYTHONIOENCODING": "utf-8"}, timeout=10,
        )
        self.assertNotIn("Traceback", resultado.stderr)
        return resultado

    def compilar(self, programa, *, salida=None, etapa="intermedio"):
        self.fuente.write_text(dedent(programa).lstrip("\n"), encoding="utf-8")
        return self.proceso("src/main.py", self.fuente, "--etapa", etapa,
                            "--salida", salida if salida is not None else self.intermedio)

    def ejecutar(self, programa, entrada=""):
        compilacion = self.compilar(programa)
        self.assertEqual(compilacion.returncode, 0, compilacion.stderr)
        self.assertEqual(compilacion.stdout, "")
        return self.proceso("src/interprete.py", self.intermedio, entrada=entrada)

    def test_factorial_exportado_y_ejecutado(self):
        compilacion = self.compilar('''
            definir factorial(numero dato) devuelve numero
                si dato es menor o igual que 1 entonces
                    devolver 1
                fin
                devolver dato * factorial(dato - 1)
            fin
            mostrar factorial(5)
        ''')
        self.assertEqual(compilacion.returncode, 0, compilacion.stderr)
        self.assertEqual(compilacion.stdout, "")
        datos = json.loads(self.intermedio.read_text(encoding="utf-8"))
        self.assertEqual(datos["version"], 1)
        funcion = datos["instrucciones"][0]
        self.assertEqual(funcion["operacion"], "funcion")
        self.assertEqual(funcion["argumento2"], "numero")
        self.assertEqual(funcion["nombre"], "factorial")
        self.assertEqual((funcion["linea"], funcion["columna"]), (1, 1))
        resultado = self.proceso("-S", "src/interprete.py", self.intermedio)
        self.assertEqual(resultado.returncode, 0, resultado.stderr)
        self.assertEqual(resultado.stdout, "120\n")

    def test_ciclos_y_aleatorios(self):
        resultado = self.ejecutar('''
            juego
            crear variable vueltas
            asignar vueltas valor de 3
            crear variable total
            asignar total valor de 0
            repetir vueltas veces
                crear variable dado
                asignar dado valor de numero aleatorio entre -2 y -2
                asignar total valor de total - dado
                asignar vueltas valor de 0
            fin
            mientras total es mayor que 3 hacer
                asignar total valor de total - 1
            fin
            mostrar total
            asignar total valor de numero aleatorio entre -1 y vueltas
            mostrar total es mayor o igual que -1 y total es menor o igual que 0
        ''')
        self.assertEqual(resultado.returncode, 0, resultado.stderr)
        self.assertEqual(resultado.stdout, "3\nverdadero\n")

    def test_ambitos_anidados_en_activaciones_recursivas(self):
        resultado = self.ejecutar('''
            crear variable local
            asignar local valor de 99
            definir exterior(numero nivel) devuelve numero
                crear variable local
                asignar local valor de nivel
                definir leer_local() devuelve numero
                    definir sumar(numero incremento) devuelve numero
                        asignar local valor de local + incremento
                        devolver local
                    fin
                    devolver sumar(1)
                fin
                si nivel es igual a 0 entonces
                    crear variable local
                    asignar local valor de 100
                    devolver leer_local()
                fin
                devolver leer_local() + exterior(nivel - 1) + leer_local()
            fin
            mostrar exterior(3)
            mostrar local
        ''')
        self.assertEqual(resultado.returncode, 0, resultado.stderr)
        self.assertEqual(resultado.stdout, "22\n99\n")

    def test_entrada_con_reintentos_y_salida_utf8(self):
        resultado = self.ejecutar(r'''
            crear variable edad
            asignar edad valor de 0
            crear variable listo
            asignar listo valor de falso
            crear variable respuesta
            preguntar "¿Edad?" guardar en edad
            preguntar "¿Listo?" guardar en listo
            preguntar "¿Texto?" guardar en respuesta
            mostrar edad / 2
            mostrar no listo o respuesta es diferente de " sí "
            mostrar "línea\n\"dos\""
        ''', "mal\n3\nsí\nVERDADERO\n sí \n")
        self.assertEqual(resultado.returncode, 0, resultado.stderr)
        self.assertEqual(resultado.stdout.count("¿Edad?"), 2)
        self.assertEqual(resultado.stdout.count("¿Listo?"), 2)
        self.assertEqual(resultado.stdout.count("Entrada inválida"), 2)
        self.assertTrue(resultado.stdout.endswith('3/2\nfalso\nlínea\n"dos"\n'))
        self.assertIn("¿Edad?", self.intermedio.read_text(encoding="utf-8"))

    def test_errores_de_ejecucion_con_ubicacion(self):
        base = 'crear variable dato\nasignar dato valor de 0\npreguntar "Dato" guardar en dato\n'
        casos = (
            ("mostrar 1 / dato", "0", "4:11", "división por cero"),
            ("repetir dato veces\nfin", "1.5", "4:1", "entero no negativo"),
            ("mostrar numero aleatorio entre dato y 5", "6", "4:9", "mínimo del aleatorio"),
        )
        for sentencia, entrada, ubicacion, mensaje in casos:
            with self.subTest(sentencia=sentencia):
                resultado = self.ejecutar(base + sentencia, entrada + "\n")
                self.assertEqual(resultado.returncode, 1)
                self.assertIn(f"Error de ejecución en {ubicacion}", resultado.stderr)
                self.assertIn(mensaje, resultado.stderr)

    def test_json_invalido(self):
        casos = (
            ("{", "No se pudo leer el JSON"),
            ('{"version": 2, "instrucciones": []}', "se requiere la versión 1"),
            ('{"version": 1, "instrucciones": {}}', "debe ser una lista"),
            ('{"version": 1, "instrucciones": [{"operacion": "inventada"}]}', "operación desconocida"),
            ('{"version": 1, "instrucciones": [{"operacion": "mostrar"}]}', "falta 'argumento1'"),
            ('{"version": 1, "instrucciones": [{"operacion": "saltar", "resultado": "%L1"}]}',
             "no existe la etiqueta"),
        )
        for contenido, diagnostico in casos:
            with self.subTest(contenido=contenido):
                self.intermedio.write_text(contenido, encoding="utf-8")
                resultado = self.proceso("src/interprete.py", self.intermedio)
                self.assertEqual(resultado.returncode, 1)
                self.assertIn(diagnostico, resultado.stderr)

    def test_compilacion_fallida_no_escribe_la_salida(self):
        for contenido in (None, "salida anterior"):
            with self.subTest(contenido=contenido):
                if contenido is not None:
                    self.intermedio.write_text(contenido, encoding="utf-8")
                resultado = self.compilar("mostrar no_declarada\n")
                self.assertEqual(resultado.returncode, 1)
                self.assertIn("Error semántico", resultado.stderr)
                if contenido is None:
                    self.assertFalse(self.intermedio.exists())
                else:
                    self.assertEqual(self.intermedio.read_text(encoding="utf-8"), contenido)

    def test_salida_protege_fuente_y_requiere_etapa_intermedio(self):
        programa = "mostrar 1\n"
        resultado = self.compilar(programa, salida=self.fuente)
        self.assertEqual(resultado.returncode, 1)
        self.assertIn("no puede sobrescribir", resultado.stderr)
        self.assertEqual(self.fuente.read_text(encoding="utf-8"), programa)

        resultado = self.compilar(programa, etapa="semantica")
        self.assertEqual(resultado.returncode, 2)
        self.assertIn("--salida requiere --etapa intermedio", resultado.stderr)
        self.assertFalse(self.intermedio.exists())
