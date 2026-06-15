#!/usr/bin/env bash
set -euo pipefail

ROOT="${DOCUMENSO_HOME:-$HOME/Services/documenso}"
TEMPLATE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CERT_DIR="$ROOT/certs"
ENV_FILE="$ROOT/.env"
POSTGRES_USER="documenso"
POSTGRES_DB="documenso"
CANONICAL_URL="${DOCUMENSO_CANONICAL_URL:-https://firma.pynkstudio.com}"
FROM_NAME="${DOCUMENSO_FROM_NAME:-PynkStudio}"
FROM_ADDRESS="${DOCUMENSO_FROM_ADDRESS:-amministrazione@pynkstudio.com}"

secret_base64() {
  openssl rand -base64 48 | tr -d '\n'
}

mkdir -p "$CERT_DIR"
cp "$TEMPLATE_DIR/compose.yml" "$ROOT/compose.yml"

POSTGRES_PASSWORD="$(secret_base64)"
NEXTAUTH_SECRET="$(secret_base64)"
ENCRYPTION_KEY="$(secret_base64)"
ENCRYPTION_SECONDARY_KEY="$(secret_base64)"
SIGNING_PASSPHRASE="$(secret_base64)"

if [[ ! -f "$CERT_DIR/documenso-signing.p12" ]]; then
  openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 -nodes \
    -subj "/C=IT/ST=MI/L=Milano/O=PynkStudio/CN=firma.pynkstudio.com" \
    -keyout "$CERT_DIR/documenso-signing.key" \
    -out "$CERT_DIR/documenso-signing.crt" >/dev/null 2>&1

  openssl pkcs12 -export \
    -out "$CERT_DIR/documenso-signing.p12" \
    -inkey "$CERT_DIR/documenso-signing.key" \
    -in "$CERT_DIR/documenso-signing.crt" \
    -passout "pass:$SIGNING_PASSPHRASE"

  chmod 600 "$CERT_DIR/documenso-signing."*
fi

if [[ -f "$ENV_FILE" ]]; then
  printf 'Esiste gia %s; non lo sovrascrivo.\n' "$ENV_FILE"
else
cat > "$ENV_FILE" <<EOF
DOCUMENSO_IMAGE_TAG=latest
CLOUDFLARED_IMAGE_TAG=latest
CLOUDFLARED_TUNNEL_TOKEN=REPLACE_WITH_CLOUDFLARE_TUNNEL_TOKEN
DOCUMENSO_LOCAL_PORT=3005

POSTGRES_USER=$POSTGRES_USER
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=$POSTGRES_DB
NEXT_PRIVATE_DATABASE_URL=postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@database:5432/$POSTGRES_DB
NEXT_PRIVATE_DIRECT_DATABASE_URL=postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@database:5432/$POSTGRES_DB

NEXTAUTH_SECRET=$NEXTAUTH_SECRET
NEXT_PRIVATE_ENCRYPTION_KEY=$ENCRYPTION_KEY
NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY=$ENCRYPTION_SECONDARY_KEY

NEXT_PUBLIC_WEBAPP_URL=$CANONICAL_URL

NEXT_PRIVATE_SMTP_TRANSPORT=resend
NEXT_PRIVATE_RESEND_API_KEY=REPLACE_WITH_RESEND_API_KEY
NEXT_PRIVATE_SMTP_FROM_NAME=$FROM_NAME
NEXT_PRIVATE_SMTP_FROM_ADDRESS=$FROM_ADDRESS

NEXT_PRIVATE_SIGNING_PASSPHRASE=$SIGNING_PASSPHRASE
NEXT_PUBLIC_UPLOAD_TRANSPORT=database
NEXT_PUBLIC_DISABLE_SIGNUP=false
NEXT_PUBLIC_DISABLE_EMAIL_PASSWORD_SIGNUP=false
NEXT_PRIVATE_ALLOWED_SIGNUP_DOMAINS=
DOCUMENSO_DISABLE_TELEMETRY=true
EOF
  chmod 600 "$ENV_FILE"
fi

printf '\nDocumenso self-hosted preparato in: %s\n' "$ROOT"
printf 'Prima di avviare: inserisci NEXT_PRIVATE_RESEND_API_KEY in %s\n' "$ENV_FILE"
printf 'Avvio: cd %s && docker compose --env-file .env -f compose.yml up -d\n' "$ROOT"
