# PrayerFlow Master Build Prompt

You are a senior product engineer and systems architect. Build an MVP for a Telegram-first product called **PrayerFlow**.

## Core Architecture
Build the product using:
- Telegram Bot
- Telegram Inline Mode
- Telegram Mini App
- Custom scheduling backend
- Supabase Postgres database
- Admin authentication based on Telegram identity

## Tech Stack
Use this stack:
- **Frontend Mini App:** Next.js
- **Backend API:** Next.js API routes or modular backend within the same project
- **Bot logic:** Node.js with Telegraf
- **Database:** Supabase Postgres
- **ORM:** Prisma
- **Queue and scheduling:** BullMQ + Redis

## Architectural Rule
Use Supabase primarily as the managed Postgres layer. Do not move the core scheduling engine or Telegram bot runtime into Supabase Edge Functions for the MVP. The bot and worker should remain dedicated Node services.

## Important Technical Rule
Do not rely on Telegram native message scheduling for bots. Scheduling must be implemented in the backend using persistent jobs and a worker or queue mechanism.
