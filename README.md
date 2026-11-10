# Lenguaje educativo

Proyecto de un lenguaje textual en español para facilitar la transición desde
Scratch. La versión actual implementa el análisis léxico, sintáctico y semántico
con ANTLR4 y Python.

La sintaxis básica separa la declaración de la asignación:

```text
crear variable edad
asignar edad valor de 10
mostrar edad

crear variable nombre
asignar nombre valor de "Ana"
mostrar nombre
mostrar 10
mostrar "Hola"

crear variable dado
asignar dado valor de numero aleatorio entre 1 y 6
mostrar dado
```

Las palabras reservadas admiten mayúsculas y minúsculas; los tokens conservan
el texto original. Se detectan variables no declaradas, declaraciones duplicadas,
lecturas sin inicializar y tipos incompatibles en asignaciones y operaciones.

## Preparación

Se necesita Python 3.10 o posterior, Java, GNU Make 4.3 o posterior, Bash y el
generador de ANTLR 4.13.1. Ejecutar las órdenes desde la raíz del repositorio,
donde están `Makefile` y `requirements.txt`.

El runtime de Python y el generador usan la misma versión, 4.13.1. El archivo
JAR del generador debe estar disponible antes de ejecutar `make generar`:
`pip` instala el runtime de Python, pero no descarga el generador. La ruta
predeterminada del JAR es `/usr/local/lib/antlr-4.13.1-complete.jar`.

