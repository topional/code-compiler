# Análisis semántico

## Requisito del trabajo parcial

El enunciado pide describir e implementar por lo menos dos errores semánticos
para el parcial y probar varias entradas. Esta versión incluye esas siete clases y validaciones de comparaciones y funciones.
Para el segundo avance se requiere un analizador completo con al menos seis.
Este texto está preparado para incorporar al informe; debe maquetarse con los
demás apartados dentro de cinco páginas más carátula.

## Errores y explicación para el informe

| Error | Ejemplo | Explicación y corrección |
| --- | --- | --- |
| Variable no declarada | `mostrar edad` | No existe una declaración visible. Escribir `crear variable edad` antes del uso. |
| Declaración duplicada | Dos líneas `crear variable edad` | El nombre ya existe en ese ámbito. Para cambiar su valor usar `asignar`. |
| Variable sin inicializar | `crear variable edad` seguido de `mostrar edad` | La declaración no entrega un valor. Asignar un valor antes de leerla. |
| Tipos incompatibles | Asignar `10` a `edad` y después `"hola"` | La primera asignación fija `numero`; las siguientes deben respetarlo. También se rechaza `1 + "hola"`. |
| Condición no lógica | `si 10 entonces` | Tanto `si` como `mientras` requieren una expresión de tipo `logico`. |
| Cantidad de repeticiones inválida | `repetir 2.5 veces` | La cantidad debe ser numérica, entera y no negativa; se permite cero. |
| Rango aleatorio inválido | `numero aleatorio entre 6 y 1` | Los límites deben ser números enteros, con mínimo menor o igual al máximo; se permiten negativos. |
| Comparación incompatible | `mostrar 1 es igual a "hola"` | Igualdad y desigualdad requieren operandos del mismo tipo; las comparaciones de orden requieren números. |
| Llamada inválida | `mostrar doble("hola")` con parámetro numérico | La función debe estar declarada y recibir la cantidad y los tipos de argumentos correspondientes. |
| Retorno inválido | `devolver 1` fuera de una función | El retorno debe estar dentro de una función y su tipo debe coincidir con el declarado. |
| Falta de retorno | Función numérica sin `devolver` | Toda función debe devolver un valor en todos los caminos; los ciclos no garantizan un retorno. |

Los mensajes incluyen línea y columna desde 1, la causa y una sugerencia de
corrección. Para los ejemplos de prueba se obtienen estos diagnósticos:

```text
Error semántico en 1:9: la variable 'edad' no está declarada. Declárala antes con 'crear variable edad'.
Error semántico en 2:16: la variable 'edad' ya está declarada en este ámbito (primera declaración en 1:16). Usa 'asignar' para cambiar su valor.
Error semántico en 2:9: la variable 'edad' se usa sin inicializar (declarada en 1:16). Asígnale un valor antes de leerla.
Error semántico en 3:9: no se puede asignar un valor de tipo texto a 'edad', que tiene tipo numero. Asigna un valor de tipo numero.
```

Estos programas son válidos para el lexer y el parser. El error se detecta al
recorrer el árbol; el driver muestra los diagnósticos en stderr y termina con
código 1. Si no encuentra errores muestra `Análisis semántico correcto.`

## Tabla de símbolos y recorrido

`src/tabla_simbolos.py` almacena nombre, posición de declaración, tipo,
inicialización y valor numérico conocido de cada variable. Mantiene un diccionario por ámbito y permite
registrar variables, buscar desde el ámbito actual hacia los exteriores,
abrir/cerrar ámbitos y capturar/restaurar el estado para analizar ramas.
`src/semantico.py` hereda del visitor generado por ANTLR4: consulta y actualiza
la tabla mientras recorre el árbol y genera los mensajes de error.

Hay un ámbito global y ámbitos locales para funciones y bloques. Los parámetros
comparten ámbito con el cuerpo de su función, con tipo conocido e inicializados.
Se permite ocultar variables exteriores. Las variables locales dejan de ser
visibles al salir del ámbito; las ramas de un condicional son independientes.
Los nombres distinguen mayúsculas y las declaraciones se procesan en orden de
fuente, también al comprobar variables exteriores dentro de funciones.

