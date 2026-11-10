# Entradas para probar el analizador

Las carpetas `lexer/`, `gramatica/` y `semantica/` contienen archivos de texto
`.edu`. Cada una separa `validos/` e `invalidos/` para indicar qué resultado
deberías observar al analizarlos en esa etapa.

Desde la raíz del proyecto, elige una entrada:

```bash
# Ver sus tokens, sin pasar al parser.
make probar ETAPA=lexer ARCHIVO=tests/lexer/validos/palabras_y_nombres.edu

# Revisar la estructura, sin pasar a semántica.
make probar ETAPA=gramatica ARCHIVO=tests/gramatica/validos/construcciones.edu

# Revisar también la semántica (etapa predeterminada).
make probar ARCHIVO=tests/semantica/validos/programa_completo.edu

# Observar los errores de una entrada inválida.
make probar ARCHIVO=tests/semantica/invalidos/repeticiones.edu
```

Revisa los tokens o mensajes que aparecen en la terminal. Una entrada inválida
termina con código de error; es lo esperado para ese ejemplo.

## Automatización de gramática y semántica

```bash
# Ambas etapas (el lexer no tiene pruebas automáticas).
make test

# Una sola etapa.
make test GRUPO=gramatica
make test GRUPO=semantica
```

El script Bash `scripts/probar_entradas.sh` recorre las entradas `.edu` de esas
dos etapas. En `validos/` exige código de salida 0, ausencia de errores y la
confirmación del análisis. En `invalidos/` exige código 1 y diagnósticos de la
etapa correspondiente. Por ejemplo, una entrada semántica que falla en sintaxis
no pasa la prueba. Tampoco pasa si aparece una excepción de Python.

Al finalizar muestra el total de aciertos y fallos. Si falla alguna prueba, el
comando termina con un código distinto de cero. La carpeta define el resultado
esperado: no se necesitan tests Python ni archivos `.error`.

Estas comprobaciones verifican aceptación y rechazo por etapa; no comparan el
mensaje exacto, el número de errores ni la estructura interna del árbol.

Para ver el árbol sintáctico, después de generar el parser con `make generar`:

```bash
.venv/bin/python src/main.py tests/gramatica/validos/precedencia_y_logica.edu --etapa gramatica --arbol
```

Una entrada válida para el lexer o la gramática puede fallar en una etapa posterior.
Por ejemplo, `gramatica/validos/precedencia_y_logica.edu` usa `puntos` sin declarar:
su estructura es válida, pero su semántica no.

El proyecto todavía analiza los programas; no ejecuta sus instrucciones.
