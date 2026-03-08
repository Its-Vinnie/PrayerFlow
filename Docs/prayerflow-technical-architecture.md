# PrayerFlow Technical Architecture

## Overview
PrayerFlow is a Telegram-first prayer automation platform built around four core runtime surfaces:

1. **Telegram Bot** for commands, callbacks, and direct group sending
2. **Telegram Inline Mode** for fast search and insertion of saved prayer points
3. **Telegram Mini App** for mobile-first setup, editing, and live session control
4. **Scheduling Backend** for reliable timed delivery of prayer points

The selected stack is:
- **Frontend Mini App:** Next.js
- **Backend API:** Next.js app/backend services
- **Bot Runtime:** Node.js with Telegraf
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Queue/Scheduler:** BullMQ + Redis

This document defines the recommended architecture for the MVP.

---

## 1. Architecture Goals

### Product Goals
- Minimize distraction during live prayer
- Make setup fast and mobile-friendly
- Support both manual and scheduled sending
- Make the product reusable across multiple ministries
- Keep the experience centered inside Telegram

### Technical Goals
- Reliable Telegram message delivery
- Clean separation of UI, bot logic, worker logic, and data layer
- Safe scheduling with duplicate-send prevention
- Strong role-based authorization
- Future-ready multi-tenant architecture

---

## 2. High-Level System Architecture

## Core Components

### A. Mini App Frontend
A Next.js app rendered inside Telegram Mini App context.

Responsibilities:
- Session creation and editing
- Prayer point management
- Live dashboard
- Templates and logs view
- Calling backend APIs
- Handling Telegram Mini App context and UI state

### B. API Layer
Server-side API routes or modular backend services.

Responsibilities:
- Session CRUD
- Prayer point CRUD
- Group management
- Template management
- Logs retrieval
- Live action handling
- Role and permission enforcement
- Telegram Mini App init validation

### C. Telegram Bot Service
Telegraf-based bot runtime.

Responsibilities:
- Receive webhook updates from Telegram
- Handle commands like `/start` and `/sendnext`
- Handle callback button actions
- Handle inline queries
- Send messages to Telegram groups
- Bridge Telegram interactions to backend services

### D. Scheduler/Worker Service
BullMQ worker backed by Redis.

Responsibilities:
- Enqueue scheduled prayer point sends
- Execute jobs at the correct time
- Retry safe failures where allowed
- Prevent duplicate sends
- Update prayer point/session statuses
- Write delivery logs

### E. Database
PostgreSQL database accessed through Prisma.

Responsibilities:
- Persist workspaces, users, groups, sessions, points, jobs, templates, and logs
- Maintain role and state data
- Support auditability and reporting

### F. Redis
Queue and ephemeral coordination layer.

Responsibilities:
- Store BullMQ queue state
- Support worker scheduling
- Manage retry and delayed job behavior
- Optional lock/idempotency coordination

---

## 3. Recommended Deployment Layout

## Applications
- `apps/web` — Next.js Mini App and server APIs
- `apps/bot` — Telegraf Telegram bot runtime
- `apps/worker` — BullMQ worker and scheduling processor

## Shared Packages
- `packages/db` — Prisma schema, generated client, repositories
- `packages/shared` — shared types, enums, validation schemas, constants
- `packages/telegram` — Telegram helpers, message builders, webhook utilities

## Deployment Targets
- **Web App / API:** Vercel or equivalent
- **Bot Runtime:** Railway, Render, or Fly.io
- **Worker Runtime:** Railway, Render, or Fly.io
- **Database:** Managed PostgreSQL
- **Queue:** Managed Redis

## Why separate bot and worker
This prevents:
- slow queue jobs from blocking user interactions
- webhook traffic from interfering with scheduled delivery
- deployment coupling between interactive and background runtime

---

## 4. Core Request and Event Flows

## 4.1 Session Creation Flow
1. Admin opens Telegram bot
2. Admin launches Mini App
3. Mini App receives Telegram init context
4. Frontend sends authenticated request to API
5. API validates Telegram init data
6. API resolves workspace and user
7. Admin creates session
8. API stores session in PostgreSQL
9. Admin adds prayer points
10. API stores ordered points
11. If any point is scheduled, schedule jobs are created or updated

## 4.2 Manual Live Send Flow
1. Admin enters live dashboard
2. Admin taps **Send Next**
3. Frontend calls live action API
4. API resolves next pending prayer point
5. API calls Telegram send service
6. Bot service sends message to the target group
7. API marks the point as sent
8. API writes a sent log
9. Session state is updated if needed
10. Frontend refreshes live dashboard state