La primera asignación válida infiere `numero`, `texto` o `logico`. Enteros y
decimales comparten `numero`. Una asignación con errores no inicializa la
variable. La entrada `preguntar` la inicializa: conserva un tipo ya conocido o
establece `texto` si no tiene tipo previo. La conversión de la entrada al tipo
conocido debe implementarse en la futura ejecución.

Las expresiones propagan sus tipos según la precedencia del parser. Los
operadores `+`, `-`, `*`, `/` y menos unario requieren números; `no`, `y`, `o`
requieren valores lógicos. No se admite concatenación de texto con `+`. Las
comparaciones producen `logico`. La igualdad y desigualdad requieren operandos del mismo tipo; las comparaciones de orden requieren números. Las expresiones aleatorias producen `numero`; se validan sus límites cuando son conocidos.

Las funciones deben declararse antes de su uso y pueden llamarse recursivamente. Se verifica la duplicación en el mismo ámbito, existencia, cantidad y tipos de argumentos, uso de `devolver` dentro de una función, compatibilidad del retorno y retorno garantizado en todos los caminos. Las funciones anidadas tienen ámbito local. Las lecturas exteriores se validan con el estado que tienen las variables al hacer la llamada, respetando los nombres visibles en la definición. Una llamada solo garantiza la inicialización exterior si todos sus caminos de retorno la garantizan.

Para inicialización, un `si` combina ambos caminos: solo garantiza un valor si
la variable está inicializada en todas las ramas. Sin `sino`, también considera
el camino que no entra al bloque. Detecta tipos incompatibles asignados en ramas
diferentes. Un ciclo podría ejecutarse cero veces; no garantiza inicialización
posterior. Definir una función no ejecuta su cuerpo ni inicializa variables
exteriores. El análisis conserva constantes numéricas calculadas con literales,
aritmética y asignaciones, usando fracciones exactas para evitar errores de
redondeo. Por ejemplo, `0.1 * 10` se reconoce como entero; `2.0` también.
Tras un condicional solo conserva un valor si coincide en todos los caminos.
No usa condiciones constantes para descartar ramas. En un condicional, una rama
que devuelve en todos sus caminos no contribuye al estado posterior; solo se
combinan los caminos que pueden continuar. El análisis sigue siendo conservador
para ciclos y no elimina código inalcanzable.

Para evitar asumir valores que podrían cambiar, se descartan constantes al
analizar ciclos, al comprobar una definición y al encontrar una llamada recursiva
activa. En ese último caso tampoco se infieren nuevas inicializaciones. En las
demás llamadas se conservan las constantes que coinciden en todos los retornos.
`preguntar` descarta el valor previo de la variable. Si una cantidad o un límite es
numérico pero su valor es desconocido, la comprobación de entero, signo u orden
queda pendiente para la futura ejecución. No se rechaza únicamente por desconocer
el valor. Esto no garantiza que todos los rangos y cantidades sean válidos al ejecutar.

## Validación y alcance

Las pruebas del parser y de semántica incluyen programas completos válidos, errores, lectura en
distintas construcciones, operaciones, inferencia de tipos, parámetros,
ámbitos, condiciones/ciclos y posiciones y códigos de salida del driver.

Desde `compiladores/lenguaje-educativo`:

```bash
make probar ARCHIVO=examples/calculadora.edu
make probar ARCHIVO=tests/semantica/invalidos/variable_no_declarada.edu
make probar ARCHIVO=tests/semantica/invalidos/variable_duplicada.edu
make probar ARCHIVO=tests/semantica/invalidos/variable_sin_inicializar.edu
make probar ARCHIVO=tests/semantica/invalidos/tipo_incompatible.edu
```

Las cuatro últimas entradas fallan intencionalmente. Las pruebas están en
`tests/semantica/`, separadas en entradas válidas e inválidas; `src/main.py`
conecta lexer, parser y visitor.

Las restricciones de valores desconocidos requieren comprobaciones durante la futura ejecución. Los programas todavía no se ejecutan.
