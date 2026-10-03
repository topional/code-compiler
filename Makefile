ANTLR_JAR ?= /usr/local/lib/antlr-4.13.1-complete.jar
PYTHON ?= .venv/bin/python
ARCHIVO ?= examples/variables.edu

.PHONY: generar probar test

generar: src/generated/EducativoLexer.py src/generated/EducativoParser.py src/generated/EducativoParserVisitor.py

src/generated/EducativoLexer.py src/generated/EducativoLexer.tokens &: grammar/EducativoLexer.g4
	mkdir -p src/generated
	java -jar "$(ANTLR_JAR)" -Dlanguage=Python3 -Xexact-output-dir -o src/generated "$<"

src/generated/EducativoParser.py src/generated/EducativoParserVisitor.py &: grammar/EducativoParser.g4 src/generated/EducativoLexer.tokens
	java -jar "$(ANTLR_JAR)" -Dlanguage=Python3 -visitor -no-listener -lib src/generated -Xexact-output-dir -o src/generated "$<"

probar: generar
	$(PYTHON) src/main.py "$(ARCHIVO)"

test: generar
	$(PYTHON) -m unittest discover -s tests -p 'test_*.py' -v