## 4.3 Scheduled Send Flow
1. Admin sets `scheduled_at` on a prayer point
2. API validates timing and group permissions
3. API creates or updates a BullMQ delayed job
4. Worker receives the job at execution time
5. Worker loads fresh point/session/group state from DB
6. Worker checks:
   - point is still pending
   - session is still active or scheduled
   - point was not already sent
   - job is valid and not cancelled
7. Worker sends the message through Telegram
8. Worker updates point status to sent
9. Worker stores sent log and outcome
10. Worker schedules the next job if needed or completes flow

## 4.4 Inline Mode Flow
1. Admin types inline query in Telegram, for example:
   `@PrayerFlowBot healing`
2. Telegram sends inline query update to bot webhook
3. Bot service forwards search query to backend search service
4. Search service returns matching prayer points or templates
5. Bot formats inline results
6. Admin taps a result
7. Telegram inserts the selected content into the chat
8. Optional telemetry/logging records the inline action

## 4.5 Pause/Resume Flow
1. Admin pauses a live session
2. API updates session status to `paused`
3. Worker checks session state before executing any due job
4. Paused jobs are skipped or re-queued according to strategy
5. Admin resumes the session
6. API restores session status to `live`
7. Future due jobs become eligible again

---

## 5. Multi-Tenant Domain Model

The architecture should support multiple churches or ministries from day one.

## Tenant Boundary
The primary tenant boundary is the **Workspace**.

A workspace may contain:
- many users
- many Telegram groups
- many sessions
- many templates
- many logs

All user actions must be scoped to a workspace.

## Recommended Entity Relationships

### Workspace
Owns all ministry-specific data.

### User
Belongs to one workspace and is identified by Telegram user ID.

### TelegramGroup
Belongs to one workspace and stores the group/channel identity where the bot sends messages.

### PrayerSession
Belongs to one workspace and targets one Telegram group.

### PrayerPoint
Belongs to one session.

### ScheduleJob
Belongs to a prayer point and session.

### Template
Belongs to one workspace and can be used to create future sessions.

### SentLog
Belongs to one workspace and references session, point, and group.

---

## 6. Database Relationships

## Entity Relationship Summary

### Workspace
- has many Users
- has many TelegramGroups
- has many PrayerSessions
- has many Templates
- has many SentLogs

### User
- belongs to Workspace
- may create many PrayerSessions
- may trigger many SentLogs

### TelegramGroup
- belongs to Workspace
- has many PrayerSessions
- has many SentLogs

### PrayerSession
- belongs to Workspace
- belongs to TelegramGroup
- has many PrayerPoints
- has many ScheduleJobs through PrayerPoints
- has many SentLogs

### PrayerPoint
- belongs to PrayerSession
- may have one or more ScheduleJobs
- may have many SentLogs

### Template
- belongs to Workspace

### SentLog
- belongs to Workspace
- belongs to PrayerSession
- belongs to PrayerPoint
- belongs to TelegramGroup
- optionally belongs to User

---

## 7. Suggested Prisma-Oriented Schema Design

## Workspace
Fields:
- `id`
- `name`
- `slug`
- `createdAt`
- `updatedAt`

## User
Fields:
- `id`
- `workspaceId`
- `telegramUserId`
- `username`
- `displayName`
- `role`
- `isActive`
- `createdAt`
- `updatedAt`

Indexes:
- unique `(workspaceId, telegramUserId)`

## TelegramGroup
Fields:
- `id`
- `workspaceId`
- `telegramChatId`
- `title`
- `type`
- `botIsAdmin`
- `isActive`
- `createdAt`
- `updatedAt`

Indexes:
- unique `(workspaceId, telegramChatId)`

## PrayerSession
Fields:
- `id`
- `workspaceId`
- `groupId`
- `title`
- `description`
- `status`
- `scheduledStartAt`
- `startedAt`
- `endedAt`
- `createdById`
- `createdAt`
- `updatedAt`

Indexes:
- `(workspaceId, status)`
- `(groupId, scheduledStartAt)`

## PrayerPoint
Fields:
- `id`
- `sessionId`
- `title`
- `body`
- `orderIndex`
- `sendMode`
- `scheduledAt`
- `status`
- `sentAt`
- `skippedAt`
- `createdAt`
- `updatedAt`

