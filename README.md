# Himalaya Enterprises

Interactive B2B platform for Himalaya Enterprises, a premier automobile body manufacturer based in Jamshedpur, India.

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Docker Host                          │
│                                                          │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────┐     │
│  │  client   │   │     api      │   │  postgresql  │     │
│  │  (nginx)  │──▶│  (node.js)   │──▶│  (database)  │     │
│  │  :8080    │   │  :3001       │   │  :5433       │     │
│  └──────────┘   └──────────────┘   └──────────────┘     │
│                                                          │
│  ┌──────────────┐                                        │
│  │   pgadmin     │  (optional DB management UI)          │
│  │   :5051       │                                       │
│  └──────────────┘                                        │
└──────────────────────────────────────────────────────────┘
```

| Service    | Description                                 | URL                        |
|------------|---------------------------------------------|----------------------------|
| client     | Static frontend (HTML/CSS/JS) via nginx     | http://localhost:8080       |
| api        | REST API (products, orders, auth)            | http://localhost:8080/api/  |
| postgres   | PostgreSQL database                          | localhost:5433              |
| pgadmin    | Database admin panel                         | http://localhost:5051       |

## Project Structure

```
HimalayaEntp/
├── client/              # Frontend (static HTML/CSS/JS)
│   ├── Dockerfile       # nginx container for static files
│   ├── nginx.conf       # Reverse proxy config (API → Node)
│   ├── index.html
│   ├── css/
│   ├── js/
│   ├── pages/
│   └── assets/
├── server/              # Backend (Node.js REST API)
│   ├── Dockerfile
│   ├── server.js
│   ├── package.json
│   └── db/
│       ├── init.sql     # Database schema & seed data
│       └── connection.js
├── docker-compose.yml
├── .env                 # Environment variables (not committed)
├── .env.example         # Template for .env
└── skills/SKILL.md      # Product & business reference
```

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)

## Getting Started

1. Clone the repository and enter the project directory.

2. Copy the environment template and edit as needed:
   ```bash
   cp .env.example .env
   ```

3. Build and start all services:
   ```bash
   docker compose up --build
   ```

4. Open the app at **http://localhost:8080**.

## Stopping Services

```bash
docker compose down
```

To also remove the database volume (full reset):

```bash
docker compose down -v
```

## Test Accounts

| Role     | Email                    | Password  |
|----------|--------------------------|-----------|
| Supplier | admin@himalayaentp.com   | admin123  |
| Buyer    | ramesh@example.com       | buyer123  |

## API Endpoints

| Method | Endpoint           | Description              |
|--------|-------------------|--------------------------|
| GET    | /api/health        | Health check             |
| GET    | /api/products      | List all products        |
| POST   | /api/auth/login    | Login                    |
| POST   | /api/auth/register | Register new user        |
| POST   | /api/inquiries     | Submit product inquiry   |
