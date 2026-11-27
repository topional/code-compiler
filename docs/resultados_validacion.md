# Resultados de la validación y conclusiones

**Fecha de ejecución:** 26 de noviembre de 2026

Se ejecutaron los 75 casos del [plan de validación](plan_validacion.md) y todos
pasan. Uno de ellos, `API16`, se omitió porque solo se ejecuta en Linux.

## Resumen

| Categoría | Casos | Resultado |
| --- | --- | --- |
| Análisis léxico (`LEX`) | 11 | 11 pasan: 5 entradas válidas aceptadas y 6 inválidas rechazadas con `Error léxico` |
| Análisis sintáctico (`SIN`) | 15 | 15 pasan: 5 entradas válidas aceptadas y 10 inválidas rechazadas con `Error sintáctico` |
| Análisis semántico (`SEM`) | 18 | 18 pasan: 4 entradas válidas aceptadas y 14 inválidas rechazadas con `Error semántico` |
| Derivaciones (`DER`) | 1 | Las 68 derivaciones por la izquierda coinciden con el parser |
| Generación y ejecución (`GEN`) | 8 | 8 pasan |
| Programas completos (`PRG`) | 6 | 6 pasan |
| Integración con la API web (`API`) | 16 | 15 pasan y 1 se omite (`API16`, solo Linux) |

Entorno: Windows 11, Python 3.14, Java 25, ANTLR 4.13.1. Como `make` no está
instalado en ese equipo, se ejecutaron directamente los comandos del `Makefile`.

## Matriz de resultados

