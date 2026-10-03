# Lenguaje educativo

Proyecto de un lenguaje textual en español para facilitar la transición desde
Scratch. La versión actual implementa el análisis léxico, sintáctico y semántico parcial
con ANTLR4 y Python. El vocabulario está documentado en [docs/tokens.md](../docs/tokens.md),
las reglas en [docs/gramatica.md](../docs/gramatica.md) y los ejemplos con
derivaciones por la izquierda en [docs/derivaciones.md](../docs/derivaciones.md).
La sección preparada para el informe está en
[docs/informe_sintactico.md](../docs/informe_sintactico.md).

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
el texto original. Se detectan variables no declaradas y declaraciones duplicadas
en el mismo ámbito. El uso de variables sin valor y la compatibilidad de tipos
se comprobarán en la futura etapa semántica.

## Preparación

Se necesita Python 3, Java, GNU Make 4.3 o posterior y el generador de ANTLR 4.13.1.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
```

El runtime de Python y el generador usan la misma versión, 4.13.1. La ruta
predeterminada del generador es `/usr/local/lib/antlr-4.13.1-complete.jar`.
Si se encuentra en otro lugar:

```bash
make generar ANTLR_JAR=/ruta/antlr-4.13.1-complete.jar
```

## Generar y probar

```bash
make generar
make probar
make probar ARCHIVO=examples/lexer_completo.edu
make probar ARCHIVO=examples/parser_completo.edu
make probar ARCHIVO=examples/semantico_completo.edu
make test
```

Para ver también el árbol sintáctico:

```bash
.venv/bin/python src/main.py examples/variables.edu --arbol
```

`make probar` usa el Python de `.venv`, incluso si el entorno no está activado.
Los archivos de `src/generated/` se generan desde la gramática y se excluyen de Git.
Cada integrante debe ejecutar `make generar` después de clonar el repositorio.

El driver lee el archivo, ejecuta el lexer y luego llama a `parser.programa()`.
Si no hay errores, recorre el árbol con `AnalizadorSemantico`. Muestra los tokens,
`Análisis sintáctico correcto.` y `Análisis semántico parcial correcto.`.
Ante un error léxico, sintáctico o semántico muestra la posición en stderr y termina con
código 1; si el archivo no se puede leer, con código 2. Por ejemplo:

```bash
make probar ARCHIVO=tests/fixtures/invalid/caracter.edu
```

Esa prueba falla intencionalmente porque `@` no está definido.

Para probar errores sintácticos con tokens válidos:

```bash
make probar ARCHIVO=tests/fixtures/invalid/asignacion_sin_valor.edu
make probar ARCHIVO=tests/fixtures/invalid/condicional_sin_fin.edu
```

Esas entradas fallan intencionalmente: falta `valor de` en la primera y `fin`
en la segunda. Los mensajes específicos de ANTLR pueden aparecer en inglés.

`grammar/EducativoParser.g4` reutiliza el vocabulario de `EducativoLexer.g4`.
ANTLR genera `EducativoParser.py` y `EducativoParserVisitor.py`; este último
es la base de `src/semantico.py`, que recorre el árbol en el análisis semántico.

## Análisis semántico del parcial

El enunciado pide verificar por lo menos dos errores semánticos. Se implementan:

- Uso de una variable no declarada, tanto al leer como al asignar o preguntar.
- Declaración repetida de una variable en el mismo ámbito, incluidos parámetros.

El visitor usa una tabla de símbolos con un ámbito global y ámbitos locales
para funciones y bloques. Los parámetros comparten ámbito con el cuerpo de la
función. Se permite ocultar una variable exterior; los nombres distinguen
mayúsculas. Las declaraciones se procesan en orden de fuente, también dentro
de funciones: solo ven declaraciones exteriores anteriores a su definición.
Los nombres de funciones se tratarán por separado en una etapa posterior.

```bash
make probar ARCHIVO=tests/fixtures/invalid/variable_no_declarada.edu
make probar ARCHIVO=tests/fixtures/invalid/variable_duplicada.edu
```

Ambas entradas fallan intencionalmente con código 1 y un mensaje en español.
`make test` ejecuta 39 pruebas: 16 del lexer, 11 del parser y 12 de semántica.
La descripción de los errores para incorporar al informe está en
[../docs/semantica.md](../docs/semantica.md).

## Alcance actual

El lexer reconoce variables, entrada/salida, operaciones, lógica, comparaciones,
condicionales, ciclos, funciones, tipos, elección aleatoria y la instrucción
de motivación `juego` y `calculadora`. El parser comprueba su estructura,
la separación por líneas, los bloques y la precedencia de las expresiones.
El analizador semántico comprueba declaraciones y usos de variables. Todavía
quedan pendientes tipos, inicialización, firmas de funciones, retornos y
restricciones de los rangos aleatorios. Los programas no se ejecutan. Para el
segundo avance se deberá ampliar la semántica a por lo menos seis errores.
