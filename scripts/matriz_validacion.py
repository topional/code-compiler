"""Ejecuta el plan de validación y escribe la matriz de casos en la documentación.

Requiere `make generar` y las dependencias de `requirements.txt`. Uso, desde la
raíz del repositorio:
    .venv/bin/python scripts/matriz_validacion.py

Actualiza la tabla entre los marcadores `<!-- matriz:inicio -->` y
`<!-- matriz:fin -->` de docs/plan_validacion.md (casos y resultado esperado) y
de docs/resultados_validacion.md (resultado real). Termina con código 1 si algún
caso falla o no tiene descripción en el catálogo.
"""

import os
import re
import subprocess
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
PYTHON = sys.executable
ENTORNO = {**os.environ, "PYTHONIOENCODING": "utf-8"}

ETAPAS = {
    "lexer": ("LEX", "Análisis léxico", "Análisis léxico correcto.", "Error léxico en "),
    "gramatica": ("SIN", "Análisis sintáctico", "Análisis sintáctico correcto.", "Error sintáctico en "),
    "semantica": ("SEM", "Análisis semántico", "Análisis semántico correcto.", "Error semántico en "),
}

# Qué comprueba cada entrada .edu, por etapa y nombre de archivo.
ENTRADAS = {
    "lexer": {
        "comentarios_y_espacios": "Comentarios, tabulaciones, `\\r\\n`, líneas vacías y `#` dentro de un texto.",
        "literales_y_signos": "Textos con escapes, decimales, signos y paréntesis.",
        "mayusculas_mezcladas": "Palabras reservadas escritas con mayúsculas y minúsculas mezcladas.",
        "palabras_reservadas": "Las 40 palabras reservadas del lenguaje.",
        "palabras_y_nombres": "Identificadores que contienen palabras reservadas, tildes, `ñ` y guion bajo.",
        "caracter": "Carácter sin regla (`@`).",
        "escape_desconocido": "Escape no admitido dentro de un texto (`\\q`).",
        "numero_con_punto_final": "Número terminado en punto (`5.`).",
        "numero_mal_formado": "Número con dos puntos decimales (`1.2.3`).",
        "punto_y_coma": "Signo que no pertenece al lenguaje (`;`).",
        "texto_sin_cerrar": "Texto sin comilla de cierre.",
    },
    "gramatica": {
        "bloques_anidados": "Condicionales y repeticiones anidados, con `sino`.",
        "construcciones": "Todas las sentencias de la gramática.",
        "precedencia_y_logica": "Precedencia aritmética, comparaciones y operadores lógicos.",
        "sin_salto_final": "Última línea sin salto.",
        "vacio": "Archivo vacío.",
        "asignacion_sin_valor": "Asignación sin `valor de`.",
        "comparacion_encadenada": "Dos comparaciones seguidas sin `y`.",
        "condicional_sin_fin": "Bloque `si` sin `fin`.",
        "dos_instrucciones_en_una_linea": "Dos instrucciones en la misma línea.",
        "entrada_con_y": "Sintaxis antigua `preguntar ... y guardar`.",
        "expresion_incompleta": "Suma sin operando derecho.",
        "funcion_sin_parentesis": "Definición con la sintaxis antigua `con`, sin paréntesis.",
        "limite_con_expresion": "Límite aleatorio escrito como expresión (`1 + 1`).",
        "parentesis_sin_cerrar": "Paréntesis sin cerrar.",
        "sino_sin_si": "`sino` sin un `si` que lo abra.",
    },
    "semantica": {
        "condiciones_ciclos_y_rangos": "Condiciones lógicas, ciclos y rangos válidos.",
        "funciones_y_comparaciones": "Funciones y comparaciones con tipos correctos.",
        "programa_completo": "Declaraciones, parámetros, ámbitos y usos de variables.",
        "ramas_y_valores_desconocidos": "Inicialización en todas las ramas y valores que solo se conocen al ejecutar.",
        "aleatorios": "Rango aleatorio con decimales, invertido o con texto.",
        "ambito_local": "Variable usada fuera del bloque que la declara.",
        "comparaciones": "Comparación entre tipos incompatibles.",
        "condiciones": "Condición de `si` o `mientras` que no es lógica.",
        "funciones_duplicadas_y_sin_retorno": "Función duplicada, falta de retorno y tipo de retorno incompatible.",
        "funciones_y_retornos": "Función no declarada, argumentos incorrectos y retorno fuera de una función.",
        "inicializacion_en_ramas": "Variable inicializada solo en una rama.",
        "operaciones": "Operaciones aritméticas y lógicas con tipos incompatibles.",
        "repeticiones": "Cantidad de repeticiones negativa, decimal o de texto.",
        "tipo_incompatible": "Asignación de texto a una variable numérica.",
        "tipos_en_ramas": "Tipos distintos asignados en ramas diferentes.",
        "variable_duplicada": "Variable declarada dos veces en el mismo ámbito.",
        "variable_no_declarada": "Variable usada sin declarar.",
        "variable_sin_inicializar": "Variable leída sin valor.",
    },
}

