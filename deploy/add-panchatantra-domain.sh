#!/usr/bin/env bash
# Run ON the MoM VM (13.127.29.249) as ubuntu. Idempotent.
# Adds panchatantra.bharatdigital.org to the host Nginx site, installs the
# Cloudflare real-IP snippet, and extends the Let's Encrypt cert to cover it.
set -euo pipefail
SITE=/etc/nginx/sites-available/mom
NEW=panchatantra.bharatdigital.org
OLD=mom.monitoringandautomationsolution.site

sudo install -m 644 "$(dirname "$0")/cloudflare-real-ip.conf" /etc/nginx/snippets/cloudflare-real-ip.conf

# 1. server_name in every server block of the site (80 and certbot's 443)
if ! grep -q "$NEW" "$SITE"; then
  sudo sed -i -E "s/^(\s*server_name\s+)/\1$NEW /" "$SITE"
fi
# 2. real-ip include, once, right after the first server_name line
if ! grep -q cloudflare-real-ip "$SITE"; then
  sudo sed -i "0,/^\s*server_name /s//    include \/etc\/nginx\/snippets\/cloudflare-real-ip.conf;\n&/" "$SITE"
fi
sudo nginx -t && sudo systemctl reload nginx

# 3. certificate: expand the existing cert to both names (HTTP-01 via Cloudflare proxy works)
sudo certbot --nginx --non-interactive --agree-tos --keep-until-expiring --expand \
  --cert-name "$OLD" -d "$OLD" -d "$NEW"
sudo nginx -t && sudo systemctl reload nginx

echo; sudo certbot certificates | grep -A3 "Certificate Name: $OLD"
curl -sS -o /dev/null -w "local https check: %{http_code}\n" -k -H "Host: $NEW" https://127.0.0.1/api/health
