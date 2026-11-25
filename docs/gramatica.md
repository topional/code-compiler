# Gramática del lenguaje educativo

## Notación y componentes

`→` define una producción,
`|` separa alternativas, `ε` representa la cadena vacía y `⇒` indica un paso
de derivación.

Los **no terminales** son los nombres situados a la izquierda de las flechas.
Los **terminales** son las palabras y signos del lenguaje y las categorías
`id`, `num`, `cad`, `nl` y `eof`. `id` representa ID, `num` NUMERO, `cad` TEXTO,
`nl` SALTO_LINEA y `eof` EOF. `numero`, `texto` y `logico` son palabras reservadas,
no literales. `sentenciaMientras` y `expresionAleatoria` nombran estructuras;
`mientras` y `aleatorio` son terminales reservados. El símbolo inicial de la gramática completa es `programa`.

Esta es una gramática libre de contexto: cada producción tiene un solo no
terminal a la izquierda. Las reglas auxiliares con `ε` desarrollan las listas
y opciones mediante recursión y alternativas vacías, también en el parser
ANTLR. No se usan cuantificadores de repetición u opcionalidad en sus reglas.
Las llaves y los nombres de tokens de ANTLR pertenecen a la implementación,
no a las producciones presentadas aquí.

## Producciones completas

```text
programa → saltosOpt instrucciones eof
saltosOpt → nl saltosOpt | ε
lineas → nl saltosOpt
instrucciones → sentencia restoPrograma | ε
restoPrograma → lineas instrucciones | ε
sentencia → declaracion | asignacion | salida | entrada | condicional | repeticion | sentenciaMientras | funcion | retorno | llamada | motivacion
declaracion → crear variable id
asignacion → asignar id valor de expresion
salida → mostrar expresion
entrada → preguntar cad guardar en id
bloque → lineas instruccionesBloque
instruccionesBloque → sentencia lineas instruccionesBloque | ε
condicional → si expresion entonces bloque alternativa fin
alternativa → sino bloque | ε
repeticion → repetir expresion veces bloque fin
sentenciaMientras → mientras expresion hacer bloque fin
funcion → definir id ( parametrosOpt ) devuelve tipo bloque fin
parametrosOpt → parametros | ε
parametros → parametro restoParametros
restoParametros → , parametro restoParametros | ε
parametro → tipo id
tipo → numero | texto | logico
retorno → devolver expresion
llamada → id ( argumentosOpt )
argumentosOpt → argumentos | ε
argumentos → expresion restoArgumentos
restoArgumentos → , expresion restoArgumentos | ε
motivacion → juego | calculadora
expresion → disyuncion
disyuncion → conjuncion restoO
restoO → o conjuncion restoO | ε
conjuncion → negacion restoY
restoY → y negacion restoY | ε
negacion → no negacion | comparacion
comparacion → suma comparacionOpt
comparacionOpt → operadorComparacion suma | ε
operadorComparacion → es igual a | es diferente de | es mayor que | es menor que | es mayor o igual que | es menor o igual que
suma → producto restoSuma
restoSuma → + producto restoSuma | - producto restoSuma | ε
producto → unaria restoProducto
restoProducto → * unaria restoProducto | / unaria restoProducto | ε
unaria → - unaria | primaria
primaria → num | cad | verdadero | falso | llamada | id | ( expresion ) | expresionAleatoria
expresionAleatoria → numero aleatorio entre limite y limite
limite → - num | num | id
```

`asignacion`, `salida`, etc. también pueden usarse como símbolos iniciales
para estudiar una construcción por separado. Sus reglas auxiliares pertenecen
a la misma gramática; no son lenguajes diferentes.

## Decisiones de sintaxis

- Una instrucción por línea. Se permiten líneas vacías, comentarios y un archivo
  vacío. La última instrucción del programa puede terminar sin salto de línea.
- Los encabezados de bloques terminan en salto de línea. Cada instrucción del
  bloque también necesita un salto antes de `sino` o `fin`.
- La indentación ayuda a leer, pero no determina los bloques. `fin` los cierra.
  Los bloques pueden estar vacíos o anidados; cada `si` tiene su propio `fin`.
- Las declaraciones son `crear variable id`, sin valor inicial. Toda asignación
  utiliza `asignar id valor de expresion`.
- `preguntar` recibe un texto entre comillas y una variable destino.
- Los parámetros de funciones tienen tipo y nombre; van entre paréntesis y se
  separan con comas, como en `definir doble(numero dato) devuelve numero`.
  Una función sin parámetros usa `()`. La llamada también usa paréntesis, incluso
  sin argumentos. Toda definición indica el tipo de resultado con `devuelve`.
- `numero aleatorio entre limite y limite` es una expresión. Los límites son
  variables o números con signo negativo opcional. No se admiten expresiones
  aritméticas directamente como límites en esta versión.
- Una comparación contiene un solo operador. No se acepta `1 es menor que 2
  es menor que 3`; se pueden combinar dos comparaciones mediante `y`.
