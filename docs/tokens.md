# Léxico del lenguaje educativo

Esta es la versión inicial completa del vocabulario léxico. El lexer reconoce
tokens; las formas de instrucciones descritas aquí son propuestas para el parser.
No comprueba todavía el orden de los tokens, los tipos ni la ejecución.

## Palabras reservadas: token → lexema

| Token | Lexema |
| --- | --- |
| CREAR | crear |
| VARIABLE | variable |
| CON | con |
| FIJAR | fijar |
| A | a |
| CAMBIAR | cambiar |
| POR | por |
| MOSTRAR | mostrar |
| PREGUNTAR | preguntar |
| GUARDAR | guardar |
| EN | en |
| SI | si |
| ENTONCES | entonces |
| SINO | sino |
| FIN | fin |
| REPETIR | repetir |
| VECES | veces |
| MIENTRAS | mientras |
| HACER | hacer |
| ES | es |
| IGUAL | igual |
| DIFERENTE | diferente |
| DE | de |
| MAYOR | mayor |
| MENOR | menor |
| QUE | que |
| Y | y |
| O | o |
| NO | no |
| VERDADERO | verdadero |
| FALSO | falso |
| DEFINIR | definir |
| DEVUELVE | devuelve |
| DEVOLVER | devolver |
| TIPO_NUMERO | numero |
| TIPO_TEXTO | texto |
| TIPO_LOGICO | logico |
| ELEGIR | elegir |
| ENTRE | entre |
| JUEGO | juego |

Las palabras reservadas se escriben en minúsculas y sin tildes. Son sensibles
a mayúsculas: `mostrar` es MOSTRAR y `Mostrar` es ID. No se pueden usar como nombres.
Las palabras cortas `a`, `y` y `o` también están reservadas.

## Otros tokens

| Token | Lexemas o patrón | Ejemplos |
| --- | --- | --- |
| SUMA | `+` | `2 + 3` |
| RESTA | `-` | `edad - 1`, `-5` |
| MULT | `*` | `precio * cantidad` |
| DIV | `/` | `total / 2` |
| PAREN_IZQ | `(` | `sumar(2, 3)` |
| PAREN_DER | `)` | `sumar(2, 3)` |
| COMA | `,` | `sumar(2, 3)` |
| NUMERO | `[0-9]+ ('.' [0-9]+)?` | `0`, `10`, `3.5` |
| TEXTO | Texto entre comillas dobles | `"Hola"`, `"¡Ganaste!"` |
| ID | Letra o `_`, seguida de letras, `_` o dígitos | `puntos`, `año`, `número2` |
| SALTO_LINEA | `\n` o `\r\n` | Separación entre instrucciones |

Los identificadores admiten las letras ASCII y `áéíóúüñÁÉÍÓÚÜÑ`. Las cadenas
pueden contener otros caracteres Unicode. Los nombres distinguen mayúsculas.

NUMERO no incluye el signo: `-5` produce RESTA y NUMERO. Los decimales usan
punto y requieren dígitos a ambos lados. La notación científica no está definida.

TEXTO admite los escapes `\"`, `\\`, `\n`, `\r` y `\t`; el token conserva
el lexema original. La interpretación de esos escapes se realizará después.
Los saltos reales dentro de las comillas no están permitidos.

Los espacios y tabulaciones se descartan. Los comentarios comienzan con `#`
y llegan hasta el final de la línea. Su salto de línea se conserva. Dentro de
un texto, `#` es un carácter normal. ANTLR agrega EOF al terminar la entrada;
el archivo puede terminar con o sin un salto de línea.

## Formas propuestas para las instrucciones

```text
crear variable edad con 10
fijar edad a 11
cambiar edad por 1
mostrar edad
preguntar "Edad" y guardar en edad

si edad es mayor o igual que 12 entonces
    mostrar "Puedes participar"
sino
    mostrar "Intenta otro reto"
fin

repetir 3 veces
    mostrar "Hola"
fin

mientras edad es menor que 18 hacer
    cambiar edad por 1
fin

definir sumar con numero primero, numero segundo devuelve numero
    devolver primero + segundo
fin

mostrar sumar(2, 3)
elegir numero entre 1 y 3 y guardar en edad
juego
```

Las comparaciones propuestas son `es igual a`, `es diferente de`, `es mayor que`,
`es menor que`, `es mayor o igual que` y `es menor o igual que`. Se reconocen como
palabras independientes. El parser deberá combinarlas y diferenciar el `o`
de esas comparaciones del operador lógico. Los operadores lógicos son `y`, `o`, `no`.

Las variables se crean con un valor inicial; el análisis semántico deberá definir
y verificar su tipo. Los parámetros y resultados de funciones usan `numero`,
`texto` y `logico`. Las funciones sin parámetros podrán omitir `con ...`.
`devuelve` indica el tipo de resultado y `devolver` entrega el resultado.

`juego` será una instrucción de motivación incorporada. El lenguaje permite
escribir calculadoras y juegos sencillos usando las construcciones generales;
`calculadora` no es una palabra reservada. La operación aleatoria y el minijuego
se implementarán en el entorno de ejecución.

## Errores léxicos y pruebas

Los caracteres sin regla, las comillas sin cerrar y los escapes desconocidos
producen errores léxicos. El driver reporta su posición y termina con código 1.
Una combinación de tokens válidos en un orden incorrecto será un error sintáctico;
usar una variable no declarada será un error semántico.

```bash
make test
make probar ARCHIVO=examples/lexer_completo.edu
make probar ARCHIVO=tests/fixtures/invalid/caracter.edu
```
