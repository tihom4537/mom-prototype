#!/usr/bin/env bash
# Pull the latest images from GHCR and restart the prototype on the VM.
# Usage (on the VM):  /opt/mom/deploy.sh
# Images are built by GitHub Actions on every push to main (never build here:
# the t3.micro has <1 GB RAM and the frontend build needs more than that).
set -euo pipefail
cd "$(dirname "$0")"

docker compose pull
docker compose up -d --remove-orphans
# Drop the previous image layers so the small root disk doesn't fill up.
docker image prune -f >/dev/null

echo "--- containers ---"
docker compose ps
echo "--- health ---"
for i in $(seq 1 15); do
  if curl -fsS -o /dev/null http://127.0.0.1:8081/health; then echo "backend healthy via frontend proxy"; exit 0; fi
  sleep 2
done
echo "backend did not become healthy; last logs:" >&2
docker compose logs --tail=40 backend >&2
exit 1
