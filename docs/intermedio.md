# Representación intermedia

El generador traduce el árbol de ANTLR después del análisis semántico.
`GeneradorCodigo` resuelve los nombres y recorre el árbol; `Builder` construye
objetos `Instruccion` y administra temporales y etiquetas. Los programas todavía
no se ejecutan: este documento establece el contrato de las instrucciones para
su posterior interpretación o traducción.

## Datos y nombres

Cada instrucción contiene `operacion`, `argumento1`, `argumento2`, `resultado`,
`linea`, `columna`, `tipo` y `nombre`. Los campos no utilizados contienen `None`.
`resultado` es un destino, no un valor ya calculado; en un salto representa la
etiqueta de destino. `nombre` conserva la escritura original de las declaraciones
y parámetros. `tipo` se utiliza para parámetros y entradas.

Las líneas y columnas empiezan en 1. Las operaciones apuntan al operador de
origen; las instrucciones auxiliares de control apuntan al bloque o sentencia
que las origina. No se alteran las gramáticas ni los archivos generados por ANTLR.

Los operandos son cadenas que representan literales o referencias:

- Números: conservan su escritura decimal; los límites pueden incluir un signo.
- Textos: conservan comillas y escapes; se interpretarán al ejecutar.
- Lógicos: `verdadero` y `falso`, normalizados a minúsculas.
- Temporales: `%tN`, únicos dentro de una generación.
- Variables: `%vN_nombre`, con identidad distinta para cada declaración.
- Funciones: `%fN_nombre`, con identidad distinta para cada definición.
- Etiquetas: `%LN`, únicas dentro de una generación.

Los identificadores internos evitan colisiones con nombres del programa y
permiten ocultar variables y funciones de ámbitos exteriores. El intérprete
futuro deberá mantener instancias diferentes de los parámetros, variables
locales y temporales en cada llamada, también en llamadas recursivas.

## Instrucciones

En la tabla, `a` y `b` son operandos, `v` es una variable, `t` un temporal,
`L` una etiqueta y `f` una función. Las posiciones empiezan en cero.

| Operación | argumento1 | argumento2 | resultado | Significado |
| --- | --- | --- | --- | --- |
| `declarar` | — | — | v | Registrar una variable sin inicializar en el ámbito actual. |
| `asignar` | a | — | v o t | Copiar un valor al destino. |
| `leer` | v | — | t | Capturar el valor actual de una variable. |
| `+`, `-`, `*`, `/` | a | b | t | Operación aritmética binaria. |
| `==`, `!=`, `<`, `>`, `<=`, `>=` | a | b | t | Comparación que produce un lógico. |
| `y`, `o` | a | b | t | Operación lógica binaria. |
| `no` | a | — | t | Negación lógica. |
| `mostrar` | a | — | — | Enviar el valor a la salida del programa. |
| `preguntar` | texto de la pregunta | — | v | Solicitar un dato y guardarlo con el tipo indicado. |
| `etiqueta` | — | — | L | Marcar una posición del código. |
| `saltar` | — | — | L | Continuar en la etiqueta. |
| `saltar_si_falso` | a | — | L | Saltar si el lógico es falso. |
| `abrir_ambito` | — | — | — | Crear un ámbito local con enlace al exterior. |
| `cerrar_ambito` | — | — | — | Volver al ámbito exterior. |
| `comprobar_repeticiones` | a | — | — | Exigir un número entero no negativo. |
| `aleatorio` | mínimo | máximo | t | Obtener un entero del intervalo inclusivo. |
| `funcion` | L de entrada | tipo de retorno | f | Registrar la función y capturar su entorno léxico. |
| `parametro` | posición | — | v | Vincular el argumento de esa posición; `tipo` conserva su tipo declarado. |
| `argumento` | a | posición | — | Preparar un argumento para la llamada inmediata. |
| `llamar` | f | cantidad de argumentos | t | Crear una activación, ejecutar la función y recibir su retorno. |
| `devolver` | a | — | — | Terminar la llamada y entregar el valor al llamador. |
| `fin_funcion` | f | — | — | Delimitar el cuerpo; alcanzarlo sin retorno es un error de ejecución. |
| `motivacion` | `juego` o `calculadora` | — | — | Marcador informativo sin efecto operacional. |

