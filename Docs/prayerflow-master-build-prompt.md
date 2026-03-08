# PrayerFlow Master Build Prompt

You are a senior product engineer and systems architect. Build an MVP for a Telegram-first product called **PrayerFlow**.

## Product Summary
PrayerFlow is a Telegram prayer automation platform for churches and prayer groups. It helps admins prepare prayer points before prayer and send them into Telegram groups either manually or automatically during live prayer sessions.

## Core Architecture
Build the product using:
- Telegram Bot
- Telegram Inline Mode
- Telegram Mini App
- Custom scheduling backend
- PostgreSQL database
- Admin authentication based on Telegram identity

## Tech Stack
Use this stack:
- **Frontend Mini App:** Next.js
- **Backend API:** Next.js API routes or modular backend within the same project
- **Bot logic:** Node.js with Telegraf
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Queue and scheduling:** BullMQ + Redis
- **Hosting target:** Vercel for frontend, Railway or Render or Fly.io for backend and worker

## Core Product Behavior
Admins must be able to:
- create prayer sessions
- add prayer points with titles and full content
- reorder prayer points
- set optional send times
- manually send the next point
- send a selected point immediately
- pause and resume active sessions
- skip a point
- duplicate an old session
- use inline mode to search and insert saved prayer points
- view logs of sent messages

## Primary UX Requirement
The product must minimize distraction during live prayer. Every important action should be fast, obvious, and mobile-friendly.

## MVP Features
Implement:
1. Telegram bot with command support
2. Private admin bot chat
3. Telegram Mini App with mobile-first UI
4. Prayer session CRUD
5. Prayer point CRUD
6. Prayer point ordering
7. Scheduler service for timed sends
8. Live session controls
9. Inline mode search and insert
10. Sent logs and audit trail
11. Basic admin roles and permissions

## Important Technical Rule
Do not rely on Telegram native message scheduling for bots. Scheduling must be implemented in the backend using persistent jobs and a worker or queue mechanism.

## Recommended Data Models

### Workspace
- id
- name
- slug
- created_at
- updated_at

### User
- id
- workspace_id
- telegram_user_id
- display_name
- username
- role
- created_at
- updated_at

### TelegramGroup
- id
- workspace_id
- telegram_chat_id
- title
- bot_is_admin
- created_at
- updated_at

### PrayerSession
- id
- workspace_id
- group_id
- title
- description
- status
- scheduled_start_at
- created_by
- created_at
- updated_at

### PrayerPoint
- id
- session_id
- title
- body
- order_index
- send_mode
- scheduled_at
- status
- sent_at
- created_at
- updated_at

### ScheduleJob
- id
- workspace_id
- session_id
- prayer_point_id
- run_at
- status
- attempts
- created_at
- updated_at

### SentLog
- id
- session_id
- prayer_point_id
- group_id
- telegram_message_id
- sent_by_type
- sent_by_user_id
- sent_at
- status
- error_message
- created_at

### Template
- id
- workspace_id
- name
- description
- created_by
- created_at
- updated_at

## Suggested Enums

### Session Status
- draft
- scheduled
- live
- paused
- completed
- cancelled

### Prayer Point Status
- pending
- queued
- sent
- skipped
- failed

### Send Mode
- manual
- scheduled

### Role
- super_admin
- admin
- operator
- viewer

## Required User Flows

### Flow 1: Session Creation
- Admin opens PrayerFlow bot
- Launches Mini App
- Creates a session
- Adds prayer points
- Chooses target group
- Saves or starts the session

### Flow 2: Live Prayer
- Admin enters live dashboard
- Sees the next prayer point
- Uses Send Next
- Optionally pauses, resumes, skips, or sends a selected point

### Flow 3: Inline Mode
- Admin types an inline query
- Backend returns matching prayer points
- Selected result is inserted into Telegram chat

## UI Requirements for the Mini App
Build these screens:
- Entry/auth validation screen
- Sessions list
- Session details
- Session editor
- Prayer point editor
- Live dashboard
- Templates screen
- Logs screen

## Design Principles
- Mobile-first
- Clean and uncluttered
- High readability
- Large touch targets
- Minimal taps during live use

## Backend Requirements
- Handle Telegram webhook updates
- Expose APIs for the Mini App
- Support scheduler and worker services
- Use idempotency protection to avoid duplicate sends
- Validate Telegram Mini App init data
- Enforce authorization by Telegram user ID and role
- Keep an audit log for important actions

## Bot Command Map
Implement and wire up:
- `/start`
- `/help`
- `/newsession`
- `/sessions`
- `/today`
- `/live`
- `/sendnext`
- `/pause`
- `/resume`
- `/skip`
- `/templates`
- `/logs`

## Deliverables
Produce:
1. Architecture overview
2. Database schema
3. API design
4. Bot command map
5. Inline mode behavior
6. Mini App screen plan
7. Scheduler design
8. Implementation roadmap
9. Suggested project structure
10. Deployment plan

## Preferred Implementation Style
Use clean, modular, production-ready code with:
- typed models
- clear folder structure
- reusable services
- strong error handling
- concise comments only where useful

## MVP Priority Order
1. Reliable Telegram send flow
2. Session and prayer point management
3. Scheduler
4. Live dashboard
5. Inline mode
6. Templates and logs

Build for maintainability and future multi-tenant use.
