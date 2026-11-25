"""Comprueba el contrato y la supervisión de la API .edu."""

import asyncio
import json
import os
import subprocess
import sys
import unittest
from concurrent.futures import ThreadPoolExecutor
from contextlib import ExitStack, asynccontextmanager
from pathlib import Path
from threading import Event
from textwrap import dedent
from unittest.mock import patch

from fastapi.testclient import TestClient
from starlette.requests import HTTPConnection
from starlette.testclient import WebSocketDenialResponse


RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ / "src"))

from web import api


ORIGEN = "https://editor.example"
PREGUNTA = 'crear variable dato\npreguntar "Dato" guardar en dato\n'
CICLO = "mientras verdadero hacer\nfin\n"


def iniciar(websocket, intermedio):
    websocket.send_json({"tipo": "iniciar", "intermedio": intermedio})


def responder(websocket, texto):
    websocket.send_json({"tipo": "respuesta", "texto": texto})


class PruebasIP(unittest.TestCase):
    def test_seleccion_de_ip(self):
        conexion = ("192.0.2.10", 50000)
        casos = (
            ("true", [b" 198.51.100.1 "], conexion, "198.51.100.1"),
            ("true", [b"2001:0db8:0000::1"], conexion, "2001:db8::1"),
            ("true", [], conexion, conexion[0]),
            ("true", [b""], conexion, conexion[0]),
            ("true", [b"no-es-una-ip"], conexion, conexion[0]),
            ("true", [b"198.51.100.1:443"], conexion, conexion[0]),
            ("true", [b"fe80::1%eth0"], conexion, conexion[0]),
            ("true", [b"198.51.100.1, 198.51.100.2"], conexion, conexion[0]),
            ("true", [b"198.51.100.1", b"198.51.100.1"], conexion, conexion[0]),
            ("true", [], None, "desconocida"),
            ("false", [b"198.51.100.1"], conexion, conexion[0]),
            (None, [b"198.51.100.1"], conexion, conexion[0]),
        )
        for render, valores, cliente, esperada in casos:
            with self.subTest(render=render, valores=valores), patch.dict(os.environ):
                if render is None:
                    os.environ.pop("RENDER", None)
                else:
                    os.environ["RENDER"] = render
                cabeceras = [(b"cf-connecting-ip", valor) for valor in valores]
                cabeceras.append((b"x-forwarded-for", b"203.0.113.1"))
                peticion = HTTPConnection({"type": "http", "headers": cabeceras, "client": cliente})
                self.assertEqual(api.ip_de(peticion), esperada)


