# Análisis semántico parcial

## Requisito del trabajo parcial

El enunciado pide describir e implementar por lo menos dos errores semánticos
para el parcial y probar varias entradas. Esta versión detecta cuatro clases.
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
código 1. Si no encuentra errores muestra `Análisis semántico parcial correcto.`

## Tabla de símbolos y recorrido

`src/tabla_simbolos.py` almacena nombre, posición de declaración, tipo e
inicialización de cada variable. Mantiene un diccionario por ámbito y permite
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
comparaciones producen `logico`, pero su compatibilidad de operandos todavía
no se verifica. Las expresiones aleatorias producen `numero`; se verifican los
usos de variables de sus límites, aunque sus restricciones completas siguen
pendientes. Una llamada a una función ya visitada usa su tipo de resultado
declarado; funciones sin tipo conocido se dejan pendientes y no provocan
rechazos adicionales por tipo.

Para inicialización, un `si` combina ambos caminos: solo garantiza un valor si
la variable está inicializada en todas las ramas. Sin `sino`, también considera
el camino que no entra al bloque. Detecta tipos incompatibles asignados en ramas
diferentes. Un ciclo podría ejecutarse cero veces; no garantiza inicialización
posterior. Definir una función no ejecuta su cuerpo ni inicializa variables
exteriores. El análisis es conservador: no evalúa constantes ni modela efectos
de llamadas o terminación temprana por retornos.

## Validación y alcance

`make test` pasa 50 pruebas: 16 del lexer, 11 del parser y 23 de semántica.
Incluyen cuatro programas completos válidos, los cuatro errores, lectura en
distintas construcciones, operaciones, inferencia de tipos, parámetros,
ámbitos, condiciones/ciclos y posiciones y códigos de salida del driver.

Desde `compiladores/lenguaje-educativo`:

```bash
make test
make probar ARCHIVO=examples/semantico_completo.edu
make probar ARCHIVO=tests/fixtures/invalid/variable_no_declarada.edu
make probar ARCHIVO=tests/fixtures/invalid/variable_duplicada.edu
make probar ARCHIVO=tests/fixtures/invalid/variable_sin_inicializar.edu
make probar ARCHIVO=tests/fixtures/invalid/tipo_incompatible.edu
```

Las cuatro últimas entradas fallan intencionalmente. Las pruebas están en
`tests/test_semantico.py`; `src/main.py` conecta lexer, parser y visitor.

Quedan pendientes condiciones obligatoriamente lógicas, compatibilidad de
comparaciones, comprobación completa de funciones/argumentos/retornos y tipos,
enteros y orden de los rangos aleatorios. Los programas todavía no se ejecutan.
Este documento debe incorporarse al informe: su existencia en la carpeta local
no acredita la entrega del informe.