- En una comparación, `o` puede formar parte de `es mayor o igual que`; el
  parser lo diferencia del operador lógico `o`. La `y` del rango aleatorio
  también pertenece a esa construcción, no a una conjunción exterior.

## Precedencia de expresiones

De mayor a menor prioridad:

| Nivel | Operaciones |
| --- | --- |
| 1 | Agrupación con paréntesis y expresiones primarias |
| 2 | Menos unario: `-5` |
| 3 | Multiplicación y división: `*`, `/` |
| 4 | Suma y resta: `+`, `-` |
| 5 | Comparaciones: `es igual a`, etc. |
| 6 | Negación lógica: `no` |
| 7 | Conjunción: `y` |
| 8 | Disyunción: `o` |

Las listas de suma/resta y multiplicación/división se recorren de izquierda
a derecha en el análisis semántico. Al calcular valores numéricos conocidos,
`10 - 3 - 2` corresponde a `(10 - 3) - 2`. El generador de tres direcciones
conserva esa interpretación. El parser construye el árbol de análisis de ANTLR.
`no edad es mayor que 10` agrupa `no (edad es mayor que 10)`.

## Implementación y driver

`grammar/EducativoParser.g4` reutiliza `EducativoLexer` mediante `tokenVocab`.
Los no terminales documentados `sentenciaMientras` y `expresionAleatoria`
corresponden, respectivamente, a las reglas ANTLR `mientras` y `aleatorio`.
Los tokens siguen siendo `MIENTRAS` y `ALEATORIO`; la sintaxis escrita se conserva:
`asignar dado valor de numero aleatorio entre 1 y 6`.

`make generar` genera el lexer, el parser y el visitor base. El driver
`src/main.py` llena el flujo de tokens, detiene el análisis si hay errores
léxicos y llama a `parser.programa()`. Con `--arbol` muestra el árbol sintáctico
en texto con paréntesis después de completar la etapa seleccionada sin errores.
Los errores indican línea y columna desde 1. Los detalles de ANTLR pueden
aparecer en inglés. El driver agrega el tipo de error y su ubicación. Los
diagnósticos semánticos se construyen en Python y están escritos en español.

```bash
make probar ARCHIVO=examples/piedra_papel_tijera.edu
.venv/bin/python src/main.py examples/calculadora.edu --arbol
```

## Alcance actual

El parser valida la estructura, no los tipos ni el significado. Por ejemplo,
`mostrar desconocida`, `si 10 entonces` con su bloque, y un rango decimal o
invertido son sintácticamente válidos. El análisis semántico comprueba
declaraciones, inicialización, tipos, condiciones lógicas, comparaciones,
repeticiones, límites aleatorios, argumentos y retornos de funciones, como se
explica en [semantica.md](semantica.md). Las restricciones sobre valores que
dependen de entradas o aleatorios se comprueban en el intérprete.
`juego` y `calculadora` son marcadores informativos durante la ejecución.

## Ejemplos y validación

[derivaciones.md](derivaciones.md) contiene cuatro ejemplos desarrollados por
familia de construcciones y un quinto ejemplo para la descripción del lenguaje.
Las reglas auxiliares se desarrollan dentro de esas derivaciones.

Las 68 derivaciones y los 85 ejemplos se conservan como documentación de apoyo.
Las entradas `.edu` están en `tests/lexer/`, `tests/gramatica/` y `tests/semantica/`.
Se analizan individualmente con `make probar ARCHIVO=...`.
Consulta [la guía de entradas](../tests/README.md).

Las reglas auxiliares conservan los mismos nombres en ANTLR. Las alternativas
vacías representan `ε`; por ejemplo:

```antlr
alternativa : SINO bloque | ;
restoSuma : SUMA producto restoSuma | RESTA producto restoSuma | ;
```

La primera regla permite omitir `sino`. La segunda admite varias sumas o restas,
terminando con la alternativa vacía. `saltosOpt`, `instrucciones`,
`instruccionesBloque`, `restoParametros`, `restoArgumentos`, `restoO`, `restoY`
y `restoProducto` usan la misma idea de recursión y terminación.
`parametrosOpt`, `argumentosOpt` y `comparacionOpt` permiten omitir una estructura.
`limite` expresa sus tres alternativas directamente: `RESTA NUMERO`, `NUMERO`
o `ID`. Los terminales de las producciones se implementan con tokens del lexer;
el signo de multiplicación sigue siendo un operador del lenguaje.

Las entradas de prueba agrupan construcciones válidas y errores de estructura.
Para comprobar automáticamente las entradas de gramática:

```bash
make test GRUPO=gramatica
```

`make test` comprueba gramática y semántica. El script verifica aceptación y
rechazo por etapa. Las expresiones de precedencia y los bloques anidados pueden
inspeccionarse con `--etapa gramatica --arbol` al ejecutar `src/main.py`.
