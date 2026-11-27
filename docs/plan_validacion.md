# Plan de validación

## Objetivos

1. Comprobar que cada etapa acepta los programas correctos y rechaza los
   incorrectos con un diagnóstico de su propia etapa.
2. Cubrir con al menos una entrada cada token, cada construcción de la
   gramática y cada error semántico documentado.
3. Detectar regresiones: cualquier cambio en las gramáticas o en `src/` debe
   pasar `make test` antes de subirse al repositorio.
4. Comprobar que el código intermedio generado se exporta, se valida y produce
   la salida esperada al ejecutarlo, también desde la API web.

## Método

Las entradas `.edu` están en `tests/<etapa>/validos` y
`tests/<etapa>/invalidos`. La carpeta define el resultado esperado.
`scripts/probar_entradas.sh` ejecuta `src/main.py --etapa <etapa>` sobre cada
entrada y aplica estos criterios de aceptación:

| Clase | Criterio de aceptación |
| --- | --- |
| `validos` | Código de salida 0, stderr vacío y la confirmación de la etapa en stdout (`Análisis léxico correcto.`, `Análisis sintáctico correcto.` o `Análisis semántico correcto.`). |
| `invalidos` | Código de salida 1, stdout vacío y todas las líneas de stderr empiezan con el prefijo de la etapa (`Error léxico en`, `Error sintáctico en` o `Error semántico en`). |

Un error de otra etapa, una excepción de Python o un archivo ausente hacen
fallar la prueba. No se comparan mensajes exactos ni el número de errores.

```bash
make test                 # las tres etapas
make test GRUPO=lexer
make test GRUPO=gramatica
make test GRUPO=semantica
```

## Cobertura

| Categoría | Prefijo | Casos | Sugerido en la guía del curso | Cómo se ejecuta |
| --- | --- | --- | --- | --- |
| Análisis léxico | `LEX` | 11 | 10 | `make test GRUPO=lexer` |
| Análisis sintáctico | `SIN` | 15 | 15 | `make test GRUPO=gramatica` |
| Análisis semántico | `SEM` | 18 | 15 | `make test GRUPO=semantica` |
| Derivaciones | `DER` | 68 derivaciones en 1 caso | — | `scripts/verificar_derivaciones.py` |
| Generación y ejecución de código | `GEN` | 8 | 10 | `python -m unittest discover -s tests` |
| Programas completos | `PRG` | 6 | 5 | `python -m unittest discover -s tests` |
| Integración con la API web | `API` | 16 | 10 | `python -m unittest discover -s tests` |
| **Total** | | **75** | **65** | `scripts/matriz_validacion.py` |

Las pruebas `LEX`, `SIN` y `SEM` son aisladas: cada una revisa una etapa.
Las pruebas `GEN`, `PRG` y `API` son integrales: compilan un programa
completo, generan el código intermedio, lo ejecutan y comparan el resultado.

Las entradas léxicas cubren las 53 reglas del lexer, y las sintácticas usan las
45 reglas del parser. Cobertura de los errores de [semantica.md](semantica.md):

| Error semántico | Entrada inválida |
| --- | --- |
| Variable no declarada | `variable_no_declarada.edu`, `ambito_local.edu` |
| Declaración duplicada | `variable_duplicada.edu` |
| Variable sin inicializar | `variable_sin_inicializar.edu`, `inicializacion_en_ramas.edu` |
| Tipos incompatibles | `tipo_incompatible.edu`, `tipos_en_ramas.edu`, `operaciones.edu` |
| Condición no lógica | `condiciones.edu` |
| Cantidad de repeticiones inválida | `repeticiones.edu` |
| Rango aleatorio inválido | `aleatorios.edu` |
| Comparación incompatible | `comparaciones.edu` |
| Función no declarada | `funciones_y_retornos.edu` |
| Cantidad incorrecta de argumentos | `funciones_y_retornos.edu` |
| Tipo incorrecto de argumento | `funciones_y_retornos.edu` |
| Retorno fuera de una función | `funciones_y_retornos.edu` |
| Función duplicada | `funciones_duplicadas_y_sin_retorno.edu` |
| Tipo de retorno incompatible | `funciones_duplicadas_y_sin_retorno.edu` |
| Falta de retorno | `funciones_duplicadas_y_sin_retorno.edu` |

