# Deploy Himalaya Enterprises

Use this skill whenever code changes need to be deployed — locally or to the live server at http://187.127.147.87:8080.

## Architecture

| Service | Image | Port | Base |
|---------|-------|------|------|
| **postgres** | PostgreSQL 16-alpine | 5432 (host 5433) | — |
| **api** | `rajesh6601/himalaya-server` | 3000 (host 3001) | Node 20-alpine |
| **client** | `rajesh6601/himalaya-client` | 80 (host 8080) | Nginx 1.27-alpine (static copy, no build step) |
| **pgadmin** | dpage/pgadmin4:latest | 80 (host 5051) | — |

**Database Tables (9):** users, categories, products, orders, order_items, order_messages, favorites, contact_inquiries, audit_log

## Prerequisites (one-time setup on your machine)
- Docker Desktop installed and running
- Logged into Docker Hub: `docker login` (username: `rajesh6601`)
- `sshpass` installed: `brew install sshpass` (Mac) or `apt-get install sshpass` (Linux)
- `docker buildx` builder ready: `docker buildx create --use --name multibuilder`

---

## Local Development

### Start everything locally
```bash
docker compose up -d --build
```

### Verify locally
```bash
docker compose ps
curl http://localhost:8080              # Frontend
curl http://localhost:8080/api/health   # API health check
curl http://localhost:8080/api/products # Products from DB
```

### View logs
```bash
docker logs himalaya-entp-api --tail 20
docker logs himalaya-entp-db --tail 20
docker logs himalaya-entp-frontend --tail 20
```

### Full reset (wipes DB)
```bash
docker compose down -v
docker compose up -d --build
```

---

## SSH Connection

All VPS commands use this SSH pattern (extra flags required to avoid keyboard-interactive auth issues):
```bash
sshpass -p 'R@jeshshukl@123' ssh -o StrictHostKeyChecking=no -o PreferredAuthentications=password -o KbdInteractiveAuthentication=no root@187.127.147.87 "<command>"
```

---

## Deployment Steps

### Step 1 — Check if database schema changed
If you edited `server/db/init.sql`, the changes only apply on a fresh database (first `docker-entrypoint-initdb.d` run). For existing deployments, you must apply changes manually:

**1a.** Write an ALTER migration script:
```sql
-- Example: adding a new column
ALTER TABLE products ADD COLUMN weight_kg NUMERIC(10,2);
```

**1b.** Apply it to the running DB:
```bash
docker exec -i himalaya-entp-db psql -U himalaya_admin -d himalaya_db < migration.sql
```

**1c.** On VPS (if deployed):
```bash
sshpass -p '<VPS_PASSWORD>' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o KbdInteractiveAuthentication=no \
  <VPS_USER>@<VPS_IP> \
  "docker exec -i himalaya-entp-db psql -U himalaya_admin -d himalaya_db < /tmp/migration.sql"
```

### Step 2 — Rebuild local containers (for testing)
```bash
docker compose up -d --build
```
Check API logs to confirm startup:
```bash
docker logs himalaya-entp-api --tail 15
```

### Step 3 — Build server image for linux/amd64 and push
```bash
docker buildx build --platform linux/amd64 -t rajesh6601/himalaya-server:latest --push ./server
```

### Step 4 — Build client image for linux/amd64 and push (only if frontend changed)
```bash
docker buildx build --platform linux/amd64 -t rajesh6601/himalaya-client:latest --push ./client
```

### Step 5 — Pull latest images on VPS and restart
```bash
sshpass -p '<VPS_PASSWORD>' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o KbdInteractiveAuthentication=no \
  <VPS_USER>@<VPS_IP> \
  "cd /opt/himalaya && docker compose pull && docker compose up -d"
```

### Step 6 — Verify everything is running
```bash
sshpass -p '<VPS_PASSWORD>' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o KbdInteractiveAuthentication=no \
  <VPS_USER>@<VPS_IP> \
  "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
```

### Step 7 — Check server logs for errors
```bash
sshpass -p '<VPS_PASSWORD>' ssh -o StrictHostKeyChecking=no \
  -o PreferredAuthentications=password -o KbdInteractiveAuthentication=no \
  <VPS_USER>@<VPS_IP> \
  "docker logs himalaya-entp-api --tail 20"
```

---

## Quick Reference

| What changed | Steps to run |
|---|---|
| Server code only (no schema change) | 3 → 5 → 6 → 7 |
| Database schema changed | 1 → 2 → 3 → 5 → 6 → 7 |
| Frontend only | 4 → 5 → 6 |
| Both frontend and backend | 3 → 4 → 5 → 6 → 7 |
| Both + schema change | 1 → 2 → 3 → 4 → 5 → 6 → 7 |

---

## Infrastructure

- **VPS IP:** `187.127.147.87`
- **VPS user:** `root`
- **VPS password:** `R@jeshshukl@123`
- **App directory on VPS:** `/opt/himalaya`
- **Docker Hub:** `rajesh6601/himalaya-server` and `rajesh6601/himalaya-client`
- **Local DB URL:** `postgres://himalaya_admin:H1m@l4y4_Entp_2024@localhost:5433/himalaya_db`
- **Frontend:** http://localhost:8080 *(local)* / http://187.127.147.87:8080 *(production)*
- **API:** http://localhost:8080/api *(local)* / http://187.127.147.87:8080/api *(production)*
- **pgAdmin:** http://localhost:5051 *(local only)*

