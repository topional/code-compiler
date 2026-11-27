"""Compara cada derivación de docs/derivaciones.md con la derivación por la
izquierda que sale del árbol real de ANTLR.

Requiere `make generar`. Uso, desde la raíz del repositorio:
    .venv/bin/python scripts/verificar_derivaciones.py [otro_documento.md]
Termina con código 1 si alguna derivación difiere.
"""
import re
import sys
from pathlib import Path

raiz = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(raiz / "src"))

from antlr4 import CommonTokenStream, InputStream, Token  # noqa: E402
from antlr4.error.ErrorListener import ErrorListener  # noqa: E402
from antlr4.tree.Tree import TerminalNode  # noqa: E402
from generated.EducativoLexer import EducativoLexer  # noqa: E402
from generated.EducativoParser import EducativoParser  # noqa: E402

RENOMBRE = {"mientras": "sentenciaMientras", "aleatorio": "expresionAleatoria"}
CATEGORIA = {"ID": "id", "NUMERO": "num", "TEXTO": "cad", "SALTO_LINEA": "nl"}


class Errores(ErrorListener):
    def __init__(self):
        self.lista = []

    def syntaxError(self, rec, sym, line, col, msg, e):
        self.lista.append(f"{line}:{col + 1} {msg}")


def terminal(nodo):
    tok = nodo.getSymbol()
    if tok.type == Token.EOF:
        return "eof"
    nombre = EducativoLexer.symbolicNames[tok.type]
    return CATEGORIA.get(nombre, tok.text.lower())


def regla(ctx):
    nombre = EducativoParser.ruleNames[ctx.getRuleIndex()]
    return RENOMBRE.get(nombre, nombre)


def forma(simbolos):
    return " ".join(terminal(s) if isinstance(s, TerminalNode) else regla(s) for s in simbolos)


def derivar(ctx):
    """Formas sentenciales de la derivación por la izquierda desde ctx."""
    formas = [forma([ctx])]
    actual = [ctx]
    while True:
        i = next((k for k, s in enumerate(actual) if not isinstance(s, TerminalNode)), None)
        if i is None:
            return formas
        hijos = list(actual[i].getChildren()) if actual[i].getChildCount() else []
        actual = actual[:i] + hijos + actual[i + 1:]
        formas.append(forma(actual))


def buscar(ctx, nombre):
    if not isinstance(ctx, TerminalNode):
        if regla(ctx) == nombre:
            return ctx
        for hijo in ctx.getChildren():
            encontrado = buscar(hijo, nombre)
            if encontrado is not None:
                return encontrado
    return None


def normalizar(linea):
    linea = linea.strip()
    if linea.startswith("⇒"):
        linea = linea[1:]
    linea = re.sub(r"([(),])", r" \1 ", linea)  # "(parametrosOpt)" = "( parametrosOpt )"
    return " ".join(linea.replace("ε", "").split())


documento = Path(sys.argv[1]) if len(sys.argv) > 1 else raiz / "docs" / "derivaciones.md"
texto = documento.read_text(encoding="utf-8")
bloques = re.split(r"^(## .+|### .+)$", texto, flags=re.M)
seccion = ""
total = fallos = 0
for k in range(1, len(bloques), 2):
    titulo, cuerpo = bloques[k], bloques[k + 1]
    if titulo.startswith("## "):
        seccion = titulo[3:]
        continue
    codigos = re.findall(r"```text\n(.*?)```", cuerpo, flags=re.S)
    if len(codigos) < 2:
        continue
    fuente, derivacion = codigos[0], codigos[1]
    # El salto final pertenece al bloque Markdown, no al programa.
    fuente = fuente[:-1] if fuente.endswith("\n") else fuente
    lineas = [normalizar(l) for l in derivacion.strip().splitlines() if l.strip()]
    inicial = lineas[0]
    total += 1
    nombre = f"{seccion} / {titulo[4:]}"

    lexer = EducativoLexer(InputStream(fuente))
    err = Errores()
    lexer.removeErrorListeners(); lexer.addErrorListener(err)
    parser = EducativoParser(CommonTokenStream(lexer))
    parser.removeErrorListeners(); parser.addErrorListener(err)
    arbol = parser.programa()
    if err.lista:
        fallos += 1
        print(f"FALLO {nombre}: el parser rechaza la fuente: {err.lista}")
        continue
    sub = buscar(arbol, inicial)
    if sub is None:
        fallos += 1
        print(f"FALLO {nombre}: no hay nodo '{inicial}' en el árbol")
        continue
    esperado = [" ".join(f.split()) for f in derivar(sub)]
    if esperado == lineas:
        print(f"OK    {nombre} ({len(lineas) - 1} pasos)")
        continue
    fallos += 1
    print(f"FALLO {nombre}: {len(lineas) - 1} pasos escritos, {len(esperado) - 1} reales")
    for n, (a, b) in enumerate(zip(lineas, esperado)):
        if a != b:
            print(f"      paso {n}:\n        escrito: {a}\n        real:    {b}")
            break
    else:
        corto = lineas if len(lineas) > len(esperado) else esperado
        print(f"      difieren a partir del paso {min(len(lineas), len(esperado))}: {corto[min(len(lineas), len(esperado))]}")

print(f"{total} derivaciones revisadas: {total - fallos} correctas y {fallos} con diferencias.")
sys.exit(1 if fallos else 0)