## Comportamiento ante errores

Un error bloqueante detiene la compilación en la etapa que lo detecta.

| Etapa | Si es válida | Si hay un error | Casos que lo comprueban |
| --- | --- | --- | --- |
| Léxica | Continúa a la sintaxis | Se detiene e informa `Error léxico` | `LEX06`–`LEX11` |
| Sintáctica | Continúa a la semántica | Se detiene e informa `Error sintáctico` | `SIN06`–`SIN15` |
| Semántica | Genera el código intermedio | Se detiene e informa `Error semántico` sin escribir el JSON | `SEM05`–`SEM18`, `GEN07`, `PRG06` |
| Generación y ejecución | Ejecuta el programa | Informa el error con su línea y columna | `GEN05`, `GEN06`, `API05` |

## Matriz de casos

Cada caso tiene un ID, la entrada que se usa y el resultado esperado. Las
entradas `.edu` de una carpeta `validos` deben aceptarse; las de `invalidos`
deben rechazarse solo con diagnósticos de su etapa. Los resultados reales de
cada caso están en [resultados_validacion.md](resultados_validacion.md).

`scripts/matriz_validacion.py` ejecuta todos los casos y regenera esta tabla y
la de resultados:

```bash
.venv/bin/python scripts/matriz_validacion.py
```

