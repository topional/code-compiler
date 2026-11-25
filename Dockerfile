FROM python:3.13-slim-bookworm AS parser

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl make openjdk-17-jre-headless \
    && rm -rf /var/lib/apt/lists/*

RUN curl --fail --silent --show-error --location \
        https://www.antlr.org/download/antlr-4.13.1-complete.jar \
        --output /usr/local/lib/antlr-4.13.1-complete.jar \
    && echo 'bc13a9c57a8dd7d5196888211e5ede657cb64a3ce968608697e4f668251a8487  /usr/local/lib/antlr-4.13.1-complete.jar' \
        | sha256sum --check

COPY Makefile ./
COPY grammar/ grammar/
RUN make generar

FROM python:3.13-slim-bookworm

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

COPY requirements.txt ./
RUN python -m pip install --no-cache-dir -r requirements.txt \
    && useradd --uid 10001 --create-home edu

COPY src/ src/
COPY --from=parser /app/src/generated/ src/generated/

USER edu
EXPOSE 10000
CMD ["sh", "-c", "exec python -m uvicorn web.api:app --app-dir src --host 0.0.0.0 --port \"${PORT:-10000}\" --workers 1 --no-proxy-headers --ws websockets-sansio --ws-max-size 1048576 --ws-per-message-deflate false --no-access-log"]