Indexes:
- `(sessionId, orderIndex)`
- `(sessionId, status)`
- `(scheduledAt, status)`

## ScheduleJob
Fields:
- `id`
- `workspaceId`
- `sessionId`
- `prayerPointId`
- `queueJobId`
- `runAt`
- `status`
- `attempts`
- `lastAttemptAt`
- `lastError`
- `createdAt`
- `updatedAt`

Indexes:
- unique `(prayerPointId)`
- `(runAt, status)`

## Template
Fields:
- `id`
- `workspaceId`
- `name`
- `description`
- `createdById`
- `createdAt`
- `updatedAt`

## TemplatePrayerPoint
Fields:
- `id`
- `templateId`
- `title`
- `body`
- `orderIndex`
- `tag`
- `createdAt`
- `updatedAt`

## SentLog
Fields:
- `id`
- `workspaceId`
- `sessionId`
- `prayerPointId`
- `groupId`
- `telegramMessageId`
- `sentByType`
- `sentByUserId`
- `sentAt`
- `status`
- `errorMessage`
- `metadata`
- `createdAt`

Indexes:
- `(workspaceId, sentAt)`
- `(sessionId, sentAt)`
- `(prayerPointId, sentAt)`

---

## 8. Status Model

## Session Status Lifecycle
- `draft` — being prepared
- `scheduled` — ready for future start and/or scheduled sends
- `live` — actively running
- `paused` — live flow intentionally paused
- `completed` — finished
- `cancelled` — stopped permanently

## Prayer Point Status Lifecycle
- `pending` — not yet queued or sent
- `queued` — scheduled in the worker
- `sent` — successfully delivered
- `skipped` — intentionally skipped
- `failed` — attempted and failed

## Schedule Job Status Lifecycle
- `queued`
- `running`
- `completed`
- `cancelled`
- `failed`

---

## 9. API Design

All APIs should be authenticated through validated Telegram Mini App context or trusted bot service calls.

## API Groups

### Auth / Context
#### `POST /api/auth/telegram/verify`
Validates Telegram Mini App init data and returns:
- user
- workspace
- allowed roles
- available groups

### Workspaces
#### `GET /api/workspace/current`
Returns current workspace details.

### Telegram Groups
#### `GET /api/groups`
Returns groups connected to the workspace.

#### `POST /api/groups`
Registers a Telegram group for the workspace.

#### `PATCH /api/groups/:id`
Updates group metadata or activation status.

### Sessions
#### `GET /api/sessions`
List sessions with filters:
- status
- group
- date
- template-derived

#### `POST /api/sessions`
Create a session.

#### `GET /api/sessions/:id`
Get session detail with prayer points.

#### `PATCH /api/sessions/:id`
Update session metadata or status.

#### `DELETE /api/sessions/:id`
Delete a draft session.

#### `POST /api/sessions/:id/duplicate`
Duplicate an existing session.

#### `POST /api/sessions/:id/start`
Set session to live.

#### `POST /api/sessions/:id/pause`
Pause live or scheduled flow.

#### `POST /api/sessions/:id/resume`
Resume paused flow.

#### `POST /api/sessions/:id/complete`
Mark session completed.

### Prayer Points
#### `POST /api/sessions/:id/points`
Create a prayer point.

#### `PATCH /api/points/:id`
Update title, body, schedule, or status.

#### `DELETE /api/points/:id`
Delete a prayer point.

#### `POST /api/points/:id/duplicate`
Duplicate a prayer point.

#### `POST /api/sessions/:id/points/reorder`
Accept an ordered list of point IDs or order indexes.

### Live Actions
#### `POST /api/sessions/:id/live/send-next`
Find and send the next pending point.

#### `POST /api/sessions/:id/live/send-now`
Send a selected point immediately.

Payload:
- `prayerPointId`

#### `POST /api/sessions/:id/live/skip`
Skip a selected point.

Payload:
- `prayerPointId`

### Templates
#### `GET /api/templates`
List templates.

#### `POST /api/templates`
Create a template.

#### `GET /api/templates/:id`
Get template detail.

#### `POST /api/templates/:id/use`
Create a session from a template.

### Logs
#### `GET /api/logs`
List sent logs with filters:
- workspace
- group
- session
- status
- date range

### Inline Search
#### `GET /api/inline/search?q=...`
Search prayer points and templates available to the user.

---

## 10. Telegram Bot Flow Map

## Core Bot Responsibilities
- onboarding
- quick admin flows
- command routing
- inline mode
- callback actions
- group send execution