class PruebasAPI(unittest.TestCase):
    def setUp(self):
        app = api.crear_app([ORIGEN])

        async def con_ip(scope, receive, send):
            for nombre, valor in scope.get("headers", []):
                if nombre == b"ip-de-prueba":
                    scope = {**scope, "client": (valor.decode(), 50000)}
                    break
            await app(scope, receive, send)

        cliente = TestClient(con_ip)
        self.cliente = cliente.__enter__()
        self.addCleanup(cliente.__exit__, None, None, None)

    def compilar(self, codigo):
        respuesta = self.cliente.post("/compilar", json={"codigo": codigo})
        self.assertEqual(respuesta.status_code, 200, respuesta.text)
        return respuesta.json()

    def test_factorial(self):
        programa = self.compilar(dedent('''\
            definir factorial(numero dato) devuelve numero
                si dato es menor o igual que 1 entonces
                    devolver 1
                fin
                devolver dato * factorial(dato - 1)
            fin
            mostrar factorial(5)
        '''))
        self.assertEqual(programa["version"], 1)
        self.assertEqual(programa["instrucciones"][0]["linea"], 1)
        with self.cliente.websocket_connect("/ejecutar") as websocket:
            iniciar(websocket, programa)
            self.assertEqual(websocket.receive_json(), {"tipo": "salida", "texto": "120"})
            self.assertEqual(websocket.receive_json(), {"tipo": "fin"})
            self.assertEqual(websocket.receive()["type"], "websocket.close")

    def test_calculadora_pide_datos_y_reintenta(self):
        programa = self.compilar((RAIZ / "examples/calculadora.edu").read_text(encoding="utf-8"))
        with self.cliente.websocket_connect("/ejecutar", headers={"Origin": ORIGEN}) as websocket:
            iniciar(websocket, programa)
            for _ in range(5):
                self.assertEqual(websocket.receive_json()["tipo"], "salida")
            self.assertEqual(websocket.receive_json(), {"tipo": "pregunta", "mensaje": "Elige una operacion"})
            responder(websocket, "1")
            primera = {"tipo": "pregunta", "mensaje": "Escribe el primer numero"}
            self.assertEqual(websocket.receive_json(), primera)
            responder(websocket, "mayonesa")
            self.assertEqual(websocket.receive_json()["tipo"], "entrada_invalida")
            self.assertEqual(websocket.receive_json(), primera)
            responder(websocket, "5")
            self.assertEqual(websocket.receive_json(), {"tipo": "pregunta", "mensaje": "Escribe el segundo numero"})
            responder(websocket, "7")
            self.assertEqual(websocket.receive_json()["texto"], "Resultado:")
            self.assertEqual(websocket.receive_json(), {"tipo": "salida", "texto": "12"})
            self.assertEqual(websocket.receive_json(), {"tipo": "fin"})

    def test_diagnosticos_del_compilador(self):
        casos = (("mostrar @", "lexer", 9), ("asignar dato 1", "gramatica", 14),
                 ("mostrar faltante", "semantica", 9))
        for codigo, etapa, columna in casos:
            with self.subTest(etapa=etapa):
                respuesta = self.cliente.post("/compilar", json={"codigo": "\n" + codigo})
                self.assertEqual(respuesta.status_code, 422)
                diagnostico = respuesta.json()["diagnosticos"][0]
                self.assertEqual(set(diagnostico), {"etapa", "mensaje", "linea", "columna"})
                self.assertEqual((diagnostico["etapa"], diagnostico["linea"], diagnostico["columna"]),
                                 (etapa, 2, columna))

    def test_division_por_cero_con_ubicacion(self):
        programa = self.compilar('crear variable dato\nasignar dato valor de 0\n'
                                 'preguntar "Dato" guardar en dato\nmostrar 1 / dato\n')
        with self.cliente.websocket_connect("/ejecutar") as websocket:
            iniciar(websocket, programa)
            self.assertEqual(websocket.receive_json()["tipo"], "pregunta")
            responder(websocket, "0")
            self.assertEqual(websocket.receive_json(), {"tipo": "error", "diagnosticos": [
                {"etapa": "ejecucion", "mensaje": "división por cero.", "linea": 4, "columna": 11},
            ]})

    def test_json_y_protocolo_invalidos(self):
        for cuerpo in ("{", '{"codigo": 1}', '{"codigo": "\\ud800"}', '{"codigo": NaN}'):
            with self.subTest(cuerpo=cuerpo):
                respuesta = self.cliente.post("/compilar", content=cuerpo)
                self.assertEqual(respuesta.status_code, 422)
                self.assertEqual(respuesta.json()["diagnosticos"][0]["etapa"], "peticion")
        with self.cliente.websocket_connect("/ejecutar") as websocket:
            websocket.send_text("{")
            evento = websocket.receive_json()
            self.assertEqual(evento["tipo"], "error")
            self.assertEqual(evento["diagnosticos"][0]["etapa"], "protocolo")
        with self.cliente.websocket_connect("/ejecutar") as websocket:
            iniciar(websocket, {"version": 1, "instrucciones": [{"operacion": "saltar", "resultado": "%L1",
                                                                  "linea": 3, "columna": 2}]})
            evento = websocket.receive_json()
            self.assertEqual(evento["tipo"], "error")
            diagnostico = evento["diagnosticos"][0]
            self.assertEqual((diagnostico["etapa"], diagnostico["linea"], diagnostico["columna"]),
                             ("intermedio", 3, 2))

    def test_tamanos_en_bytes(self):
        # Un comentario de tamaño exacto evita que el número de tokens influya en la prueba.
        codigo = "# " + "é" * (api.MAX_CODIGO // 2 - 1)
        self.assertEqual(self.compilar(codigo)["instrucciones"], [])
        respuesta = self.cliente.post("/compilar", json={"codigo": codigo + "!"})
        self.assertEqual(respuesta.status_code, 413)
        respuesta = self.cliente.post("/compilar", content=b" " * api.MAX_MENSAJE + b"{}")
        self.assertEqual(respuesta.status_code, 413)
        with self.cliente.websocket_connect("/ejecutar") as websocket:
            websocket.send_text("é" * (api.MAX_MENSAJE // 2 + 1))
            self.assertIn("1 MiB", websocket.receive_json()["diagnosticos"][0]["mensaje"])

    def test_limite_de_salida(self):
        texto = "é" * 4096
        programa = self.compilar(f'repetir 9 veces\nmostrar "{texto}"\nfin\n')
        with self.cliente.websocket_connect("/ejecutar") as websocket:
            iniciar(websocket, programa)
            for _ in range(8):
                self.assertEqual(websocket.receive_json(), {"tipo": "salida", "texto": texto})
            evento = websocket.receive_json()
            self.assertEqual(evento["tipo"], "error")
            self.assertIn("64 KiB de salida", evento["diagnosticos"][0]["mensaje"])

    def test_plazos_y_ciclo_infinito(self):
        programa = self.compilar(PREGUNTA)
        with patch.object(api, "PLAZO_RESPUESTA", 0.05):
            with self.cliente.websocket_connect("/ejecutar") as websocket:
                iniciar(websocket, programa)
                self.assertEqual(websocket.receive_json()["tipo"], "pregunta")
                self.assertIn("responder", websocket.receive_json()["diagnosticos"][0]["mensaje"])
        programa = self.compilar(CICLO)
        plazo = 8 if sys.platform == "linux" else 1
        with patch.object(api, "PLAZO_SESION", plazo):
            with self.cliente.websocket_connect("/ejecutar") as websocket:
                iniciar(websocket, programa)
                evento = websocket.receive_json()
                self.assertEqual(evento["tipo"], "error")
                diagnostico = evento["diagnosticos"][0]
                self.assertEqual(diagnostico["etapa"], "limite")
                esperado = "recursos" if sys.platform == "linux" else "plazo total"
                self.assertIn(esperado, diagnostico["mensaje"])

    def test_origenes_y_limites_por_ip(self):
        for origen, permitido in ((ORIGEN, True), ("https://otro.example", False)):
            respuesta = self.cliente.options("/compilar", headers={"Origin": origen,
                                                "Access-Control-Request-Method": "POST"})
            self.assertEqual(respuesta.headers.get("Access-Control-Allow-Origin"), origen if permitido else None)
        respuesta = self.cliente.post("/compilar", json={}, headers={"Origin": "https://otro.example"})
        self.assertEqual(respuesta.status_code, 403)
        with self.assertRaises(WebSocketDenialResponse) as rechazo:
            with self.cliente.websocket_connect("/ejecutar", headers={"Origin": "https://otro.example"}):
                self.fail("Se aceptó un origen ajeno")
        self.assertEqual(rechazo.exception.status_code, 403)

        with patch.object(api, "monotonic", return_value=42):
            for _ in range(120):
                self.assertEqual(self.cliente.post("/compilar", json={}).status_code, 422)
            self.assertEqual(self.cliente.post("/compilar", json={}).status_code, 429)
            self.assertEqual(self.cliente.post("/compilar", json={}, headers={"ip-de-prueba": "192.0.2.1"}).status_code,
                             422)
        with patch.object(api, "monotonic", return_value=102):
            self.assertEqual(self.cliente.post("/compilar", json={}).status_code, 422)
        for _ in range(10):
            with self.cliente.websocket_connect("/ejecutar") as websocket:
                websocket.send_json({})
                self.assertEqual(websocket.receive_json()["tipo"], "error")
        with self.assertRaises(WebSocketDenialResponse) as rechazo:
            with self.cliente.websocket_connect("/ejecutar"):
                self.fail("Se aceptó una undécima apertura")
        self.assertEqual(rechazo.exception.status_code, 429)

    def test_saturacion_de_compilacion(self):
        cupos_llenos = Event()
        liberar = Event()
        solicitudes = []

        async def bloquear_compilacion(codigo):
            solicitudes.append(codigo)
            if len(solicitudes) == 2:
                cupos_llenos.set()
            while not liberar.is_set():
                await asyncio.sleep(0.01)
            return {"version": 1, "instrucciones": []}

        with patch.object(api, "compilar_en_proceso", bloquear_compilacion), ThreadPoolExecutor(2) as hilos:
            pendientes = [hilos.submit(self.cliente.post, "/compilar", json={"codigo": ""}) for _ in range(2)]
            try:
                self.assertTrue(cupos_llenos.wait(3))
                self.assertEqual(self.cliente.post("/compilar", json={"codigo": ""}).status_code, 503)
                with self.cliente.websocket_connect("/ejecutar") as websocket:
                    iniciar(websocket, {"version": 1, "instrucciones": []})
                    self.assertEqual(websocket.receive_json(), {"tipo": "fin"})
            finally:
                liberar.set()
            self.assertEqual([futuro.result(3).status_code for futuro in pendientes], [200, 200])

    def test_saturacion_de_ejecucion(self):
        programa = self.compilar(PREGUNTA)
        with ExitStack() as sesiones:
            for i in range(4):
                websocket = sesiones.enter_context(self.cliente.websocket_connect(
                    "/ejecutar", headers={"ip-de-prueba": f"192.0.2.{i}"}))
                iniciar(websocket, programa)
                self.assertEqual(websocket.receive_json()["tipo"], "pregunta")
            for ip, estado in (("192.0.2.0", 429), ("192.0.2.4", 503)):
                with self.assertRaises(WebSocketDenialResponse) as rechazo:
                    with self.cliente.websocket_connect("/ejecutar", headers={"ip-de-prueba": ip}):
                        self.fail("Se aceptó una ejecución sin cupo")
                self.assertEqual(rechazo.exception.status_code, estado)
            self.assertEqual(self.compilar("")["instrucciones"], [])

    def test_desconexion_de_websocket_recoge_el_proceso(self):
        for codigo in (PREGUNTA, 'mostrar "listo"\n' + CICLO):
            with self.subTest(codigo=codigo):
                programa = self.compilar(codigo)
                original = api.subprocesso
                terminado = Event()
                procesos = []

                @asynccontextmanager
                async def registrar(modo):
                    try:
                        async with original(modo) as proceso:
                            procesos.append(proceso)
                            yield proceso
                    finally:
                        terminado.set()

                with patch.object(api, "subprocesso", registrar):
                    with self.cliente.websocket_connect("/ejecutar") as websocket:
                        iniciar(websocket, programa)
                        self.assertIn(websocket.receive_json()["tipo"], ("pregunta", "salida"))
                    self.assertTrue(terminado.wait(3))
                    self.assertIsNotNone(procesos[0].returncode)


class PruebasSupervisor(unittest.IsolatedAsyncioTestCase):
    async def comprobar_compilacion_interrumpida(self, desconectar):
        app = api.crear_app()
        mensajes = asyncio.Queue()
        mensajes.put_nowait({"type": "http.request", "body": b'{"codigo":""}'})
        enviados = []
        procesos = []
        listo = asyncio.Event()

        async def enviar(evento):
            enviados.append(evento)

        async def compilar_sin_entregar_codigo(_codigo):
            async with api.subprocesso("compilar") as proceso:
                procesos.append(proceso)
                listo.set()
                await api.recibir(proceso)

        scope = {"type": "http", "method": "POST", "path": "/compilar", "headers": [], "query_string": b""}
        plazo = 5 if desconectar else 1
        with patch.object(api, "compilar_en_proceso", compilar_sin_entregar_codigo), \
                patch.object(api, "PLAZO_COMPILACION", plazo):
            peticion = asyncio.create_task(app(scope, mensajes.get, enviar))
            try:
                await asyncio.wait_for(listo.wait(), timeout=3)
                if desconectar:
                    mensajes.put_nowait({"type": "http.disconnect"})
                await asyncio.wait_for(peticion, timeout=3)
            finally:
                if not peticion.done():
                    peticion.cancel()
                    await asyncio.gather(peticion, return_exceptions=True)
        self.assertIsNotNone(procesos[0].returncode)
        self.assertEqual(enviados[0]["status"], 499 if desconectar else 504)

    async def test_desconexion_http_recoge_el_proceso(self):
        await self.comprobar_compilacion_interrumpida(desconectar=True)

    async def test_plazo_de_compilacion_recoge_el_proceso(self):
        await self.comprobar_compilacion_interrumpida(desconectar=False)

    @unittest.skipUnless(sys.platform == "linux", "límites de recursos de Linux")
    def test_limites_del_kernel(self):
        comando = """
            import json, resource
            from web.proceso_edu import limitar_recursos
            limitar_recursos()
            print(json.dumps([resource.getrlimit(resource.RLIMIT_AS), resource.getrlimit(resource.RLIMIT_CPU)]))
        """
        resultado = subprocess.check_output([sys.executable, "-c", dedent(comando)], cwd=RAIZ / "src")
        memoria = 256 * 1024 * 1024
        self.assertEqual(json.loads(resultado), [[memoria, memoria], [2, 2]])
