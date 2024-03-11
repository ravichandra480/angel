# Dockerfile

FROM ankane/pgvector

COPY *.sql /docker-entrypoint-initdb.d/