## Bot Commands

### `/start`
Purpose:
- register user if allowed
- show welcome/help
- offer Mini App launch button

### `/help`
Purpose:
- explain commands and basic usage

### `/newsession`
Purpose:
- deep-link into Mini App session creation flow

### `/sessions`
Purpose:
- show today’s or recent sessions

### `/today`
Purpose:
- show today’s scheduled/live sessions

### `/live`
Purpose:
- launch live dashboard for the current or selected session

### `/sendnext`
Purpose:
- send the next pending prayer point for a live session

### `/pause`
Purpose:
- pause the active session

### `/resume`
Purpose:
- resume the active session

### `/skip`
Purpose:
- skip the next or selected prayer point

### `/templates`
Purpose:
- list or launch template flow

### `/logs`
Purpose:
- provide quick access to recent session delivery history

## Callback Buttons
Examples:
- `Start Session`
- `Send Next`
- `Pause`
- `Resume`
- `Skip`
- `Open Mini App`
- `View Logs`

---

## 11. Inline Mode Design

## Purpose
Inline mode is the fast-access fallback and insertion mechanism during live prayer.

## Search Targets
- prayer points from current workspace
- reusable templates
- recent commonly used prayer points

## Example Query
`@PrayerFlowBot healing`

## Result Shape
Each inline result should include:
- title
- short preview/snippet
- optional tag/category
- inserted message content

## Inline Result Strategy
Prefer returning:
1. exact title matches
2. keyword matches in body
3. tagged or recent relevant points

## Safety and Authorization
Before answering inline queries:
- resolve Telegram user
- verify active status
- verify workspace membership
- enforce role permission

## Practical Use
Inline mode should be optimized for:
- fast retrieval
- clean previews
- minimal latency
- one-tap insertion into group chat

---

## 12. Mini App Screen Map

## 12.1 Entry Screen
Purpose:
- validate Telegram context
- load workspace and user
- route to sessions list

Key elements:
- loading state
- auth error state
- workspace identity

## 12.2 Sessions List Screen
Purpose:
- show current and upcoming sessions

Key elements:
- filters by status/date/group
- create session button
- duplicate session action
- session cards with status

## 12.3 Session Detail Screen
Purpose:
- show metadata and prayer points for a session

Key elements:
- title and description
- target group
- session status
- point list
- quick actions: edit, duplicate, start, pause, complete

## 12.4 Session Editor Screen
Purpose:
- create or edit session metadata

Key elements:
- title
- description
- group selector
- start time
- status
- save button

## 12.5 Prayer Point Editor Screen
Purpose:
- add and edit prayer points

Key elements:
- title input
- body textarea
- send mode selector
- scheduled time picker
- tag/category
- save button

## 12.6 Prayer Point List / Reorder Screen
Purpose:
- manage point order

Key elements:
- draggable list
- status badges
- duplicate/delete actions
- add point action

## 12.7 Live Dashboard Screen
Purpose:
- control a running prayer session

Key elements:
- session header
- current status
- next point preview
- sent count
- upcoming points list
- large action buttons:
  - Send Next
  - Pause
  - Resume
  - Skip
  - Send Selected

## 12.8 Templates Screen
Purpose:
- reuse previously saved structures

Key elements:
- template list
- template details
- create from template
- save current session as template

## 12.9 Logs Screen
Purpose:
- review sent activity

Key elements:
- recent sends
- status filters
- timestamp
- sender type
- group/session references
- failure reason where relevant

---

## 13. Queue and Scheduling Design

## Scheduling Principle
Telegram bots cannot rely on native Telegram bot message scheduling. Scheduling must be managed entirely in PrayerFlow backend logic.

## Recommended Queue Model
Use BullMQ delayed jobs with Redis.

## Queue Names
Suggested:
- `prayer-send`
- `session-events`
- `cleanup` (optional later)

## Job Payload for Send Jobs
- `workspaceId`
- `sessionId`
- `prayerPointId`
- `groupId`
- `scheduledAt`
- `triggerType` (`scheduled`)

## Worker Execution Checklist
Before sending:
1. load point, session, group, and workspace
2. confirm point exists
3. confirm point status is not `sent` or `skipped`
4. confirm session status allows sending
5. confirm group is active
6. confirm bot has permission
7. confirm this job is still valid
8. perform send
9. update statuses in a transaction when possible
10. write sent log

