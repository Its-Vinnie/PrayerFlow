# PrayerFlow Agent Update Handoff

## Important Architecture Update
We are updating the project decision:

**Use Supabase for the Postgres layer.**

This means:
- use **Supabase Postgres** as the main database
- keep **Prisma** as the ORM
- keep **Telegram identity validation** as the main MVP auth model
- keep the **Telegram bot** as a dedicated Node.js + Telegraf service
- keep the **scheduler/worker** as a dedicated BullMQ + Redis worker
- do **not** move the bot or the scheduling engine into Supabase Edge Functions for MVP

## Updated Stack
- Next.js
- Node.js with Telegraf
- Supabase Postgres
- Prisma
- Redis
- BullMQ

## What Should Change In The Build
1. Replace generic PostgreSQL assumptions with **Supabase Postgres**
2. Update environment variables and DB connection handling for Supabase
3. Keep Prisma migrations and schema as the source of application-level data modeling
4. Treat Supabase as managed database infrastructure, not as the entire backend runtime
5. Preserve the existing architecture split between:
   - web / Mini App
   - bot
   - worker
   - shared packages

## What Should Not Change
- Telegram-first product direction
- Bot + Inline Mode + Mini App combination
- BullMQ + Redis scheduling approach
- Telegram-based identity model for MVP
- Multi-tenant workspace architecture
- Session, prayer point, template, and sent-log domain model

## Immediate Developer Actions
- update the project docs to Supabase terminology
- configure Supabase connection strings for local and deployed environments
- connect Prisma to Supabase Postgres
- keep the worker and bot as independent services
- avoid designing around Supabase Edge Functions as the core job runtime

## Product Reminder
The highest priority is still:
1. reliable Telegram sending
2. session and prayer point management
3. live dashboard
4. scheduling
5. inline mode
