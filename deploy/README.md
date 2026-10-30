# Deploying the prototype to the VM (13.127.29.249)

The VM is a t3.micro (≈900 MiB RAM, 8 GB disk) that already runs another
stack behind host Nginx on :80/:443. It cannot build the images: GitHub
Actions (`.github/workflows/build-and-push.yml`) builds and pushes
`ghcr.io/tihom4537/mom-frontend` and `ghcr.io/tihom4537/mom-backend` (both
public) on every push to `main`; the VM only pulls.

Microphone capture needs a secure context, so the app must be served over
HTTPS on a hostname. Live at `https://panchatantra.bharatdigital.org` (DNS proxied through Cloudflare) and
`https://mom.monitoringandautomationsolution.site`; both names are on one Let's Encrypt cert that
auto-renews via certbot. To add the Cloudflare-fronted name to an existing VM, copy `deploy/` to the
VM and run `deploy/add-panchatantra-domain.sh` there, then set Cloudflare SSL/TLS mode to **Full (strict)**.

## One-time setup

1. **Grow the disk** (AWS console → EC2 → Volumes → the 8 GB volume of
   `i-0fbd95ff447f828c6` in ap-south-1 → Modify → 20 GB). Then on the VM:
   `sudo growpart /dev/nvme0n1 1 && sudo resize2fs /dev/nvme0n1p1`. Online, no reboot.
2. **DNS**: add an `A` record `mom` → `13.127.29.249` at the domain's DNS
   provider (dns-parking.com / Hostinger for monitoringandautomationsolution.site).
3. **Files on the VM**:
   ```bash
   sudo mkdir -p /opt/mom && sudo chown ubuntu:ubuntu /opt/mom
   # from your machine:
   scp -i ~/Downloads/mom_feedback_api.pem docker-compose.yml deploy/deploy.sh ubuntu@13.127.29.249:/opt/mom/
   scp -i ~/Downloads/mom_feedback_api.pem deploy/.env.example ubuntu@13.127.29.249:/opt/mom/.env   # then fill in the keys, chmod 600
   ```
4. **Host Nginx + TLS** (on the VM):
   ```bash
   sudo cp /opt/mom/mom.nginx.conf /etc/nginx/sites-available/mom      # scp it first
   sudo ln -s /etc/nginx/sites-available/mom /etc/nginx/sites-enabled/mom
   sudo nginx -t && sudo systemctl reload nginx
   sudo certbot --nginx -d mom.monitoringandautomationsolution.site
   ```
5. **First start**: `/opt/mom/deploy.sh`

## Every later release

Push to `main`, wait for the "Build and push Docker images" workflow to go
green, then on the VM run `/opt/mom/deploy.sh` (pull + up + prune).

## Authentication (RS256 JWT, verify-only)

The backend verifies a JWT on `/feedback`, `/speech-to-text`, `/translate`, `/ocr`
and the WebSocket; `/health` stays open. We generated the keypair; the backend holds
only the public key (`JWT_PUBLIC_KEY` in `.env`, one line with literal `\n`), the
caller signs with the private key. `JWT_AUDIENCE=mom-api` is enforced.

- The frontend container attaches a long-lived token (`FRONTEND_API_TOKEN`) in its
  Nginx proxy config, so the browser bundle never holds a secret.
- Mint tokens with `FASTAPI-MoM/scripts/make_test_token.py <private.pem>`
  (`JWT_AUDIENCE=mom-api TEST_TOKEN_TTL=<seconds> TEST_TOKEN_SUB=<name>`).
- Rotate: generate a new pair with `scripts/generate_jwt_keys.py`, update
  `JWT_PUBLIC_KEY` and `FRONTEND_API_TOKEN`, redeploy, hand the new private key to the caller.

### Two entry points on the host Nginx

- `/api/...` → backend directly (`127.0.0.1:8000`), JWT required. **This is the integrator path.**
- `/feedback`, `/ws/...` etc. (no prefix) → frontend container → backend, with the frontend's
  Nginx attaching `FRONTEND_API_TOKEN`. This exists for the demo SPA only; because the proxy
  attaches the token for any caller, it is effectively open. Gate it (basic auth on the SPA
  server block) or remove it before the URL is shared beyond the evaluation team.

## Workers

The backend runs `WEB_CONCURRENCY` uvicorn worker processes (default 2, one per vCPU;
set in `docker-compose.yml`). Each worker holds its own asyncpg pool (max 5) and HTTP
client; the app is stateless across workers because feedback rounds live in Postgres.
Measured on the t3.micro: 2 workers ≈ 166 MiB total.

## Database

`docker-compose.yml` runs `postgres:17-alpine` on the named volume `mom_mom-pgdata`
(survives `down`, upgrades and reboots; only `down -v` deletes it). The backend
creates/upgrades the audit tables `ai_feedback` and `stt_sessions` at startup.
`POSTGRES_PASSWORD` must be in `/opt/mom/.env`. Useful commands on the VM:

```bash
docker exec mom-postgres-1 psql -U mom -d mom -c 'select count(*) from ai_feedback'
docker exec mom-postgres-1 pg_dump -U mom -d mom | gzip > /opt/mom/backup-$(date +%F).sql.gz   # manual backup
```

Nightly `pg_dump` to S3 is planned (needs a bucket and an instance IAM role).

## Memory/disk budget

Backend (uvicorn + sarvamai + google-generativeai) ≈ 150 MiB, frontend Nginx
< 10 MiB; images ≈ 500 MB + 50 MB. Postgres idles at ≈ 56 MiB. Measured on 27 Oct 2026 with all three
containers up: 423 MB RAM available, 1 GiB swap mostly free.
