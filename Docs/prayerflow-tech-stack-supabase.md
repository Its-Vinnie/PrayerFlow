# PrayerFlow Recommended Tech Stack

## Selected Stack
This project will use:

- **Frontend Mini App:** Next.js
- **Backend API:** Next.js API routes or modular backend services
- **Bot Logic:** Node.js with Telegraf
- **Database:** Supabase Postgres
- **ORM:** Prisma
- **Queue and Scheduling:** BullMQ + Redis
- **Hosting:** Vercel for frontend, Railway or Render or Fly.io for bot and worker
- **Authentication:** Telegram identity validation

## Recommended Supabase Role
Use Supabase primarily for:
- managed Postgres hosting
- database administration
- optional future storage
- optional future realtime sync

Do not use Supabase as the sole runtime for:
- Telegram bot processing
- BullMQ worker execution
- core scheduling logic
