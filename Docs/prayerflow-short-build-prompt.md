# PrayerFlow Short Build Prompt

Build a Telegram-first prayer automation MVP called **PrayerFlow** using:
- Telegram Bot
- Telegram Inline Mode
- Telegram Mini App
- Next.js
- Node.js with Telegraf
- PostgreSQL
- Prisma
- Redis
- BullMQ

## Product Goal
Help church admins prepare prayer points before prayer and send them into Telegram groups during live sessions either manually or automatically.

## Required Features
- Create, edit, and delete prayer sessions
- Create, edit, delete, and reorder prayer points
- Send Next
- Send Now
- Pause and Resume
- Skip point
- Scheduled sending from backend
- Inline mode search and insert
- Session duplication
- Basic templates
- Sent logs
- Admin roles and permissions

## Important Rules
- Mobile-first design
- Minimize distraction during prayer
- Do not rely on Telegram native scheduled messages for bots
- Use backend scheduling with a worker and queue
- Validate Telegram identity and permissions
- Design for reuse across multiple churches

## Return
Provide:
- architecture
- schema
- APIs
- screens
- implementation plan
- production considerations
