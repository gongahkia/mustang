FROM python:3.10-slim-bullseye AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.10-slim-bullseye
WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    FLASK_ENV=production

RUN apt-get update && \
    apt-get install -y --no-install-recommends libssl-dev && \
    rm -rf /var/lib/apt/lists/* && \
    addgroup --system app && \
    adduser --system --no-create-home --ingroup app app

COPY --from=builder /root/.local /usr/local
COPY . .

RUN chown -R app:app /app
USER app

EXPOSE 5000
CMD ["gunicorn", "--config", "config/gunicorn.conf.py", "wsgi:app"]