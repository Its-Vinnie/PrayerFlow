# PrayerFlow Milestones

## Milestone 1: Product Definition and Technical Foundation
### Goal
Lock the product scope and technical approach.

### Deliverables
- Finalized PRD
- Confirmed user roles
- MVP scope confirmation
- Architecture decision
- Tech stack decision
- Initial data model
- Telegram bot setup plan

### Exit Criteria
The team has a clear blueprint and development can begin without ambiguity.

---

## Milestone 2: Telegram Bot Core
### Goal
Build the Telegram bot foundation and basic admin flows.

### Deliverables
- Telegram bot registration and initial setup
- `/start` flow
- Basic onboarding
- Admin identification by Telegram user ID
- Group connection flow
- Basic command routing
- Message send test from bot to Telegram group

### Exit Criteria
The bot can reliably send a test message into the target Telegram group.

---

## Milestone 3: Backend and Database Foundation
### Goal
Build the backend core and persistent data layer.

### Deliverables
- PostgreSQL database setup
- Prisma schema
- Workspace model
- User model
- TelegramGroup model
- PrayerSession model
- PrayerPoint model
- SentLog model
- Role enforcement basics
- CRUD APIs for sessions and prayer points

### Exit Criteria
Admins can create, store, edit, and retrieve sessions and prayer points.

---

## Milestone 4: Telegram Mini App MVP
### Goal
Create the Telegram Mini App for session setup and editing.

### Deliverables
- Mobile-first Mini App shell
- Sessions list screen
- Create session screen
- Edit session screen
- Prayer points list
- Add/edit/delete prayer point flows
- Reorder prayer points
- Group selection

### Exit Criteria
An admin can fully prepare a prayer session without leaving Telegram.

---

## Milestone 5: Live Dashboard and Manual Controls
### Goal
Support real live prayer operations.

### Deliverables
- Live session dashboard
- Next prayer point preview
- Send Next action
- Send Now action
- Skip action
- Pause action
- Resume action
- Point state updates
- Session state updates
- Live audit logging

### Exit Criteria
An admin can run a real prayer meeting using manual controls only.

---

## Milestone 6: Scheduling Engine
### Goal
Enable automatic sending at configured times.

### Deliverables
- Scheduling worker
- BullMQ and Redis setup
- Job creation and execution logic
- Idempotency protection
- Retry-safe sending logic
- Schedule pause and resume logic
- Failure logging

### Exit Criteria
Prayer points send automatically at the expected times with no duplicate sends.

---

## Milestone 7: Telegram Inline Mode
### Goal
Enable fast search and insertion directly inside Telegram chats.

### Deliverables
- Inline query handling
- Prayer point search endpoint
- Inline result formatting
- Insert selected prayer point into chat
- Permission checks for inline actions

### Exit Criteria
An admin can type an inline query and insert a prepared prayer point into the group quickly.

---

## Milestone 8: Templates and Session Duplication
### Goal
Make the product reusable week after week.

### Deliverables
- Save session as template
- Create session from template
- Duplicate prior session
- Basic tagging or categorization
- Reuse-friendly setup flows

### Exit Criteria
A ministry can run recurring prayer sessions without rebuilding everything from scratch.

---

## Milestone 9: Logs, Hardening, and Production Readiness
### Goal
Prepare the product for real users and live ministry use.

### Deliverables
- Logs view polish
- Audit trail completeness
- Error monitoring
- Input validation hardening
- Permission review
- Deployment setup
- Environment configuration
- Backup strategy
- Basic onboarding/help content
- QA pass across primary flows

### Exit Criteria
The system is stable enough for production pilot use.

---

## Recommended Build Order
1. Bot sends to group reliably
2. Backend and data model
3. Mini App CRUD
4. Live dashboard
5. Scheduler
6. Inline mode
7. Templates
8. Logs and hardening

## Suggested Timeline Shape
- Milestones 1 to 3: foundation
- Milestones 4 to 6: core usable MVP
- Milestones 7 to 9: reusability and launch readiness

## MVP Launch Gate
Before launch, confirm:
- The bot is an admin in target groups where needed
- Scheduling works consistently
- Duplicate sends are prevented
- Live controls are simple and fast
- At least one real church workflow has been tested end to end
