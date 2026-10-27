# Deploying the prototype to the VM (13.127.29.249)

The VM is a t3.micro (≈900 MiB RAM, 8 GB disk) that already runs another
stack behind host Nginx on :80/:443. It cannot build the images: GitHub
Actions (`.github/workflows/build-and-push.yml`) builds and pushes
`ghcr.io/tihom4537/mom-frontend` and `ghcr.io/tihom4537/mom-backend` (both
public) on every push to `main`; the VM only pulls.

Microphone capture needs a secure context, so the app must be served over
HTTPS on a hostname. Live at `https://mom.monitoringandautomationsolution.site` (Let's Encrypt, auto-renews via certbot) and, with a self-signed warning, `https://13.127.29.249`.

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

## Memory/disk budget

Backend (uvicorn + sarvamai + google-generativeai) ≈ 150 MiB, frontend Nginx
< 10 MiB; images ≈ 500 MB + 50 MB. The existing stack uses ≈ 470 MiB, so
this fits with headroom and 1 GiB of swap for spikes.
