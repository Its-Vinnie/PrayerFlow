# PrayerFlow Short Build Prompt

Build a Telegram-first prayer automation MVP called **PrayerFlow** using:
- Telegram Bot
- Telegram Inline Mode
- Telegram Mini App
- Next.js
- Node.js with Telegraf
- Supabase Postgres
- Prisma
- Redis
- BullMQ

## Product Goal
Help church admins prepare prayer points before prayer and send them into Telegram groups during live sessions either manually or automatically.

## Important Rules
- Do not rely on Telegram native scheduled messages for bots
- Use backend scheduling with a worker and queue
- Use Supabase as the managed Postgres layer
- Validate Telegram identity and permissions
- Design for reuse across multiple churches
