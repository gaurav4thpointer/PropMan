# PropMan

MVP web app for India + Dubai landlords to track rental income and PDC cheques (PropMan).

- **Frontend:** Vite + React + TypeScript + Tailwind, React Router, React Hook Form
- **Backend:** NestJS + TypeScript, Prisma, PostgreSQL
- **Auth:** JWT (email + password), bcrypt
- **API docs:** Swagger at `/api/docs`

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or Docker to run Postgres)

## Quick run with Docker (recommended)

From the repo root:

```bash
docker compose up -d
cd server
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev
```

Then open **http://localhost:3000/api/docs** for Swagger. Use `owner@example.com` / `password123` after registering or seeding.

In `server/.env`, set:

```env
DATABASE_URL="postgresql://landlord:landlord@localhost:5432/landlord_portfolio?schema=public"
```

## Setup (without Docker)

### 1. Clone and install

```bash
cd RentalTracker
npm install
cd server && npm install
cd ../client && npm install
```

### 2. Database

Create a PostgreSQL database, then:

```bash
cd server
cp .env.example .env
# Edit .env and set DATABASE_URL, e.g.:
# DATABASE_URL="postgresql://user:password@localhost:5432/landlord_portfolio?schema=public"
# JWT_SECRET="your-secret-key"
```

Run migrations and seed:

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 3. Start

**Backend (NestJS):**

```bash
cd server
npm run start:dev
```

API: `http://localhost:3000`  
Swagger: `http://localhost:3000/api/docs`

**Frontend (Vite + React):**

```bash
cd client
npm install
npm run dev
```

App: `http://localhost:5173`. Set `VITE_API_URL=http://localhost:3000` in `client/.env` if the API runs on a different URL.

### Seed user

- **Email:** `owner@example.com`
- **Password:** `password123`

Seed data includes an India property with a monthly lease and a Dubai property with quarterly lease and PDC cheques.

## Project structure

```
RentalTracker/
├── server/                 # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── src/
│       ├── auth/
│       ├── users/
│       ├── properties/
│       ├── units/
│       ├── tenants/
│       ├── leases/
│       ├── rent-schedule/
│       ├── cheques/
│       ├── payments/
│       ├── reports/
│       ├── prisma/
│       └── common/
└── client/                 # React app (Vite)
```

## Env vars (server)

| Variable       | Description                    |
|----------------|--------------------------------|
| `DATABASE_URL` | PostgreSQL connection string   |
| `JWT_SECRET`   | Secret for JWT signing         |
| `JWT_EXPIRES_IN` | Token expiry (default `7d`)  |
| `PORT`         | API port (default `3000`)      |
