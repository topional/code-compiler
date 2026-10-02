lexer grammar EducativoLexer;

// Variables, asignaciones y entrada/salida.
// Las palabras reservadas van antes de ID para resolver empates.
CREAR     : 'crear';
VARIABLE  : 'variable';
CON       : 'con';
FIJAR     : 'fijar';
A         : 'a';
CAMBIAR   : 'cambiar';
POR       : 'por';
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

// Operacion aleatoria e instruccion de motivacion.
ELEGIR    : 'elegir';
ENTRE     : 'entre';
JUEGO     : 'juego';

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
TEXTO : '"' ('\\' ["\\nrt] | ~["\\\r\n])* '"';

// Los nombres admiten letras del español, digitos y guion bajo.
ID : LETRA (LETRA | DIGITO)*;

// Estas reglas ayudan a reconocer tokens; no producen tokens propios.
fragment DIGITO : [0-9];
fragment LETRA  : [a-zA-Z_áéíóúüñÁÉÍÓÚÜÑ];

// Conservamos los saltos: cada instruccion ocupa una linea.
SALTO_LINEA : '\r'? '\n';

COMENTARIO : '#' ~[\r\n]* -> skip;
ESPACIOS   : [ \t]+ -> skip;
