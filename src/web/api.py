"""API anónima de compilación y ejecución de programas .edu."""

import asyncio
import json
import logging
import os
import signal
from collections import Counter, deque
from dataclasses import asdict
from ipaddress import ip_address
from time import monotonic
from typing import Any, Literal

from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, StrictStr, ValidationError
from starlette.requests import ClientDisconnect

from lenguaje.diagnostico import Diagnostico

from .proceso_edu import MAX_CODIGO, MAX_MENSAJE
from .supervisor_edu import ProcesoFallido, comprobar_fin, enviar, recibir, subprocesso, vigilar


PLAZO_COMPILACION = 5
PLAZO_RESPUESTA = 30
PLAZO_SESION = 120
MAX_COMPILACIONES = 2
MAX_EJECUCIONES = 4
TASA_COMPILACIONES = 120
TASA_APERTURAS = 10
LOG = logging.getLogger("uvicorn.error.edu")


class SolicitudCompilacion(BaseModel):
    codigo: StrictStr


class Inicio(BaseModel):
    tipo: Literal["iniciar"]
    intermedio: dict[str, Any]


class Respuesta(BaseModel):
    tipo: Literal["respuesta"]
    texto: StrictStr


class FalloAPI(Exception):
    def __init__(self, estado, etapa, mensaje):
        self.estado = estado
        self.diagnosticos = {"diagnosticos": [asdict(Diagnostico(etapa, mensaje))]}

    def respuesta(self):
        cabeceras = {"Retry-After": "60"} if self.estado == 429 else None
        return JSONResponse(self.diagnosticos, status_code=self.estado, headers=cabeceras)


class TasaPorIP:
    def __init__(self, maximo):
        self.maximo = maximo
        self.historial = deque()
        self.conteos = Counter()

    def registrar(self, ip):
        ahora = monotonic()
        while self.historial and self.historial[0][0] <= ahora - 60:
            _, anterior = self.historial.popleft()
            self.conteos[anterior] -= 1
            if not self.conteos[anterior]:
                del self.conteos[anterior]
        if self.conteos[ip] >= self.maximo:
            raise FalloAPI(429, "limite", "Se superó el límite de solicitudes por minuto para esta IP.")
        self.historial.append((ahora, ip))
        self.conteos[ip] += 1


def ip_de(conexion):
    if os.getenv("RENDER") == "true":
        valores = conexion.headers.getlist("cf-connecting-ip")
        if len(valores) == 1 and "%" not in valores[0]:
            try:
                return str(ip_address(valores[0].strip(" \t")))
            except ValueError:
                pass
    return conexion.client.host if conexion.client else "desconocida"


def verificar_origen(conexion, origenes):
    enviados = conexion.headers.getlist("origin")
    if enviados and (len(enviados) != 1 or enviados[0] not in origenes):
        raise FalloAPI(403, "protocolo", "Origen web no permitido.")


def const_no_json(valor):
    raise ValueError(valor)


def validar_mensaje(datos, modelo, etapa, mensaje):
    try:
        objeto = json.loads(datos, parse_constant=const_no_json)
    except (ValueError, RecursionError):
        raise FalloAPI(422, etapa, "Se esperaba un mensaje JSON válido en UTF-8.") from None
    try:
        return modelo.model_validate(objeto)
    except ValidationError:
        raise FalloAPI(422, etapa, mensaje) from None


def excede_mensaje():
    return FalloAPI(413, "limite", "Se superó el límite de 1 MiB por mensaje.")


async def leer_cuerpo(peticion):
    cuerpo = bytearray()
    async for parte in peticion.stream():
        if len(cuerpo) + len(parte) > MAX_MENSAJE:
            raise excede_mensaje()
        cuerpo.extend(parte)
    try:
        return cuerpo.decode("utf-8")
    except UnicodeError:
        raise FalloAPI(422, "peticion", "Se esperaba un cuerpo JSON en UTF-8.") from None


async def esperar_desconexion(peticion):
    while (await peticion.receive())["type"] != "http.disconnect":
        pass
    raise ClientDisconnect()


async def compilar_en_proceso(codigo):
    async with subprocesso("compilar") as proceso:
        await enviar(proceso, codigo)
        datos = await recibir(proceso)
        await comprobar_fin(proceso)
        return datos


async def leer_websocket(websocket, modelo, mensaje):
    evento = await websocket.receive()
    if evento["type"] == "websocket.disconnect":
        raise WebSocketDisconnect(evento["code"])
    texto = evento.get("text")
    if texto is None:
        if len(evento.get("bytes") or b"") > MAX_MENSAJE:
            raise excede_mensaje()
        raise FalloAPI(422, "protocolo", "Se esperaba un mensaje de texto JSON.")
    if len(texto.encode("utf-8")) > MAX_MENSAJE:
        raise excede_mensaje()
    return validar_mensaje(texto, modelo, "protocolo", mensaje)


class Sesion:
    def __init__(self, websocket):
        self.websocket = websocket
        self.respuesta = None

    async def recibir_respuestas(self):
        while True:
            respuesta = await leer_websocket(self.websocket, Respuesta,
                                             "Se esperaba una respuesta con texto.")
            if self.respuesta is None or self.respuesta.done():
                raise FalloAPI(422, "protocolo", "No hay una pregunta pendiente.")
            self.respuesta.set_result(respuesta.texto)

    async def ejecutar(self, intermedio):
        async with subprocesso("ejecutar") as proceso:
            await self.enviar_datos(proceso, intermedio)
            while True:
                evento = await recibir(proceso)
                tipo = evento["tipo"]
                if tipo == "pregunta":
                    await self.preguntar(proceso, evento)
                    continue
                terminal = tipo in ("fin", "error")
                if terminal:
                    await comprobar_fin(proceso)
                await self.websocket.send_json(evento)
                if terminal:
                    return tipo

    async def preguntar(self, proceso, evento):
        self.respuesta = asyncio.get_running_loop().create_future()
        try:
            await self.websocket.send_json(evento)
            texto = await asyncio.wait_for(self.respuesta, PLAZO_RESPUESTA)
        except asyncio.TimeoutError:
            raise FalloAPI(504, "limite", "Se agotó el plazo para responder la pregunta.") from None
        finally:
            self.respuesta = None
        await self.enviar_datos(proceso, texto)

    async def enviar_datos(self, proceso, datos):
        try:
            await enviar(proceso, datos)
        except (ValueError, RecursionError):
            raise FalloAPI(422, "protocolo", "El mensaje contiene valores JSON no admitidos.") from None


