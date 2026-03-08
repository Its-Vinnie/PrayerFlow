# PrayerFlow Technical Architecture

## Overview
PrayerFlow is a Telegram-first prayer automation platform built around:
1. **Telegram Bot**
2. **Telegram Inline Mode**
3. **Telegram Mini App**
4. **Scheduling Backend**

## Selected Stack
- **Frontend Mini App:** Next.js
- **Backend API:** Next.js services
- **Bot Runtime:** Node.js with Telegraf
- **Database:** Supabase Postgres
- **ORM:** Prisma
- **Queue/Scheduler:** BullMQ + Redis

## Architecture Decision
Use **Supabase as the managed Postgres foundation**, while keeping:
- bot execution in dedicated Node services
- scheduling in dedicated BullMQ workers
- Telegram identity as the MVP auth model

## Why not core scheduling in Supabase functions
The MVP needs durable scheduling, queue control, idempotency, and worker-style execution. Those responsibilities should stay in dedicated Node worker services.
