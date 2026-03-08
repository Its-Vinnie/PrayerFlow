# PrayerFlow Recommended Tech Stack

## Selected Stack
This project will use the fast modern stack:

- **Frontend Mini App:** Next.js
- **Backend API:** Next.js API routes or modular backend services in the same application
- **Bot Logic:** Node.js with Telegraf
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Queue and Scheduling:** BullMQ + Redis
- **Hosting:** Vercel for frontend, Railway or Render or Fly.io for backend and worker
- **Authentication:** Telegram identity validation
- **Deployment Style:** Monorepo or single repository with clear separation of app, bot, worker, and shared packages

## Why This Stack
- Strong fit for mobile-first UI through Next.js
- Good developer velocity
- Great AI coding-agent support
- Clean TypeScript ecosystem
- Reliable scheduling with Redis and BullMQ
- PostgreSQL and Prisma give solid multi-tenant data structure support
- Telegraf makes Telegram bot development simpler and well-structured

## Suggested High-Level Project Structure
- `apps/web` for the Next.js Mini App
- `apps/bot` for Telegram bot logic
- `apps/worker` for scheduled jobs and queue processing
- `packages/db` for Prisma schema and database client
- `packages/shared` for shared types, constants, and utilities

## Core Infra Notes
- Use Telegram webhooks instead of long polling for production
- Keep the worker isolated from request-response traffic
- Use idempotency keys or job guards to avoid duplicate sends
- Store all timestamps in UTC
- Build with role-based authorization from day one

## Minimum Environments
- Development
- Staging
- Production

## Minimum Managed Services
- PostgreSQL
- Redis
- App hosting for web and APIs
- Worker hosting for BullMQ consumers
- Error monitoring
- Log aggregation

## Future-Friendly
This stack leaves room for:
- note import tools
- AI formatting helpers
- other messaging integrations
- analytics and billing
- larger multi-tenant SaaS structure