async def ejecutar_sesion(websocket):
    inicio = await leer_websocket(websocket, Inicio, "Se esperaba iniciar con el código intermedio.")
    sesion = Sesion(websocket)
    return await vigilar(sesion.ejecutar(inicio.intermedio), sesion.recibir_respuestas())


def fallo_del_proceso(error):
    codigo = error.codigo if isinstance(error, ProcesoFallido) else None
    LOG.warning("Subproceso fallido estado=%s", codigo)
    if os.name == "posix" and codigo == -signal.SIGKILL:
        return FalloAPI(504, "limite", "El subproceso superó su límite de recursos.")
    return FalloAPI(500, "servicio", "El subproceso terminó sin completar la operación.")


def crear_app(origenes=()):
    app = FastAPI(title="API del lenguaje educativo")
    origenes = tuple(origenes)
    app.add_middleware(CORSMiddleware, allow_origins=list(origenes), allow_methods=["POST"],
                       allow_headers=["Content-Type"])
    compilaciones = asyncio.Semaphore(MAX_COMPILACIONES)
    ejecuciones = asyncio.Semaphore(MAX_EJECUCIONES)
    tasa_compilaciones = TasaPorIP(TASA_COMPILACIONES)
    tasa_aperturas = TasaPorIP(TASA_APERTURAS)
    ips_en_ejecucion = set()

    @app.post("/compilar", openapi_extra={"requestBody": {"required": True, "content": {
        "application/json": {"schema": SolicitudCompilacion.model_json_schema()},
    }}})
    async def compilar(peticion: Request):
        inicio = monotonic()
        estado = 500
        fallo = None
        try:
            verificar_origen(peticion, origenes)
            tasa_compilaciones.registrar(ip_de(peticion))
            solicitud = validar_mensaje(await leer_cuerpo(peticion), SolicitudCompilacion,
                                        "peticion", "Se esperaba el campo de texto 'codigo'.")
            try:
                longitud = len(solicitud.codigo.encode("utf-8"))
            except UnicodeError:
                raise FalloAPI(422, "peticion", "El código debe ser texto UTF-8 válido.") from None
            if longitud > MAX_CODIGO:
                raise FalloAPI(413, "limite", "Se superó el límite de 64 KiB de código fuente.")
            if compilaciones.locked():
                raise FalloAPI(503, "servicio", "No hay cupos de compilación disponibles.")
            async with compilaciones:
                datos = await asyncio.wait_for(vigilar(compilar_en_proceso(solicitud.codigo),
                                                       esperar_desconexion(peticion)), PLAZO_COMPILACION)
            estado = 422 if "diagnosticos" in datos else 200
            return JSONResponse(datos, status_code=estado)
        except ClientDisconnect:
            estado = 499
            return Response(status_code=estado)
        except asyncio.TimeoutError:
            fallo = FalloAPI(504, "limite", "Se agotó el plazo de compilación.")
        except (OSError, ProcesoFallido) as error:
            fallo = fallo_del_proceso(error)
        except FalloAPI as error:
            fallo = error
        finally:
            if fallo is not None:
                estado = fallo.estado
            LOG.info("compilar estado=%s duracion_ms=%.0f", estado, (monotonic() - inicio) * 1000)
        return fallo.respuesta()

    @app.websocket("/ejecutar")
    async def ejecutar_websocket(websocket: WebSocket):
        inicio = monotonic()
        ip = ip_de(websocket)
        estado = "fallo"
        fallo = None
        try:
            try:
                verificar_origen(websocket, origenes)
                tasa_aperturas.registrar(ip)
                if ip in ips_en_ejecucion:
                    raise FalloAPI(429, "limite", "Esta IP ya tiene una ejecución activa.")
                if ejecuciones.locked():
                    raise FalloAPI(503, "servicio", "No hay cupos de ejecución disponibles.")
            except FalloAPI as error:
                estado = error.estado
                await websocket.send_denial_response(error.respuesta())
                return

            ips_en_ejecucion.add(ip)
            try:
                async with ejecuciones:
                    await websocket.accept()
                    estado = await asyncio.wait_for(ejecutar_sesion(websocket), PLAZO_SESION)
            except asyncio.TimeoutError:
                fallo = FalloAPI(504, "limite", "Se agotó el plazo total de la sesión.")
            except ProcesoFallido as error:
                fallo = fallo_del_proceso(error)
            except FalloAPI as error:
                fallo = error
            finally:
                ips_en_ejecucion.remove(ip)

            if fallo is not None:
                estado = fallo.estado
                await websocket.send_json({"tipo": "error", **fallo.diagnosticos})
            await websocket.close()
        except (OSError, WebSocketDisconnect):
            estado = "desconexion"
        finally:
            LOG.info("ejecutar estado=%s duracion_ms=%.0f", estado, (monotonic() - inicio) * 1000)

    return app


app = crear_app(tuple(origen.strip() for origen in os.getenv("EDU_ORIGENES", "").split(",") if origen.strip()))
