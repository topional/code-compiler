"""Pruebas integrales de los programas completos de examples/.

Cada programa recorre el flujo completo: .edu → compilación → JSON → ejecución.
"""

import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


RAIZ = Path(__file__).resolve().parents[1]


class PruebasProgramasCompletos(unittest.TestCase):
    def setUp(self):
        temporal = tempfile.TemporaryDirectory()
        self.addCleanup(temporal.cleanup)
        self.carpeta = Path(temporal.name)

    def proceso(self, *argumentos, entrada=""):
        resultado = subprocess.run(
            [sys.executable, *argumentos], cwd=RAIZ, input=entrada, capture_output=True,
            encoding="utf-8", env={**os.environ, "PYTHONIOENCODING": "utf-8"}, timeout=20,
        )
        self.assertNotIn("Traceback", resultado.stderr)
        return resultado

    def compilar_y_ejecutar(self, nombre, entrada=""):
        intermedio = self.carpeta / f"{nombre}.ir.json"
        compilacion = self.proceso("src/main.py", f"examples/{nombre}.edu",
                                   "--etapa", "intermedio", "--salida", intermedio)
        self.assertEqual(compilacion.returncode, 0, compilacion.stderr)
        self.assertTrue(intermedio.exists())
        ejecucion = self.proceso("src/interprete.py", intermedio, entrada=entrada)
        self.assertEqual(ejecucion.returncode, 0, ejecucion.stderr)
        return ejecucion.stdout

    def test_basico(self):
        self.assertEqual(self.compilar_y_ejecutar("basico"),
                         "Hola\nAna\nEl próximo año tendrás\n13\n"
                         "Ya puedes programar con texto\n1\n2\n3\n")

    def test_principal_adivina_el_numero(self):
        # Prueba del 1 al 10: el ciclo termina al acertar el número secreto.
        salida = self.compilar_y_ejecutar("principal", "\n".join(map(str, range(1, 11))) + "\n")
        lineas = salida.splitlines()
        self.assertEqual(lineas[0], "Adivina el número del 1 al 10")
        self.assertTrue(lineas[-2].endswith("¡Adivinaste! Intentos usados:"))
        intentos = int(lineas[-1])
        self.assertIn(intentos, range(1, 11))
        self.assertEqual(salida.count("Es mayor"), intentos - 1)

    def test_avanzado(self):
        esperado = ["n, factorial, fibonacci y paridad",
                    "1", "1", "1", "impar", "extremo",
                    "2", "2", "1", "par",
                    "3", "6", "2", "impar",
                    "4", "24", "3", "par",
                    "5", "120", "5", "impar", "extremo",
                    "Tabla de multiplicar de 3 x 3",
                    "1", "2", "3", "2", "4", "6", "3", "6", "9"]
        self.assertEqual(self.compilar_y_ejecutar("avanzado").splitlines(), esperado)

    def test_calculadora(self):
        salida = self.compilar_y_ejecutar("calculadora", "1\n8\n5\n")
        self.assertTrue(salida.startswith("Calculadora\n"))
        self.assertTrue(salida.endswith("Resultado:\n13\n"))

    def test_piedra_papel_tijera(self):
        salida = self.compilar_y_ejecutar("piedra_papel_tijera", "1\n")
        self.assertIn("La computadora eligio:", salida)
        self.assertIn(salida.splitlines()[-1], {"Empate", "Ganaste", "Perdiste"})

    def test_con_errores_no_genera_codigo(self):
        intermedio = self.carpeta / "con_errores.ir.json"
        resultado = self.proceso("src/main.py", "examples/con_errores.edu",
                                 "--etapa", "intermedio", "--salida", intermedio)
        self.assertEqual(resultado.returncode, 1)
        self.assertEqual(resultado.stdout, "")
        errores = resultado.stderr.splitlines()
        self.assertEqual(len(errores), 7)
        self.assertTrue(all(linea.startswith("Error semántico en ") for linea in errores))
        self.assertFalse(intermedio.exists())


if __name__ == "__main__":
    unittest.main()
