# Lenguaje educativo

Proyecto de un lenguaje textual en español para facilitar la transición desde
Scratch. La versión actual implementa el análisis léxico con ANTLR4 y Python.
Las reglas propuestas están documentadas en [docs/tokens.md](docs/tokens.md).

## Preparación

Se necesita Python 3, Java, Make y el generador de ANTLR 4.13.1.

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
make test
```

`make probar` usa el Python de `.venv`, incluso si el entorno no está activado.
Los archivos de `src/generated/` se generan desde la gramática y se excluyen de Git.
Cada integrante debe ejecutar `make generar` después de clonar el repositorio.

El driver muestra línea, columna, token y lexema. Ante un error léxico termina
con código 1; si el archivo no se puede leer, con código 2. Por ejemplo:

```bash
make probar ARCHIVO=tests/fixtures/invalid/caracter.edu
```

Esa prueba falla intencionalmente porque `@` no está definido.

## Alcance actual

El lexer reconoce variables, entrada/salida, operaciones, lógica, comparaciones,
condicionales, ciclos, funciones, tipos, elección aleatoria y la instrucción
de motivación `juego`. Los programas todavía no se ejecutan. Las siguientes
etapas son el parser, el análisis semántico y la generación/ejecución de código.