El builder no necesita manejar el árbol de ANTLR: recibe operandos, nombres y
ubicaciones. El generador no agrega instrucciones directamente a la lista.

## Orden de evaluación y control

Los operandos y argumentos se evalúan de izquierda a derecha. Las lecturas se
capturan en temporales antes de evaluar el siguiente operando, porque una
llamada podría modificar una variable exterior. Los argumentos de llamadas
anidadas se calculan antes de emitir el grupo contiguo `argumento`/`llamar`.

`y` y `o` evalúan ambos operandos, al igual que el recorrido semántico actual;
no se genera cortocircuito. La precedencia y la asociatividad aritmética se
conservan a partir de la estructura de la gramática. El signo negativo se
representa como una resta desde cero.

`si` utiliza saltos para seleccionar una rama. `mientras` vuelve a generar el
valor de su condición en cada vuelta al ejecutar sus instrucciones. `repetir`
evalúa su cantidad una sola vez, comprueba su dominio y utiliza un contador
interno. Cada ejecución de un bloque crea su propio ámbito.

## Funciones y ámbitos

La instrucción `funcion` registra una definición con su entorno léxico actual.
Le sigue un salto que evita ejecutar el cuerpo como parte de la definición.
La entrada etiquetada contiene la vinculación de parámetros y las instrucciones
del cuerpo; al final aparece `fin_funcion` y después la etiqueta de continuación.
Las definiciones anidadas siguen el mismo esquema.

Una llamada debe conservar la posición de retorno y los temporales del llamador,
crear una activación propia y enlazarla con el entorno capturado por la función,
no con el ámbito dinámico de quien la llama. Parámetros y cuerpo comparten ese
nuevo ámbito. Las referencias internas se resuelven al generar, respetando las
declaraciones visibles en orden de fuente. Registrar una función antes de
traducir su cuerpo permite la recursión.

`devolver` abandona todos los bloques abiertos dentro de la llamada y restaura
la activación del llamador. Por eso un retorno dentro de `si` o de un ciclo no
necesita ejecutar los `cerrar_ambito` que aparecen después en el flujo lineal.

## Entrada y restricciones durante la ejecución

El semántico conserva en `tipos_entrada` el tipo validado de cada `preguntar`.
El driver entrega ese mapa al generador, que lo guarda en el campo `tipo` de
la instrucción. Sin tipo previo, la entrada es `texto`. La conversión y los
mensajes de entrada inválida quedan a cargo del futuro intérprete. Al utilizar
el generador directamente sin ese mapa, `automatico` indica conservar el tipo
actual de la variable o usar texto si todavía no tiene uno.

El intérprete deberá comprobar divisiones por cero, cantidades de repetición
enteras y no negativas, y límites aleatorios enteros y ordenados. El intervalo
aleatorio incluye ambos extremos. Las comprobaciones semánticas de constantes
no sustituyen estas comprobaciones para valores desconocidos.

## Uso y validación

La etapa sigue siendo silenciosa y conserva sus instrucciones en memoria:

```bash
make probar ETAPA=intermedio ARCHIVO=examples/calculadora.edu
make probar ETAPA=intermedio ARCHIVO=examples/piedra_papel_tijera.edu
```

El driver analiza léxico, sintaxis y semántica antes de crear el generador.
Los errores anteriores impiden generar. No se implementan ejecución, exportación
de archivos, una interfaz web ni traducción a LLVM o Python.

`make test` conserva las comprobaciones de gramática y semántica. No comprueba
permanentemente la estructura o el comportamiento del código intermedio.