# Pruebas unittest: prefijo de ID, archivo y qué comprueba cada una.
PRUEBAS = {
    "test_interprete": ("GEN", "Generación y ejecución", {
        "test_factorial_exportado_y_ejecutado": "Función recursiva: JSON generado y factorial de 5 = 120.",
        "test_ciclos_y_aleatorios": "`repetir`, `mientras` y números aleatorios dentro del rango.",
        "test_ambitos_anidados_en_activaciones_recursivas": "Cada llamada recursiva tiene sus propias variables.",
        "test_entrada_con_reintentos_y_salida_utf8": "`preguntar` repite la pregunta si el tipo no corresponde; salida con tildes.",
        "test_errores_de_ejecucion_con_ubicacion": "Los errores de ejecución indican línea y columna.",
        "test_json_invalido": "El intérprete rechaza un JSON mal formado.",
        "test_compilacion_fallida_no_escribe_la_salida": "Un programa con errores no deja un JSON.",
        "test_salida_protege_fuente_y_requiere_etapa_intermedio": "`--salida` no sobrescribe el `.edu` y exige `--etapa intermedio`.",
    }),
    "test_programas": ("PRG", "Programas completos", {
        "test_basico": "`examples/basico.edu`: variables, decisiones y repeticiones; salida exacta.",
        "test_principal_adivina_el_numero": "`examples/principal.edu`: adivina el número con funciones, aleatorios, entrada y ciclos.",
        "test_avanzado": "`examples/avanzado.edu`: recursión, funciones lógicas y ciclos anidados; salida exacta.",
        "test_calculadora": "`examples/calculadora.edu`: suma 8 + 5 = 13.",
        "test_piedra_papel_tijera": "`examples/piedra_papel_tijera.edu`: una partida termina con un resultado.",
        "test_con_errores_no_genera_codigo": "`examples/con_errores.edu`: 7 errores semánticos y ningún JSON.",
    }),
    "test_api": ("API", "Integración con la API web", {
        "test_seleccion_de_ip": "La IP del cliente se toma de la conexión, no de cabeceras.",
        "test_factorial": "Compilar por HTTP y ejecutar por WebSocket un factorial.",
        "test_calculadora_pide_datos_y_reintenta": "Ejecución interactiva con preguntas y reintentos.",
        "test_diagnosticos_del_compilador": "La API devuelve los diagnósticos con su etapa y ubicación.",
        "test_division_por_cero_con_ubicacion": "Error de ejecución con línea y columna.",
        "test_json_y_protocolo_invalidos": "Rechazo de mensajes JSON o de protocolo inválidos.",
        "test_tamanos_en_bytes": "Límites de tamaño de la fuente y de los mensajes.",
        "test_limite_de_salida": "Límite de la salida de un programa.",
        "test_plazos_y_ciclo_infinito": "Plazos de respuesta y detención de un ciclo infinito.",
        "test_origenes_y_limites_por_ip": "Orígenes permitidos y límite de solicitudes por IP.",
        "test_saturacion_de_compilacion": "Rechazo ordenado cuando no quedan cupos de compilación.",
        "test_saturacion_de_ejecucion": "Rechazo ordenado cuando no quedan cupos de ejecución.",
        "test_desconexion_de_websocket_recoge_el_proceso": "Al cerrar el WebSocket se termina el subproceso.",
        "test_desconexion_http_recoge_el_proceso": "Al cortar la conexión HTTP se termina el subproceso.",
        "test_plazo_de_compilacion_recoge_el_proceso": "Una compilación que excede el plazo se detiene.",
        "test_limites_del_kernel": "Límites de memoria y CPU del sistema operativo (solo Linux).",
    }),
}


def ejecutar(*argumentos):
    return subprocess.run([PYTHON, *argumentos], cwd=RAIZ, capture_output=True,
                          encoding="utf-8", env=ENTORNO)


