parser grammar EducativoParser;

options {
    tokenVocab = EducativoLexer;
}

// Una alternativa sin símbolos representa epsilon.
// Una instrucción por línea; la última puede terminar en EOF.
programa : saltosOpt instrucciones EOF;
saltosOpt : SALTO_LINEA saltosOpt | ;
lineas : SALTO_LINEA saltosOpt;
instrucciones : sentencia restoPrograma | ;
restoPrograma : lineas instrucciones | ;

sentencia
    : declaracion
    | asignacion
    | salida
    | entrada
    | condicional
    | repeticion
    | mientras
    | funcion
    | retorno
    | llamada
    | motivacion
    ;

declaracion : CREAR VARIABLE ID;
asignacion : ASIGNAR ID VALOR DE expresion;
salida : MOSTRAR expresion;
entrada : PREGUNTAR TEXTO Y GUARDAR EN ID;

// El encabezado y las instrucciones del bloque necesitan un salto.
// Los bloques pueden estar vacíos o anidados.
bloque : lineas instruccionesBloque;
instruccionesBloque : sentencia lineas instruccionesBloque | ;

condicional : SI expresion ENTONCES bloque alternativa FIN;
alternativa : SINO bloque | ;
repeticion : REPETIR expresion VECES bloque FIN;
mientras : MIENTRAS expresion HACER bloque FIN;

funcion : DEFINIR ID parametrosOpt DEVUELVE tipo bloque FIN;
parametrosOpt : CON parametros | ;
parametros : parametro restoParametros;
restoParametros : COMA parametro restoParametros | ;
parametro : tipo ID;
tipo : TIPO_NUMERO | TIPO_TEXTO | TIPO_LOGICO;
retorno : DEVOLVER expresion;
llamada : ID PAREN_IZQ argumentosOpt PAREN_DER;
argumentosOpt : argumentos | ;
argumentos : expresion restoArgumentos;
restoArgumentos : COMA expresion restoArgumentos | ;
motivacion : JUEGO | CALCULADORA;

// Prioridad: disyunción, conjunción, negación, comparación, suma, producto y unaria.
// Las operaciones aritméticas se leen de izquierda a derecha.
expresion : disyuncion;
disyuncion : conjuncion restoO;
restoO : O conjuncion restoO | ;
conjuncion : negacion restoY;
restoY : Y negacion restoY | ;
negacion : NO negacion | comparacion;
comparacion : suma comparacionOpt;
comparacionOpt : operadorComparacion suma | ;
operadorComparacion
    : ES IGUAL A
    | ES DIFERENTE DE
    | ES MAYOR QUE
    | ES MENOR QUE
    | ES MAYOR O IGUAL QUE
    | ES MENOR O IGUAL QUE
    ;
suma : producto restoSuma;
restoSuma : SUMA producto restoSuma | RESTA producto restoSuma | ;
producto : unaria restoProducto;
restoProducto : MULT unaria restoProducto | DIV unaria restoProducto | ;
unaria : RESTA unaria | primaria;
primaria
    : NUMERO
    | TEXTO
    | VERDADERO
    | FALSO
    | llamada
    | ID
    | PAREN_IZQ expresion PAREN_DER
    | aleatorio
    ;

// Límites: números con menos opcional o variables.
// Falta validar los tipos y el orden del rango.
aleatorio : TIPO_NUMERO ALEATORIO ENTRE limite Y limite;
limite : RESTA NUMERO | NUMERO | ID;