Generada con `scripts/matriz_validacion.py`. La descripción y la entrada de cada
ID están en la [matriz del plan](plan_validacion.md#matriz-de-casos). En los
casos inválidos, el resultado real muestra el primer diagnóstico y, entre
paréntesis, cuántos más se produjeron.

<!-- matriz:inicio -->
| ID | Caso | Resultado esperado | Resultado real | Estado |
| --- | --- | --- | --- | --- |
| LEX01 | Comentarios, tabulaciones, `\r\n`, líneas vacías y `#` dentro de un texto. | Aceptado | Aceptado | Pasa |
| LEX02 | Textos con escapes, decimales, signos y paréntesis. | Aceptado | Aceptado | Pasa |
| LEX03 | Palabras reservadas escritas con mayúsculas y minúsculas mezcladas. | Aceptado | Aceptado | Pasa |
| LEX04 | Las 40 palabras reservadas del lenguaje. | Aceptado | Aceptado | Pasa |
| LEX05 | Identificadores que contienen palabras reservadas, tildes, `ñ` y guion bajo. | Aceptado | Aceptado | Pasa |
| LEX06 | Carácter sin regla (`@`). | Error léxico | Error léxico en 1:9 | Pasa |
| LEX07 | Escape no admitido dentro de un texto (`\q`). | Error léxico | Error léxico en 1:9 (+1) | Pasa |
| LEX08 | Número terminado en punto (`5.`). | Error léxico | Error léxico en 1:10 | Pasa |
| LEX09 | Número con dos puntos decimales (`1.2.3`). | Error léxico | Error léxico en 1:12 | Pasa |
| LEX10 | Signo que no pertenece al lenguaje (`;`). | Error léxico | Error léxico en 1:10 | Pasa |
| LEX11 | Texto sin comilla de cierre. | Error léxico | Error léxico en 1:9 | Pasa |
| SIN01 | Condicionales y repeticiones anidados, con `sino`. | Aceptado | Aceptado | Pasa |
| SIN02 | Todas las sentencias de la gramática. | Aceptado | Aceptado | Pasa |
| SIN03 | Precedencia aritmética, comparaciones y operadores lógicos. | Aceptado | Aceptado | Pasa |
| SIN04 | Última línea sin salto. | Aceptado | Aceptado | Pasa |
| SIN05 | Archivo vacío. | Aceptado | Aceptado | Pasa |
| SIN06 | Asignación sin `valor de`. | Error sintáctico | Error sintáctico en 1:14 | Pasa |
| SIN07 | Dos comparaciones seguidas sin `y`. | Error sintáctico | Error sintáctico en 1:26 | Pasa |
| SIN08 | Bloque `si` sin `fin`. | Error sintáctico | Error sintáctico en 3:1 | Pasa |
| SIN09 | Dos instrucciones en la misma línea. | Error sintáctico | Error sintáctico en 1:11 | Pasa |
| SIN10 | Sintaxis antigua `preguntar ... y guardar`. | Error sintáctico | Error sintáctico en 1:18 | Pasa |
| SIN11 | Suma sin operando derecho. | Error sintáctico | Error sintáctico en 1:12 | Pasa |
| SIN12 | Definición con la sintaxis antigua `con`, sin paréntesis. | Error sintáctico | Error sintáctico en 1:15 (+1) | Pasa |
| SIN13 | Límite aleatorio escrito como expresión (`1 + 1`). | Error sintáctico | Error sintáctico en 2:48 | Pasa |
| SIN14 | Paréntesis sin cerrar. | Error sintáctico | Error sintáctico en 1:15 | Pasa |
| SIN15 | `sino` sin un `si` que lo abra. | Error sintáctico | Error sintáctico en 2:1 | Pasa |
| SEM01 | Condiciones lógicas, ciclos y rangos válidos. | Aceptado | Aceptado | Pasa |
| SEM02 | Funciones y comparaciones con tipos correctos. | Aceptado | Aceptado | Pasa |
| SEM03 | Declaraciones, parámetros, ámbitos y usos de variables. | Aceptado | Aceptado | Pasa |
| SEM04 | Inicialización en todas las ramas y valores que solo se conocen al ejecutar. | Aceptado | Aceptado | Pasa |
| SEM05 | Rango aleatorio con decimales, invertido o con texto. | Error semántico | Error semántico en 1:32 (+2) | Pasa |
| SEM06 | Variable usada fuera del bloque que la declara. | Error semántico | Error semántico en 5:9 | Pasa |
| SEM07 | Comparación entre tipos incompatibles. | Error semántico | Error semántico en 1:11 (+1) | Pasa |
| SEM08 | Condición de `si` o `mientras` que no es lógica. | Error semántico | Error semántico en 1:4 (+1) | Pasa |
| SEM09 | Función duplicada, falta de retorno y tipo de retorno incompatible. | Error semántico | Error semántico en 1:9 (+2) | Pasa |
| SEM10 | Función no declarada, argumentos incorrectos y retorno fuera de una función. | Error semántico | Error semántico en 4:9 (+3) | Pasa |
| SEM11 | Variable inicializada solo en una rama. | Error semántico | Error semántico en 5:9 | Pasa |
| SEM12 | Operaciones aritméticas y lógicas con tipos incompatibles. | Error semántico | Error semántico en 1:11 (+2) | Pasa |
| SEM13 | Cantidad de repeticiones negativa, decimal o de texto. | Error semántico | Error semántico en 1:9 (+3) | Pasa |
| SEM14 | Asignación de texto a una variable numérica. | Error semántico | Error semántico en 3:9 | Pasa |
| SEM15 | Tipos distintos asignados en ramas diferentes. | Error semántico | Error semántico en 2:1 | Pasa |
| SEM16 | Variable declarada dos veces en el mismo ámbito. | Error semántico | Error semántico en 2:16 | Pasa |
| SEM17 | Variable usada sin declarar. | Error semántico | Error semántico en 1:9 | Pasa |
| SEM18 | Variable leída sin valor. | Error semántico | Error semántico en 2:9 | Pasa |
| DER01 | Las derivaciones por la izquierda de `docs/derivaciones.md` coinciden con el árbol del parser. | Todas coinciden | 68 derivaciones revisadas: 68 correctas y 0 con diferencias | Pasa |
| GEN01 | Función recursiva: JSON generado y factorial de 5 = 120. | Correcta | Correcta | Pasa |
| GEN02 | `repetir`, `mientras` y números aleatorios dentro del rango. | Correcta | Correcta | Pasa |
| GEN03 | Cada llamada recursiva tiene sus propias variables. | Correcta | Correcta | Pasa |
| GEN04 | `preguntar` repite la pregunta si el tipo no corresponde; salida con tildes. | Correcta | Correcta | Pasa |
| GEN05 | Los errores de ejecución indican línea y columna. | Correcta | Correcta | Pasa |
| GEN06 | El intérprete rechaza un JSON mal formado. | Correcta | Correcta | Pasa |
| GEN07 | Un programa con errores no deja un JSON. | Correcta | Correcta | Pasa |
| GEN08 | `--salida` no sobrescribe el `.edu` y exige `--etapa intermedio`. | Correcta | Correcta | Pasa |
| PRG01 | `examples/basico.edu`: variables, decisiones y repeticiones; salida exacta. | Correcta | Correcta | Pasa |
| PRG02 | `examples/principal.edu`: adivina el número con funciones, aleatorios, entrada y ciclos. | Correcta | Correcta | Pasa |
| PRG03 | `examples/avanzado.edu`: recursión, funciones lógicas y ciclos anidados; salida exacta. | Correcta | Correcta | Pasa |
| PRG04 | `examples/calculadora.edu`: suma 8 + 5 = 13. | Correcta | Correcta | Pasa |
| PRG05 | `examples/piedra_papel_tijera.edu`: una partida termina con un resultado. | Correcta | Correcta | Pasa |
| PRG06 | `examples/con_errores.edu`: 7 errores semánticos y ningún JSON. | Correcta | Correcta | Pasa |
| API01 | La IP del cliente se toma de la conexión, no de cabeceras. | Correcta | Correcta | Pasa |
| API02 | Compilar por HTTP y ejecutar por WebSocket un factorial. | Correcta | Correcta | Pasa |
| API03 | Ejecución interactiva con preguntas y reintentos. | Correcta | Correcta | Pasa |
| API04 | La API devuelve los diagnósticos con su etapa y ubicación. | Correcta | Correcta | Pasa |
| API05 | Error de ejecución con línea y columna. | Correcta | Correcta | Pasa |
| API06 | Rechazo de mensajes JSON o de protocolo inválidos. | Correcta | Correcta | Pasa |
| API07 | Límites de tamaño de la fuente y de los mensajes. | Correcta | Correcta | Pasa |
| API08 | Límite de la salida de un programa. | Correcta | Correcta | Pasa |
| API09 | Plazos de respuesta y detención de un ciclo infinito. | Correcta | Correcta | Pasa |
| API10 | Orígenes permitidos y límite de solicitudes por IP. | Correcta | Correcta | Pasa |
| API11 | Rechazo ordenado cuando no quedan cupos de compilación. | Correcta | Correcta | Pasa |
| API12 | Rechazo ordenado cuando no quedan cupos de ejecución. | Correcta | Correcta | Pasa |
| API13 | Al cerrar el WebSocket se termina el subproceso. | Correcta | Correcta | Pasa |
| API14 | Al cortar la conexión HTTP se termina el subproceso. | Correcta | Correcta | Pasa |
| API15 | Una compilación que excede el plazo se detiene. | Correcta | Correcta | Pasa |
| API16 | Límites de memoria y CPU del sistema operativo (solo Linux). | Correcta | Omitida: requiere Linux | Pasa |
<!-- matriz:fin -->

## Evidencias destacadas

### Errores semánticos

Las 15 clases de errores semánticos documentadas en [semantica.md](semantica.md)
tienen al menos una entrada que las detecta. El programa
`examples/con_errores.edu` reúne siete en un solo archivo, y el compilador no
genera código:

```text
Error semántico en 4:9: no se puede asignar un valor de tipo texto a 'puntos', que tiene tipo numero. Asigna un valor de tipo numero.
Error semántico en 5:9: la variable 'vidas' no está declarada. Declárala antes con 'crear variable vidas'.
Error semántico en 6:16: la variable 'puntos' ya está declarada en este ámbito (primera declaración en 2:16). Usa 'asignar' para cambiar su valor.
Error semántico en 8:4: la condición de 'si' debe ser de tipo logico, pero recibió numero.
Error semántico en 15:9: el argumento 1 de 'doble' debe ser de tipo numero, pero recibió texto.
Error semántico en 16:9: la función 'triple' no está declarada.
Error semántico en 18:9: la cantidad de repeticiones debe ser un entero no negativo.
```

### Programas completos

Cada programa de `examples/` se compila a JSON y se ejecuta en un proceso
separado (`PRG01`–`PRG06`):

| Programa | Propósito | Resultado comprobado |
| --- | --- | --- |
| `basico.edu` | Básico: variables, decisiones y repeticiones | Salida exacta de 8 líneas |
| `principal.edu` | Principal: adivina el número, el proyecto clásico de Scratch | Con los intentos del 1 al 10 termina en "¡Adivinaste!" y cuenta bien los intentos |
| `avanzado.edu` | Avanzado: recursión, funciones lógicas y ciclos anidados | Factorial, Fibonacci y paridad del 1 al 5, y tabla de 3 × 3 exactos |
| `calculadora.edu` | Alternativo | Suma 8 + 5 = 13 |
| `piedra_papel_tijera.edu` | Alternativo | La partida termina en "Empate", "Ganaste" o "Perdiste" |
| `con_errores.edu` | Con errores | 7 errores semánticos, código de salida 1 y ningún JSON |

### Derivaciones

`scripts/verificar_derivaciones.py` analiza el programa de cada ejemplo de
[derivaciones.md](derivaciones.md) con el parser real, obtiene del árbol la
derivación por la izquierda y la compara paso a paso con la escrita. Las 68
coinciden: 17 construcciones con 4 ejemplos cada una. Para confirmar que el
script detecta errores, se alteró a propósito un paso en una copia del documento
y el script lo señaló con código 1.

## Limitaciones conocidas

- Los mensajes de los errores léxicos y sintácticos vienen de ANTLR y pueden
  aparecer en inglés. Los semánticos y de ejecución están en español.
- Las pruebas por etapa comprueban aceptación y rechazo, no el texto exacto de
  cada mensaje.
- El back end genera código intermedio interpretado, no código nativo. El
  enunciado admite esta opción sin LLVM según la naturaleza del proyecto.
- `API16` no se ejecutó, porque requiere Linux.
- El token `con` sigue reservado en el lexer aunque la gramática actual ya no lo usa.

## Conclusiones

1. **Se cumplió el objetivo del lenguaje.** El compilador recorre todas las
   etapas: léxico, sintaxis, semántica, generación de código intermedio y
   ejecución. Así, un estudiante puede escribir en español programas con
   variables, condicionales, ciclos y funciones, como el juego de adivinar el
   número que suele hacer en Scratch, y ejecutarlos.
2. **La separación en etapas hizo el compilador verificable.** Cada etapa se
   puede detener con `--etapa`, lo que permitió probarlas por separado. Un error
   se detecta en la etapa más temprana posible y no llega a las siguientes.
3. **Visitor y Builder tienen responsabilidades distintas.** El Visitor recorre
   el árbol y decide qué generar; el Builder crea las instrucciones, los
   temporales y las etiquetas. Solo el Builder construye instrucciones.
4. **Los diagnósticos están pensados para quien aprende.** Los mensajes
   semánticos y de ejecución indican línea, columna, causa y una sugerencia de
   corrección, en español.
5. **El código intermedio fue una elección adecuada para este proyecto.** Un
   intérprete propio permite pedir datos con `preguntar` durante la ejecución y
   señalar la línea de origen de cada error, sin compilar binarios nativos.
6. **La gramática respeta la notación del curso y quedó validada
   automáticamente.** Se usaron reglas con `ε` en lugar de cuantificadores, y
   las 68 derivaciones coinciden con el parser.
7. **Trabajo futuro.** Traducir al español los mensajes léxicos y sintácticos,
   comparar el texto exacto de los diagnósticos en las pruebas, quitar el token
   `con` sin uso y, si el curso lo requiere, añadir un back end LLVM a partir del
   mismo código intermedio.
