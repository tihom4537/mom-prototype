FROM python:3.11-slim

WORKDIR /app

# ca-certificates for outbound HTTPS; Pango/HarfBuzz/FreeType are WeasyPrint's
# native text stack (the Noto fonts it uses are bundled in the package).
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz0b \
    libharfbuzz-subset0 \
    libfontconfig1 \
    libfreetype6 \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY gram_panchayat_api ./gram_panchayat_api
COPY scripts ./scripts

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "gram_panchayat_api.main:app", "--host", "0.0.0.0", "--port", "8000"]

