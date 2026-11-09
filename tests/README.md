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
termina con código de error; es lo esperado para ese ejemplo. No hay comparación
automática de resultados ni archivos de resultados esperados.

Para ver el árbol sintáctico, después de generar el parser con `make generar`:

```bash
.venv/bin/python src/main.py tests/gramatica/validos/precedencia_y_logica.edu --etapa gramatica --arbol
```

Una entrada válida para el lexer o la gramática puede fallar en una etapa posterior.
Por ejemplo, `gramatica/validos/precedencia_y_logica.edu` usa `puntos` sin declarar:
su estructura es válida, pero su semántica no.

El proyecto todavía analiza los programas; no ejecuta sus instrucciones.
