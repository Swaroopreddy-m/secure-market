# Free-Tier Production Deployment Plan

This guide outlines the production deployment setup for the SaaS Marketplace application on free-tier platforms.

---

## 1. Hosting Services

### Frontend & Web Application
- **Platform**: Render (Web Service)
- **Framework**: Next.js (Node.js Environment)
- **Deployment Script**:
  - Build Command: `npm run build`
  - Start Command: `npm run start`

---

## 2. Database Tier Selection

We recommend **Supabase (PostgreSQL)** or **Neon (Serverless PostgreSQL)** as the production database backend, or **Turso** if SQLite compatibility is preferred.

| Feature | Turso (SQLite) | Supabase (Postgres) | Neon (Postgres) |
|---|---|---|---|
| **Free-Tier Limits** | 500MB storage | 500MB database storage | 0.5 GiB storage, 3 project branches |
| **Reliability** | High (distributed edge) | Exceptional (AWS RDS) | High (AWS pool) |
| **Scale & Concurrency**| Low-Medium | High | High |
| **Backups** | Manual snapshot | Automated daily | Automated daily |
| **Ease of Migration** | Direct copy | Needs Prisma schema update | Needs Prisma schema update |

### Recommended Choice: Supabase PostgreSQL
1. **Prisma Abstraction**: Changing from SQLite to PostgreSQL is clean:
   - Change `provider = "sqlite"` to `provider = "postgresql"` in `prisma/schema.prisma`.
   - Update `DATABASE_URL` in `.env` to point to the Supabase connection string.
2. **Auto-scaling**: Neon is a close second, but Supabase provides rich features like built-in email auth, auto backups, and connection pooling.

---

## 3. Environment Variable Configuration

Create a `.env.production` file containing the following variables:

```env
# Next Auth Config
NEXTAUTH_URL=https://your-app-domain.onrender.com
NEXTAUTH_SECRET=your-secure-nextauth-crypto-secret-key

# Database Connection
DATABASE_URL=postgresql://postgres:your-password@db.supabase.co:5432/postgres

# Security Policy
CONCURRENT_LOGIN_POLICY=FORCE_LOGOUT
```

---

## 4. Docker Deployment Instructions

If deploying via containerization:
1. Build image:
   ```bash
   docker build -t secure-market:latest .
   ```
2. Run container:
   ```bash
   docker run -p 3000:3000 --env-file .env.production secure-market:latest
   ```