def casos_por_etapa():
    filas = []
    for etapa, (prefijo, componente, confirmacion, error) in ETAPAS.items():
        numero = 0
        for clase in ("validos", "invalidos"):
            for archivo in sorted((RAIZ / "tests" / etapa / clase).glob("*.edu")):
                numero += 1
                resultado = ejecutar("src/main.py", str(archivo.relative_to(RAIZ)), "--etapa", etapa)
                errores = resultado.stderr.splitlines()
                if clase == "validos":
                    esperado = "Aceptado"
                    pasa = resultado.returncode == 0 and not errores and confirmacion in resultado.stdout
                    real = "Aceptado" if pasa else f"Rechazado: {errores[0] if errores else resultado.returncode}"
                else:
                    esperado = error.removesuffix(" en ")
                    pasa = (resultado.returncode == 1 and not resultado.stdout and errores
                            and all(linea.startswith(error) for linea in errores))
                    real = errores[0].split(":")[0] + ":" + errores[0].split(":")[1] if errores else "Aceptado"
                    if len(errores) > 1:
                        real += f" (+{len(errores) - 1})"
                filas.append({
                    "id": f"{prefijo}{numero:02d}", "componente": componente,
                    "caso": ENTRADAS[etapa].get(archivo.stem), "entrada": f"`tests/{etapa}/{clase}/{archivo.name}`",
                    "esperado": esperado, "real": real, "pasa": pasa,
                })
    return filas


def casos_de_derivaciones():
    resultado = ejecutar("scripts/verificar_derivaciones.py")
    resumen = resultado.stdout.strip().splitlines()[-1]
    return [{
        "id": "DER01", "componente": "Derivaciones",
        "caso": "Las derivaciones por la izquierda de `docs/derivaciones.md` coinciden con el árbol del parser.",
        "entrada": "`scripts/verificar_derivaciones.py`", "esperado": "Todas coinciden",
        "real": resumen.rstrip("."), "pasa": resultado.returncode == 0,
    }]


def casos_unittest():
    resultado = ejecutar("-m", "unittest", "discover", "-s", "tests", "-v")
    estados = {}
    for linea in resultado.stderr.splitlines():
        coincidencia = re.match(r"(test_\w+) \((\w+)\.\w+\.test_\w+\) \.\.\. (.+)", linea)
        if coincidencia:
            estados[(coincidencia[2], coincidencia[1])] = coincidencia[3]
    filas = []
    for modulo, (prefijo, componente, pruebas) in PRUEBAS.items():
        for numero, (prueba, caso) in enumerate(pruebas.items(), 1):
            estado = estados.get((modulo, prueba), "no ejecutada")
            if estado == "ok":
                real, pasa = "Correcta", True
            elif estado.startswith("skipped"):
                real, pasa = "Omitida: requiere Linux", True
            else:
                real, pasa = estado, False
            filas.append({
                "id": f"{prefijo}{numero:02d}", "componente": componente, "caso": caso,
                "entrada": f"`tests/{modulo}.py::{prueba}`", "esperado": "Correcta", "real": real, "pasa": pasa,
            })
    sin_catalogo = {clave for clave in estados if clave[1] not in PRUEBAS.get(clave[0], ("", "", {}))[2]}
    return filas, sin_catalogo


def tabla(filas, columnas):
    encabezados = {"id": "ID", "componente": "Componente", "caso": "Caso", "entrada": "Entrada",
                   "esperado": "Resultado esperado", "real": "Resultado real", "estado": "Estado"}
    lineas = ["| " + " | ".join(encabezados[c] for c in columnas) + " |",
              "| " + " | ".join("---" for _ in columnas) + " |"]
    for fila in filas:
        fila = {**fila, "estado": "Pasa" if fila["pasa"] else "**Falla**"}
        lineas.append("| " + " | ".join(str(fila[c]) for c in columnas) + " |")
    return "\n".join(lineas)


def reemplazar(ruta, contenido):
    texto = ruta.read_text(encoding="utf-8")
    nuevo, cambios = re.subn(r"(<!-- matriz:inicio -->\n).*?(<!-- matriz:fin -->)",
                             lambda m: m[1] + contenido + "\n" + m[2], texto, flags=re.S)
    if cambios != 1:
        sys.exit(f"Faltan los marcadores de la matriz en {ruta}")
    ruta.write_text(nuevo, encoding="utf-8", newline="\n")


def main():
    filas = casos_por_etapa() + casos_de_derivaciones()
    filas_unittest, sin_catalogo = casos_unittest()
    filas += filas_unittest
    sin_descripcion = [f["entrada"] for f in filas if f["caso"] is None]

    reemplazar(RAIZ / "docs" / "plan_validacion.md",
               tabla(filas, ("id", "componente", "caso", "entrada", "esperado")))
    reemplazar(RAIZ / "docs" / "resultados_validacion.md",
               tabla(filas, ("id", "caso", "esperado", "real", "estado")))

    fallos = [f["id"] for f in filas if not f["pasa"]]
    print(f"{len(filas)} casos: {len(filas) - len(fallos)} pasan y {len(fallos)} fallan.")
    for problema, lista in (("Fallan", fallos), ("Sin descripción", sin_descripcion),
                            ("Pruebas sin catálogo", sorted(sin_catalogo))):
        if lista:
            print(f"{problema}: {', '.join(map(str, lista))}")
    return 1 if fallos or sin_descripcion or sin_catalogo else 0


if __name__ == "__main__":
    sys.exit(main())
