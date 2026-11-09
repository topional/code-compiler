lexer grammar EducativoLexer;

// Configuración del lexer
options {
    caseInsensitive = true;
}
// Palabras reservadas: variables y entrada/salida
// Las palabras reservadas van antes de ID.
CREAR     : 'crear';
VARIABLE  : 'variable';
CON       : 'con';
ASIGNAR   : 'asignar';
VALOR     : 'valor';
A         : 'a';
MOSTRAR   : 'mostrar';
PREGUNTAR : 'preguntar';
GUARDAR   : 'guardar';
EN        : 'en';

// Palabras reservadas: condiciones y ciclos
SI        : 'si';
ENTONCES  : 'entonces';
SINO      : 'sino';
FIN       : 'fin';
REPETIR   : 'repetir';
VECES     : 'veces';
MIENTRAS  : 'mientras';
HACER     : 'hacer';

// Comparaciones, lógica y valores lógicos
// El parser une las palabras de cada comparación.
ES        : 'es';
IGUAL     : 'igual';
DIFERENTE : 'diferente';
DE        : 'de';
MAYOR     : 'mayor';
MENOR     : 'menor';
QUE       : 'que';
Y         : 'y';
O         : 'o';
NO        : 'no';
VERDADERO : 'verdadero';
FALSO     : 'falso';

// Palabras reservadas: funciones y tipos
DEFINIR     : 'definir';
DEVUELVE    : 'devuelve';
DEVOLVER    : 'devolver';
TIPO_NUMERO : 'numero';
TIPO_TEXTO  : 'texto';
TIPO_LOGICO : 'logico';

// Aleatorio e instrucciones de motivación
ALEATORIO : 'aleatorio';
ENTRE     : 'entre';
JUEGO     : 'juego';
CALCULADORA : 'calculadora';

// Operadores aritméticos y signos de puntuación
// El signo menos es un token aparte.
SUMA      : '+';
RESTA     : '-';
MULT      : '*';
DIV       : '/';
PAREN_IZQ : '(';
PAREN_DER : ')';
COMA      : ',';

// Literales e identificadores
NUMERO : DIGITO+ ('.' DIGITO+)?;

// Texto entre comillas. Admite \" , \\ , \n , \r y \t.
// Los escapes distinguen mayúsculas.
TEXTO options { caseInsensitive = false; }
    : '"' ('\\' ["\\nrt] | ~["\\\r\n])* '"';

// Nombres con letras, dígitos y guion bajo.
ID : LETRA (LETRA | DIGITO)*;

// Fragmentos auxiliares: no generan tokens
fragment DIGITO : [0-9];
fragment LETRA  : [a-z_áéíóúüñ];

// Saltos de línea, comentarios y espacios
// Conservamos los saltos de línea.
SALTO_LINEA : '\r'? '\n';

COMENTARIO : '#' ~[\r\n]* -> skip;
ESPACIOS   : [ \t]+ -> skip;