## Idempotency Strategy
Use more than one layer:
- `PrayerPoint.status != sent` check
- unique `ScheduleJob` per point
- compare worker job ID with stored queue job ID if needed
- database transaction or atomic update guard
- optional Redis lock during execution

## Retry Strategy
Safe retries only for transient failures, for example:
- Telegram API temporary errors
- short network failures

Do not retry blindly for:
- permission denied
- invalid group/chat
- content validation issues
- point already sent

## Pause Behavior Options
Recommended MVP behavior:
- do not remove all jobs on pause
- worker checks session status at runtime
- if paused, worker exits safely and marks job for requeue or delayed retry
- resuming re-enables future due execution

---

## 14. Authorization and Security Design

## Telegram Mini App Validation
Every Mini App request should:
- include Telegram init data
- verify signature server-side
- resolve user identity safely

## Role-Based Access Rules
### Super Admin
- full workspace control

### Admin
- full session and point management
- full live control

### Operator
- live sending controls
- no high-level workspace settings

### Viewer
- read-only visibility

## Bot Command Security
Never trust command sender blindly.
Always verify:
- Telegram user ID
- workspace mapping
- role permissions
- target session access

## Webhook Security
- verify webhook origin assumptions through Telegram configuration
- protect secret paths or tokens where applicable

## Audit Requirements
Log:
- session edits
- point edits
- send actions
- pause/resume actions
- failures

---

## 15. Observability and Reliability

## Logging
Capture:
- API request errors
- bot update processing errors
- worker job failures
- Telegram API errors
- permission failures

## Monitoring
Recommended:
- app uptime monitoring
- worker failure alerts
- queue depth monitoring
- database error alerts

## Operational Dashboards
Useful later:
- send success rate
- failed sends by reason
- active sessions
- queue lag

---

## 16. Suggested Repository Structure

```text
prayerflow/
  apps/
    web/
      app/
      components/
      lib/
      server/
      styles/
    bot/
      src/
        commands/
        callbacks/
        inline/
        services/
        webhooks/
    worker/
      src/
        queues/
        jobs/
        services/
  packages/
    db/
      prisma/
      src/
    shared/
      src/
        types/
        enums/
        constants/
        validators/
    telegram/
      src/
        client/
        formatters/
        auth/
        helpers/
  .env
  package.json
  turbo.json
```

---

## 17. Recommended Service Boundaries

## Shared Domain Services
Create reusable services such as:
- `SessionService`
- `PrayerPointService`
- `LiveControlService`
- `ScheduleService`
- `TelegramSendService`
- `InlineSearchService`
- `TemplateService`
- `AuditLogService`

This prevents bot, API, and worker code from duplicating business logic.

## Example Responsibility Split
### API Layer
- validation
- auth
- orchestration

### Domain Services
- business rules
- state transitions
- scheduling decisions

### Infrastructure Services
- Telegram API calls
- queue interaction
- DB persistence
- logging

---

## 18. Recommended MVP Build Sequence

### Phase 1
- Workspace, user, and group models
- Bot can send test messages to a Telegram group

### Phase 2
- Session and prayer point CRUD
- Mini App setup screens

### Phase 3
- Live dashboard and manual send controls

### Phase 4
- Scheduling queue and worker

### Phase 5
- Inline mode

### Phase 6
- Templates and logs polish

### Phase 7
- Hardening, deployment, and pilot readiness

---

## 19. Key Product Decisions Captured in This Architecture

- Telegram is the primary platform
- The best reusable product is not a general website first, but a Telegram-native product
- Mini App handles complex management UX
- Bot handles commands and Telegram interactions
- Inline mode handles fast retrieval and insertion
- Backend scheduling handles timed delivery
- PostgreSQL plus Prisma provides strong multi-tenant persistence
- Redis plus BullMQ provides reliable queued execution

---

## 20. MVP Readiness Checklist

Before shipping a pilot:
- Bot can send to the target Telegram group reliably
- Bot permissions are clear and tested
- Mini App auth is validated correctly
- Session and prayer point CRUD works on mobile
- Send Next is fast and dependable
- Scheduled sends execute correctly
- Duplicate sends are prevented
- Pause and resume work as expected
- Inline mode returns useful results quickly
- Logs show what happened and why

---

## 21. Final Recommendation
Build PrayerFlow as a Telegram-native, multi-tenant product with a clean separation between Mini App UI, Telegram bot interaction layer, and scheduling worker. Keep the first version focused on reliable prayer-point delivery and low-friction live controls. That will create the strongest base for reuse across churches and future feature expansion.
