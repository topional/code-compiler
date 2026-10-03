lexer grammar EducativoLexer;
options {
    caseInsensitive = true;
}
// Variables, asignaciones y entrada/salida.
// Formas propuestas: crear variable ID / asignar ID valor de EXPRESION.
// Las palabras reservadas van antes de ID para resolver empates.
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

// Bloques de control.
SI        : 'si';
ENTONCES  : 'entonces';
SINO      : 'sino';
FIN       : 'fin';
REPETIR   : 'repetir';
VECES     : 'veces';
MIENTRAS  : 'mientras';
HACER     : 'hacer';

// Las comparaciones de varias palabras se combinan en el parser.
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

// Funciones y tipos para parametros/resultados.
DEFINIR     : 'definir';
DEVUELVE    : 'devuelve';
DEVOLVER    : 'devolver';
TIPO_NUMERO : 'numero';
TIPO_TEXTO  : 'texto';
TIPO_LOGICO : 'logico';

// Expresion propuesta: numero aleatorio entre LIMITE y LIMITE.
ALEATORIO : 'aleatorio';
ENTRE     : 'entre';
JUEGO     : 'juego';
CALCULADORA : 'calculadora';

// El signo negativo se reconoce por separado del numero.
SUMA      : '+';
RESTA     : '-';
MULT      : '*';
DIV       : '/';
PAREN_IZQ : '(';
PAREN_DER : ')';
COMA      : ',';

NUMERO : DIGITO+ ('.' DIGITO+)?;

// Texto entre comillas. Admite \" , \\ , \n , \r y \t.
// Los escapes mantienen sus formas exactas, aunque las palabras ignoren el caso.
TEXTO options { caseInsensitive = false; }
    : '"' ('\\' ["\\nrt] | ~["\\\r\n])* '"';

// Los nombres admiten letras del español, digitos y guion bajo.
ID : LETRA (LETRA | DIGITO)*;

// Estas reglas ayudan a reconocer tokens; no producen tokens propios.
fragment DIGITO : [0-9];
fragment LETRA  : [a-z_áéíóúüñ];

// Conservamos los saltos: cada instruccion ocupa una linea.
SALTO_LINEA : '\r'? '\n';

COMENTARIO : '#' ~[\r\n]* -> skip;
ESPACIOS   : [ \t]+ -> skip;