<!-- matriz:inicio -->
| ID | Componente | Caso | Entrada | Resultado esperado |
| --- | --- | --- | --- | --- |
| LEX01 | Análisis léxico | Comentarios, tabulaciones, `\r\n`, líneas vacías y `#` dentro de un texto. | `tests/lexer/validos/comentarios_y_espacios.edu` | Aceptado |
| LEX02 | Análisis léxico | Textos con escapes, decimales, signos y paréntesis. | `tests/lexer/validos/literales_y_signos.edu` | Aceptado |
| LEX03 | Análisis léxico | Palabras reservadas escritas con mayúsculas y minúsculas mezcladas. | `tests/lexer/validos/mayusculas_mezcladas.edu` | Aceptado |
| LEX04 | Análisis léxico | Las 40 palabras reservadas del lenguaje. | `tests/lexer/validos/palabras_reservadas.edu` | Aceptado |
| LEX05 | Análisis léxico | Identificadores que contienen palabras reservadas, tildes, `ñ` y guion bajo. | `tests/lexer/validos/palabras_y_nombres.edu` | Aceptado |
| LEX06 | Análisis léxico | Carácter sin regla (`@`). | `tests/lexer/invalidos/caracter.edu` | Error léxico |
| LEX07 | Análisis léxico | Escape no admitido dentro de un texto (`\q`). | `tests/lexer/invalidos/escape_desconocido.edu` | Error léxico |
| LEX08 | Análisis léxico | Número terminado en punto (`5.`). | `tests/lexer/invalidos/numero_con_punto_final.edu` | Error léxico |
| LEX09 | Análisis léxico | Número con dos puntos decimales (`1.2.3`). | `tests/lexer/invalidos/numero_mal_formado.edu` | Error léxico |
| LEX10 | Análisis léxico | Signo que no pertenece al lenguaje (`;`). | `tests/lexer/invalidos/punto_y_coma.edu` | Error léxico |
| LEX11 | Análisis léxico | Texto sin comilla de cierre. | `tests/lexer/invalidos/texto_sin_cerrar.edu` | Error léxico |
| SIN01 | Análisis sintáctico | Condicionales y repeticiones anidados, con `sino`. | `tests/gramatica/validos/bloques_anidados.edu` | Aceptado |
| SIN02 | Análisis sintáctico | Todas las sentencias de la gramática. | `tests/gramatica/validos/construcciones.edu` | Aceptado |
| SIN03 | Análisis sintáctico | Precedencia aritmética, comparaciones y operadores lógicos. | `tests/gramatica/validos/precedencia_y_logica.edu` | Aceptado |
| SIN04 | Análisis sintáctico | Última línea sin salto. | `tests/gramatica/validos/sin_salto_final.edu` | Aceptado |
| SIN05 | Análisis sintáctico | Archivo vacío. | `tests/gramatica/validos/vacio.edu` | Aceptado |
| SIN06 | Análisis sintáctico | Asignación sin `valor de`. | `tests/gramatica/invalidos/asignacion_sin_valor.edu` | Error sintáctico |
| SIN07 | Análisis sintáctico | Dos comparaciones seguidas sin `y`. | `tests/gramatica/invalidos/comparacion_encadenada.edu` | Error sintáctico |
| SIN08 | Análisis sintáctico | Bloque `si` sin `fin`. | `tests/gramatica/invalidos/condicional_sin_fin.edu` | Error sintáctico |
| SIN09 | Análisis sintáctico | Dos instrucciones en la misma línea. | `tests/gramatica/invalidos/dos_instrucciones_en_una_linea.edu` | Error sintáctico |
| SIN10 | Análisis sintáctico | Sintaxis antigua `preguntar ... y guardar`. | `tests/gramatica/invalidos/entrada_con_y.edu` | Error sintáctico |
| SIN11 | Análisis sintáctico | Suma sin operando derecho. | `tests/gramatica/invalidos/expresion_incompleta.edu` | Error sintáctico |
| SIN12 | Análisis sintáctico | Definición con la sintaxis antigua `con`, sin paréntesis. | `tests/gramatica/invalidos/funcion_sin_parentesis.edu` | Error sintáctico |
| SIN13 | Análisis sintáctico | Límite aleatorio escrito como expresión (`1 + 1`). | `tests/gramatica/invalidos/limite_con_expresion.edu` | Error sintáctico |
| SIN14 | Análisis sintáctico | Paréntesis sin cerrar. | `tests/gramatica/invalidos/parentesis_sin_cerrar.edu` | Error sintáctico |
| SIN15 | Análisis sintáctico | `sino` sin un `si` que lo abra. | `tests/gramatica/invalidos/sino_sin_si.edu` | Error sintáctico |
| SEM01 | Análisis semántico | Condiciones lógicas, ciclos y rangos válidos. | `tests/semantica/validos/condiciones_ciclos_y_rangos.edu` | Aceptado |
| SEM02 | Análisis semántico | Funciones y comparaciones con tipos correctos. | `tests/semantica/validos/funciones_y_comparaciones.edu` | Aceptado |
| SEM03 | Análisis semántico | Declaraciones, parámetros, ámbitos y usos de variables. | `tests/semantica/validos/programa_completo.edu` | Aceptado |
| SEM04 | Análisis semántico | Inicialización en todas las ramas y valores que solo se conocen al ejecutar. | `tests/semantica/validos/ramas_y_valores_desconocidos.edu` | Aceptado |
| SEM05 | Análisis semántico | Rango aleatorio con decimales, invertido o con texto. | `tests/semantica/invalidos/aleatorios.edu` | Error semántico |
| SEM06 | Análisis semántico | Variable usada fuera del bloque que la declara. | `tests/semantica/invalidos/ambito_local.edu` | Error semántico |
| SEM07 | Análisis semántico | Comparación entre tipos incompatibles. | `tests/semantica/invalidos/comparaciones.edu` | Error semántico |
| SEM08 | Análisis semántico | Condición de `si` o `mientras` que no es lógica. | `tests/semantica/invalidos/condiciones.edu` | Error semántico |
| SEM09 | Análisis semántico | Función duplicada, falta de retorno y tipo de retorno incompatible. | `tests/semantica/invalidos/funciones_duplicadas_y_sin_retorno.edu` | Error semántico |
| SEM10 | Análisis semántico | Función no declarada, argumentos incorrectos y retorno fuera de una función. | `tests/semantica/invalidos/funciones_y_retornos.edu` | Error semántico |
| SEM11 | Análisis semántico | Variable inicializada solo en una rama. | `tests/semantica/invalidos/inicializacion_en_ramas.edu` | Error semántico |
| SEM12 | Análisis semántico | Operaciones aritméticas y lógicas con tipos incompatibles. | `tests/semantica/invalidos/operaciones.edu` | Error semántico |
| SEM13 | Análisis semántico | Cantidad de repeticiones negativa, decimal o de texto. | `tests/semantica/invalidos/repeticiones.edu` | Error semántico |
| SEM14 | Análisis semántico | Asignación de texto a una variable numérica. | `tests/semantica/invalidos/tipo_incompatible.edu` | Error semántico |
| SEM15 | Análisis semántico | Tipos distintos asignados en ramas diferentes. | `tests/semantica/invalidos/tipos_en_ramas.edu` | Error semántico |
| SEM16 | Análisis semántico | Variable declarada dos veces en el mismo ámbito. | `tests/semantica/invalidos/variable_duplicada.edu` | Error semántico |
| SEM17 | Análisis semántico | Variable usada sin declarar. | `tests/semantica/invalidos/variable_no_declarada.edu` | Error semántico |
| SEM18 | Análisis semántico | Variable leída sin valor. | `tests/semantica/invalidos/variable_sin_inicializar.edu` | Error semántico |
| DER01 | Derivaciones | Las derivaciones por la izquierda de `docs/derivaciones.md` coinciden con el árbol del parser. | `scripts/verificar_derivaciones.py` | Todas coinciden |
| GEN01 | Generación y ejecución | Función recursiva: JSON generado y factorial de 5 = 120. | `tests/test_interprete.py::test_factorial_exportado_y_ejecutado` | Correcta |
| GEN02 | Generación y ejecución | `repetir`, `mientras` y números aleatorios dentro del rango. | `tests/test_interprete.py::test_ciclos_y_aleatorios` | Correcta |
| GEN03 | Generación y ejecución | Cada llamada recursiva tiene sus propias variables. | `tests/test_interprete.py::test_ambitos_anidados_en_activaciones_recursivas` | Correcta |
| GEN04 | Generación y ejecución | `preguntar` repite la pregunta si el tipo no corresponde; salida con tildes. | `tests/test_interprete.py::test_entrada_con_reintentos_y_salida_utf8` | Correcta |
| GEN05 | Generación y ejecución | Los errores de ejecución indican línea y columna. | `tests/test_interprete.py::test_errores_de_ejecucion_con_ubicacion` | Correcta |
| GEN06 | Generación y ejecución | El intérprete rechaza un JSON mal formado. | `tests/test_interprete.py::test_json_invalido` | Correcta |
| GEN07 | Generación y ejecución | Un programa con errores no deja un JSON. | `tests/test_interprete.py::test_compilacion_fallida_no_escribe_la_salida` | Correcta |
| GEN08 | Generación y ejecución | `--salida` no sobrescribe el `.edu` y exige `--etapa intermedio`. | `tests/test_interprete.py::test_salida_protege_fuente_y_requiere_etapa_intermedio` | Correcta |
| PRG01 | Programas completos | `examples/basico.edu`: variables, decisiones y repeticiones; salida exacta. | `tests/test_programas.py::test_basico` | Correcta |
| PRG02 | Programas completos | `examples/principal.edu`: adivina el número con funciones, aleatorios, entrada y ciclos. | `tests/test_programas.py::test_principal_adivina_el_numero` | Correcta |
| PRG03 | Programas completos | `examples/avanzado.edu`: recursión, funciones lógicas y ciclos anidados; salida exacta. | `tests/test_programas.py::test_avanzado` | Correcta |
| PRG04 | Programas completos | `examples/calculadora.edu`: suma 8 + 5 = 13. | `tests/test_programas.py::test_calculadora` | Correcta |
| PRG05 | Programas completos | `examples/piedra_papel_tijera.edu`: una partida termina con un resultado. | `tests/test_programas.py::test_piedra_papel_tijera` | Correcta |
| PRG06 | Programas completos | `examples/con_errores.edu`: 7 errores semánticos y ningún JSON. | `tests/test_programas.py::test_con_errores_no_genera_codigo` | Correcta |
| API01 | Integración con la API web | La IP del cliente se toma de la conexión, no de cabeceras. | `tests/test_api.py::test_seleccion_de_ip` | Correcta |
| API02 | Integración con la API web | Compilar por HTTP y ejecutar por WebSocket un factorial. | `tests/test_api.py::test_factorial` | Correcta |
| API03 | Integración con la API web | Ejecución interactiva con preguntas y reintentos. | `tests/test_api.py::test_calculadora_pide_datos_y_reintenta` | Correcta |
| API04 | Integración con la API web | La API devuelve los diagnósticos con su etapa y ubicación. | `tests/test_api.py::test_diagnosticos_del_compilador` | Correcta |
| API05 | Integración con la API web | Error de ejecución con línea y columna. | `tests/test_api.py::test_division_por_cero_con_ubicacion` | Correcta |
| API06 | Integración con la API web | Rechazo de mensajes JSON o de protocolo inválidos. | `tests/test_api.py::test_json_y_protocolo_invalidos` | Correcta |
| API07 | Integración con la API web | Límites de tamaño de la fuente y de los mensajes. | `tests/test_api.py::test_tamanos_en_bytes` | Correcta |
| API08 | Integración con la API web | Límite de la salida de un programa. | `tests/test_api.py::test_limite_de_salida` | Correcta |
| API09 | Integración con la API web | Plazos de respuesta y detención de un ciclo infinito. | `tests/test_api.py::test_plazos_y_ciclo_infinito` | Correcta |
| API10 | Integración con la API web | Orígenes permitidos y límite de solicitudes por IP. | `tests/test_api.py::test_origenes_y_limites_por_ip` | Correcta |
| API11 | Integración con la API web | Rechazo ordenado cuando no quedan cupos de compilación. | `tests/test_api.py::test_saturacion_de_compilacion` | Correcta |
| API12 | Integración con la API web | Rechazo ordenado cuando no quedan cupos de ejecución. | `tests/test_api.py::test_saturacion_de_ejecucion` | Correcta |
| API13 | Integración con la API web | Al cerrar el WebSocket se termina el subproceso. | `tests/test_api.py::test_desconexion_de_websocket_recoge_el_proceso` | Correcta |
| API14 | Integración con la API web | Al cortar la conexión HTTP se termina el subproceso. | `tests/test_api.py::test_desconexion_http_recoge_el_proceso` | Correcta |
| API15 | Integración con la API web | Una compilación que excede el plazo se detiene. | `tests/test_api.py::test_plazo_de_compilacion_recoge_el_proceso` | Correcta |
| API16 | Integración con la API web | Límites de memoria y CPU del sistema operativo (solo Linux). | `tests/test_api.py::test_limites_del_kernel` | Correcta |
<!-- matriz:fin -->

## Registro de resultados

Antes de cada entrega:

1. Ejecutar `make generar` en un entorno limpio y después
   `scripts/matriz_validacion.py`. El script ejecuta todos los casos y
   actualiza las matrices de este documento y de los resultados. Su última línea
   resume el total: `N casos: X pasan y Y fallan.`
2. Revisar en [resultados_validacion.md](resultados_validacion.md) que todos
   los casos digan "Pasa" y copiar el resumen al informe.
3. Si un caso falla, registrar la entrada, la salida obtenida y la esperada, y
   no cerrar la entrega hasta que pase.
4. Al añadir un error semántico, una construcción, un token o una prueba,
   añadir su entrada o prueba y su descripción en el catálogo de
   `scripts/matriz_validacion.py`. El script se niega a terminar sin errores si
   un caso no tiene descripción.
