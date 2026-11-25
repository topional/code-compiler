"""Supervisa la vida de los procesos y la desconexión de sus clientes."""

import asyncio
import json
import sys
from contextlib import asynccontextmanager, suppress
from pathlib import Path

from .proceso_edu import MAX_MENSAJE, codificar


DIRECTORIO_SRC = Path(__file__).resolve().parents[1]
MAX_RESULTADO = 16 * MAX_MENSAJE


class ProcesoFallido(Exception):
    def __init__(self, codigo):
        self.codigo = codigo


async def completar_limpieza(operacion):
    # Una segunda cancelación no debe interrumpir la recogida del hijo.
    limpieza = asyncio.ensure_future(operacion)
    cancelacion = None
    while not limpieza.done():
        try:
            await asyncio.shield(limpieza)
        except asyncio.CancelledError as error:
            cancelacion = error
    limpieza.result()
    if cancelacion is not None:
        raise cancelacion


async def recoger(proceso):
    if proceso.returncode is None:
        with suppress(ProcessLookupError):
            proceso.kill()
    proceso.stdin.close()
    while await proceso.stdout.read(64 * 1024):
        pass
    await proceso.wait()


async def recoger_al_iniciar(inicio):
    with suppress(OSError):
        await recoger(await inicio)


@asynccontextmanager
async def subprocesso(modo):
    limite = MAX_RESULTADO if modo == "compilar" else MAX_MENSAJE
    inicio = asyncio.create_task(asyncio.create_subprocess_exec(
        sys.executable, "-B", "-m", "web.proceso_edu", modo, cwd=DIRECTORIO_SRC,
        stdin=asyncio.subprocess.PIPE,
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.DEVNULL, limit=limite,
    ))
    try:
        proceso = await asyncio.shield(inicio)
    except asyncio.CancelledError:
        await completar_limpieza(recoger_al_iniciar(inicio))
        raise
    except OSError:
        raise ProcesoFallido(None) from None
    try:
        yield proceso
    finally:
        await completar_limpieza(recoger(proceso))


async def enviar(proceso, datos):
    proceso.stdin.write(codificar(datos) + b"\n")
    try:
        await proceso.stdin.drain()
    except (BrokenPipeError, ConnectionResetError):
        # La salida todavía puede contener el diagnóstico que cerró el proceso.
        pass


async def recibir(proceso):
    try:
        linea = await proceso.stdout.readline()
        if linea.endswith(b"\n"):
            return json.loads(linea)
    except ValueError:
        raise ProcesoFallido(None) from None
    raise ProcesoFallido(await proceso.wait())


async def comprobar_fin(proceso):
    codigo = await proceso.wait()
    if codigo:
        raise ProcesoFallido(codigo)


async def vigilar(operacion, monitor):
    tareas = [asyncio.create_task(coro) for coro in (monitor, operacion)]
    try:
        completadas, _ = await asyncio.wait(tareas, return_when=asyncio.FIRST_COMPLETED)
        return await (tareas[0] if tareas[0] in completadas else tareas[1])
    finally:
        for tarea in tareas:
            if not tarea.done():
                tarea.cancel()
        await completar_limpieza(asyncio.gather(*tareas, return_exceptions=True))