## Environment Variables (Production)

Set these in `/opt/himalaya/.env` on the VPS:

| Variable | Purpose |
|----------|---------|
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | PostgreSQL credentials |
| `JWT_SECRET` | Auth token signing (change from default) |
| `API_PORT` | Node API host port (default 3001) |
| `NGINX_PORT` | Frontend host port (default 8080) |
| `PGADMIN_EMAIL` / `PGADMIN_PASSWORD` | pgAdmin login |
| `PGADMIN_PORT` | pgAdmin host port (default 5051) |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/health` | No | Health check + DB status |
| POST | `/api/auth/login` | No | Login, returns JWT |
| POST | `/api/auth/register` | No | Register new user |
| GET | `/api/products` | No | List all products (with category filter) |
| GET | `/api/products/:id` | No | Single product detail |
| POST | `/api/products` | Supplier | Create product |
| PUT | `/api/products/:id` | Supplier | Update product |
| PATCH | `/api/products/:id/stock` | Supplier | Update stock |
| DELETE | `/api/products/:id` | Supplier | Delete product |
| GET | `/api/orders` | Yes | List orders (buyer sees own, supplier sees all) |
| POST | `/api/orders` | Yes | Place order |
| GET | `/api/orders/:id` | Yes | Single order detail (buyer info, items, latest quote, message count) |
| GET | `/api/orders/:id/messages` | Yes | Negotiation thread (all messages ordered by created_at) |
| GET | `/api/orders/:id/po` | Yes | Download Purchase Order PDF (only for po_issued/in-progress/completed) |
| POST | `/api/orders/:id/messages` | Yes | Send quote/counter-offer/comment/acceptance/rejection |
| PATCH | `/api/orders/:id/status` | Yes | Update order status (supplier: any valid; buyer: po_issued, cancelled) |
| GET | `/api/favorites` | Yes | List user favorites |
| POST | `/api/favorites/:productId` | Yes | Add to favorites |
| DELETE | `/api/favorites/:productId` | Yes | Remove from favorites |
| POST | `/api/contact` | No | Submit contact inquiry |
| GET | `/api/categories` | No | List product categories |

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Supplier | admin@himalayaentp.com | admin123 |
| Buyer | ramesh@example.com | buyer123 |

---

## RFQ Negotiation Workflow

The system supports a full RFQ lifecycle:

```
Buyer sends RFQ → Supplier reviews → Supplier sends Quote → Buyer reviews
→ Negotiation (counter-offers) → Agreement → Purchase Order → Fulfillment
```

**Order statuses:** pending → quoted → negotiating → accepted → po_issued → in-progress → completed

**Status transitions are driven by messages:**
| Current Status | Message Type | Sender | New Status |
|---|---|---|---|
| pending | quote | supplier | quoted |
| quoted | counter_offer | buyer | negotiating |
| quoted | acceptance | buyer | accepted |
| quoted/negotiating | rejection | any | cancelled |
| negotiating | quote (revised) | supplier | negotiating |
| negotiating | counter_offer | buyer | negotiating |
| negotiating | acceptance | any | accepted |
| any | comment | any | unchanged |

**Migration for existing deployments:**
```bash
# Local
docker exec -i himalaya-entp-db psql -U himalaya_admin -d himalaya_db < server/db/migrate-001-negotiation.sql

# VPS
sshpass -p '<VPS_PASSWORD>' scp server/db/migrate-001-negotiation.sql root@187.127.147.87:/tmp/
sshpass -p '<VPS_PASSWORD>' ssh -o StrictHostKeyChecking=no -o PreferredAuthentications=password -o KbdInteractiveAuthentication=no root@187.127.147.87 \
  "docker exec -i himalaya-entp-db psql -U himalaya_admin -d himalaya_db < /tmp/migrate-001-negotiation.sql"
```

---

## Common Issues

**"Container name already in use"** — A previous container wasn't removed. Run `docker rm -f himalaya-entp-db himalaya-entp-api himalaya-entp-frontend himalaya-entp-pgadmin` then retry.

**"no matching manifest for linux/amd64"** — You built the image on Apple Silicon (ARM). Always use `--platform linux/amd64` with `docker buildx build`.

**init.sql not applied** — The `docker-entrypoint-initdb.d` scripts only run on a fresh volume. To re-seed: `docker compose down -v && docker compose up -d --build`.

**API returns "database disconnected"** — The `postgres` container may not be healthy yet. The API depends on the health check. Wait a few seconds and retry, or check DB logs: `docker logs himalaya-entp-db --tail 20`.

**Nginx 502 Bad Gateway** — The client container can't reach the API. Verify the API container is running: `docker compose ps`. The nginx config proxies `/api/` to `http://api:3000` using Docker's internal DNS.

**Port conflicts** — Default ports (8080, 3001, 5433, 5051) can be changed in `.env`. If another service uses port 8080, set `NGINX_PORT=8081` in `.env`.

---

## Key Tech Versions

| Component | Version |
|-----------|---------|
| Node.js | 20-alpine |
| PostgreSQL | 16-alpine |
| Nginx | 1.27-alpine |
| Express | ^4.18.2 |
| pg (node-postgres) | ^8.12.0 |
| bcryptjs | ^2.4.3 |
| jsonwebtoken | ^9.0.2 |
| pdfkit | ^0.15.0 |