Después de clonar el repositorio, preparar el entorno y generar los analizadores:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
make generar
```

Si el JAR está en otro lugar, indicar su ruta al ejecutar Make:

```bash
make generar ANTLR_JAR=/ruta/antlr-4.13.1-complete.jar
```

La variable `ANTLR_JAR` también se puede usar con `make probar` y `make test`.

## Generar y probar

| Comando | Función |
| --- | --- |
| `make generar` | Genera los archivos de ANTLR a partir de las gramáticas `.g4`. |
| `make probar` | Genera lo necesario y analiza `examples/calculadora.edu`. |
| `make probar ARCHIVO=ruta/programa.edu` | Analiza el archivo indicado. |
| `make test` | Comprueba automáticamente las entradas de gramática y semántica. |
| `make test GRUPO=gramatica` | Comprueba solo las entradas de gramática. |
| `make test GRUPO=semantica` | Comprueba solo las entradas de semántica. |

```bash
make generar
make probar
make probar ARCHIVO=examples/calculadora.edu
make probar ARCHIVO=examples/piedra_papel_tijera.edu
```

Para ver también el árbol de análisis sintáctico en texto, con paréntesis:

```bash
.venv/bin/python src/main.py examples/calculadora.edu --arbol
```

`make probar` usa el Python de `.venv`, incluso si el entorno no está
activado. Depende de `generar`: no hace falta ejecutar ambos comandos por
separado. Make reutiliza los archivos actualizados y regenera los necesarios
cuando cambian las gramáticas.

La automatización usa un único script Bash y los archivos `.edu` de `tests/`.
Comprueba que los válidos sean aceptados y los inválidos produzcan errores de
su etapa. No compara mensajes exactos. Las entradas del lexer se revisan
manualmente. Consulta [la guía de pruebas](tests/README.md).

### Archivos generados por ANTLR

`make generar` utiliza `grammar/EducativoLexer.g4` y
`grammar/EducativoParser.g4` para crear:

```text
src/generated/
├── EducativoLexer.py             # Reconocimiento de tokens
├── EducativoLexer.tokens         # Vocabulario de tokens
├── EducativoLexer.interp         # Datos auxiliares de ANTLR
├── EducativoParser.py            # Análisis sintáctico
├── EducativoParserVisitor.py     # Base para recorrer el árbol
├── EducativoParser.tokens
└── EducativoParser.interp
```

Ejecutar `make generar` antes de ejecutar directamente
`src/main.py`. Los archivos generados se actualizan desde los `.g4`; los cambios
del analizador semántico se escriben en `src/semantico.py` y
`src/tabla_simbolos.py`.

### Flujo del driver

`src/main.py` coordina el análisis. Lee el archivo con `FileStream` de ANTLR,
ejecuta el lexer y llama a `parser.programa()` para construir el árbol
sintáctico. Si ambas etapas terminan sin errores, recorre el árbol con
`AnalizadorSemantico`. Por defecto, completa las tres etapas y muestra los
tokens, `Análisis sintáctico correcto.` y `Análisis semántico correcto.`.
Con `--etapa lexer` o `--etapa gramatica` se detiene al terminar esa etapa;
en Make se selecciona con `ETAPA=lexer` o `ETAPA=gramatica`.

Ante un error léxico, sintáctico o semántico muestra la posición en stderr,
detiene las etapas posteriores y termina con código 1; si el archivo no se
puede leer, con código 2. Por ejemplo:

```bash
make probar ARCHIVO=tests/lexer/invalidos/caracter.edu
```

Esa prueba falla intencionalmente porque `@` no está definido.

Para probar errores sintácticos con tokens válidos:

```bash
make probar ARCHIVO=tests/gramatica/invalidos/asignacion_sin_valor.edu
make probar ARCHIVO=tests/gramatica/invalidos/condicional_sin_fin.edu
```

Esas entradas fallan intencionalmente: falta `valor de` en la primera y `fin`
en la segunda. Los mensajes específicos de ANTLR pueden aparecer en inglés.

`grammar/EducativoParser.g4` reutiliza el vocabulario de `EducativoLexer.g4`.
ANTLR genera `EducativoParser.py` y `EducativoParserVisitor.py`; este último
es la base de `src/semantico.py`, que recorre el árbol en el análisis semántico.

## Análisis semántico

El analizador semántico detecta los siguientes errores:

- Uso de una variable no declarada, tanto al leer como al asignar o preguntar.
- Declaración repetida de una variable en el mismo ámbito, incluidos parámetros.
- Lectura de una variable sin un valor inicial garantizado.
- Tipos incompatibles en asignaciones y operaciones aritméticas o lógicas.
- Condiciones de `si` y `mientras` que no sean lógicas.
- Cantidades de repeticiones que no sean numéricas, enteras y no negativas.
- Límites aleatorios que no sean numéricos, enteros y ordenados.
- Comparaciones entre tipos incompatibles o comparaciones de orden no numéricas.
- Funciones no declaradas o duplicadas, argumentos incorrectos y retornos inválidos o ausentes.

Las restricciones de valores se comprueban cuando pueden determinarse mediante
literales, aritmética y variables con valores conocidos. `2.0` cuenta como entero;
se permiten cero repeticiones y límites negativos o iguales en aleatorios.
Los valores numéricos desconocidos deberán comprobarse durante la futura ejecución.

El visitor de `src/semantico.py` usa la tabla de `src/tabla_simbolos.py`,
con un ámbito global y ámbitos locales
para funciones y bloques. Los parámetros comparten ámbito con el cuerpo de la
función. Se permite ocultar una variable exterior; los nombres distinguen
mayúsculas. Las declaraciones se procesan en orden de fuente, también dentro
de funciones: solo ven declaraciones exteriores anteriores a su definición.
La primera asignación válida determina el tipo (`numero`, `texto` o `logico`);
las siguientes deben respetarlo. Enteros y decimales comparten `numero`. Los
parámetros se consideran inicializados y tienen el tipo declarado. Una entrada
con `preguntar` inicializa la variable: conserva su tipo si ya se conoce y, si
no, establece `texto`. La conversión de la entrada se implementará al ejecutar.

Los operadores aritméticos requieren números, y `no`, `y`, `o` requieren
lógicos. `+` no concatena textos. Tras un `si`, una variable se considera
inicializada solo si lo está en todos los caminos. Los ciclos podrían no
ejecutarse; sus asignaciones no garantizan inicialización posterior. Definir
una función tampoco ejecuta su cuerpo. Las funciones deben declararse antes
de utilizarlas; se permite la recursión. Se validan su firma, argumentos y tipo
de retorno, y se exige un retorno en todos los caminos. La comprobación de
retorno es conservadora: un ciclo no garantiza que su cuerpo se ejecute.

```bash
make probar ARCHIVO=tests/semantica/invalidos/variable_no_declarada.edu
make probar ARCHIVO=tests/semantica/invalidos/variable_duplicada.edu
make probar ARCHIVO=tests/semantica/invalidos/variable_sin_inicializar.edu
make probar ARCHIVO=tests/semantica/invalidos/tipo_incompatible.edu
```

Estas entradas fallan intencionalmente con código 1 y diagnósticos en español
que indican la posición y describen el problema.
Las entradas `tests/semantica/invalidos/comparaciones.edu` y
`tests/semantica/invalidos/funciones_y_retornos.edu` permiten revisar las
comprobaciones; `tests/semantica/validos/funciones_y_comparaciones.edu` muestra un caso válido.

Las entradas están en `tests/lexer/`, `tests/gramatica/` y `tests/semantica/`,
separadas en `validos` e `invalidos`. Elige un archivo con `make probar ARCHIVO=...`
y revisa su salida. Usa `ETAPA=lexer` o `ETAPA=gramatica` para detener el análisis
en esa etapa. Consulta [la guía de entradas](tests/README.md).

## Alcance actual

El lexer reconoce variables, entrada/salida, operaciones, lógica, comparaciones,
condicionales, ciclos, funciones, tipos, elección aleatoria y las palabras
reservadas `juego` y `calculadora`. El parser acepta estas dos últimas como
instrucciones sin argumentos. La calculadora y el juego de `examples/` están
escritos con variables, entrada/salida y condicionales. El parser comprueba
la estructura, la separación por líneas, los bloques y la precedencia de las
expresiones.
El analizador semántico comprueba declaraciones, inicialización y tipos en
asignaciones, operaciones, comparaciones, condiciones, repeticiones, rangos y funciones.
Las restricciones sobre valores desconocidos deben verificarse en la futura ejecución.
El analizador comprueba las lecturas de variables exteriores con el estado que tienen
al llamar a la función. Después de la llamada, solo da por inicializadas las variables
que lo están en todos los caminos de retorno. El análisis conserva ambos caminos de
un condicional y no presupone nuevas inicializaciones en una llamada recursiva activa.
Los programas no se ejecutan todavía.

Se prevé incorporar un generador de código intermedio LLVM IR (`.ll`). Este
componente todavía no está implementado; el alcance previsto termina en el
archivo `.ll`, sin generar un ejecutable nativo.
