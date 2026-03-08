# PrayerFlow PRD

## Product
**PrayerFlow** — a Telegram-first prayer automation platform for churches and online prayer groups.

## Product Summary
PrayerFlow helps pastors and church admins prepare, organize, schedule, and send prayer points into Telegram groups during live prayer sessions. It combines a Telegram bot, inline mode, a Telegram Mini App, and a custom scheduling backend so prayer leaders can focus on prayer instead of searching for notes and copy-pasting messages.

## Problem Statement
During live online prayer sessions, pastors or admins often prepare prayer points in note-taking apps or documents. In the middle of prayer they may:
- forget where the notes were saved
- waste time searching for prayer points
- get distracted copying and pasting
- interrupt the spiritual flow of the session
- struggle to keep up when prayer direction changes

PrayerFlow solves this by providing a Telegram-native workflow for preparation, control, and delivery of prayer points.

## Vision
To become the simplest and most reliable way for ministries to manage and deliver prayer points during live Telegram prayer sessions.

## Goals

### Primary Goals
- Allow admins to prepare prayer sessions in advance
- Allow prayer points to be sent into Telegram groups smoothly
- Reduce distraction during live prayer
- Support both scheduled flow and flexible live control
- Make the product reusable across many churches and ministries

### Secondary Goals
- Create reusable prayer templates
- Support multiple admins and operators
- Build a strong foundation for future expansion
- Provide logs and history of what was sent

## Non-Goals for MVP
The MVP will not include:
- WhatsApp integration
- AI-generated prayers
- Deep integrations with Apple Notes, Google Keep, Samsung Notes, or other note apps
- Spreadsheet-first workflow
- Advanced analytics dashboards
- Public web dashboard outside Telegram

## Target Users

### Primary Users
- Pastors
- Prayer coordinators
- Church admins
- Online service moderators

### Secondary Users
- Ministry teams
- Intercessory groups
- Youth prayer leaders
- Event hosts running structured prayer sessions

## User Roles

### Super Admin
- Owns the ministry workspace
- Connects Telegram groups
- Manages admins and permissions

### Admin
- Creates and edits sessions
- Manages prayer points
- Schedules messages
- Uses live controls

### Operator
- Can send next, pause, skip, and resume
- Can use inline mode during prayer
- Cannot change high-level workspace settings

### Viewer
- Can view sessions and logs only

## Core Use Cases

### 1. Create Prayer Session
An admin creates a prayer session with:
- title
- description
- date/time
- target Telegram group
- prayer points

### 2. Add Prayer Points
An admin adds prayer points with:
- title
- full prayer content
- order
- optional scheduled time
- optional category or tag

### 3. Manual Live Sending
During prayer, the admin can:
- send next point
- send a selected point now
- skip a point
- pause a running session
- resume a paused session

### 4. Auto-Send
The system sends prayer points automatically at configured times.

### 5. Inline Retrieval
An admin uses inline mode in Telegram, for example:
`@PrayerFlowBot healing`
to search and insert a saved prayer point directly into the group.

### 6. Reuse Templates
An admin duplicates a previous session or uses a saved template.

### 7. View Logs
An admin reviews:
- what was sent
- when it was sent
- who triggered it
- whether it was automatic or manual

## Product Scope

## In Scope for MVP
- Telegram bot
- Telegram Mini App
- Telegram inline mode
- Admin onboarding and identity mapping by Telegram user ID
- Workspace and group setup
- Prayer session CRUD
- Prayer point CRUD
- Reordering prayer points
- Manual send controls
- Scheduled sending via custom backend
- Pause and resume flow
- Session duplication
- Basic templates
- Sent logs and audit trail
- Role-based permissions

## Out of Scope for MVP
- WhatsApp support
- Native integrations with note apps
- Google Sheets or Apple Numbers sync
- AI features
- Full analytics suite
- Desktop-specific tooling outside Telegram

## Functional Requirements

### Telegram Bot
The bot must:
- support admin onboarding
- identify users by Telegram user ID
- connect to one or more Telegram groups
- send messages to groups where it has permission
- support private admin chat
- support command-based flows
- support callback buttons for actions

#### Suggested Commands
- `/start`
- `/help`
- `/newsession`
- `/sessions`
- `/today`
- `/addpoint`
- `/live`
- `/sendnext`
- `/pause`
- `/resume`
- `/skip`
- `/templates`
- `/logs`

### Telegram Inline Mode
The bot must:
- support inline search by keyword
- return matching prayer points quickly
- allow direct insertion into chats
- serve as a fallback tool during dynamic live sessions

### Telegram Mini App
The Mini App must support:
- sessions list
- create session
- edit session
- delete session
- duplicate session
- prayer point creation and editing
- prayer point deletion
- prayer point duplication
- prayer point reordering
- tag/category assignment
- schedule configuration
- live dashboard
- logs view
- templates view

### Scheduling Backend
The backend must:
- store future send times
- poll or process scheduled jobs reliably
- trigger message sending at the correct time
- prevent duplicate sends
- support retries where safe
- update statuses and logs
- handle pauses and resumes cleanly

### Roles and Permissions
The system must:
- authorize actions by Telegram identity
- enforce role restrictions
- restrict workspace and group settings to admins
- restrict live controls based on granted permissions

### Logs and Audit Trail
The system must store:
- send timestamp
- session ID
- prayer point ID
- target group
- sent by user or scheduler
- delivery status
- failure reason if any
- Telegram message ID when available

## Non-Functional Requirements

### Reliability
- Manual sends should feel immediate
- Scheduled sends should be dependable
- Duplicate sends should be prevented

### Speed
- Common actions should take only a few taps
- Inline search should respond quickly

### Usability
- The Mini App must be very simple
- The experience must work for non-technical church admins
- Live controls must be obvious and fast

### Security
- Validate Telegram Mini App init data
- Authorize all actions by Telegram user ID and workspace role
- Protect admin-only actions
- Keep an audit trail for edits and sends

### Scalability
- Support multiple ministries
- Support multiple Telegram groups per workspace
- Support recurring and reusable content structures later

## UX Principles
- Fewer taps during prayer
- Clear next action always visible
- Mobile-first experience
- Minimal clutter
- Strong fallback when scheduled flow changes
- Designed for live ministry moments, not office complexity

## Example User Flow

### Before Prayer
1. Admin opens PrayerFlow bot
2. Launches the Mini App
3. Creates a session such as “Friday Midnight Prayer”
4. Adds prayer points
5. Sets send times or leaves points manual
6. Chooses the target Telegram group
7. Starts or saves the session

### During Prayer
1. Pastor leads prayer
2. Admin monitors the live dashboard
3. The system auto-sends or the admin taps Send Next
4. If the flow changes, the admin pauses the session
5. The admin can use inline mode to send a special point quickly
6. Session continues without disrupting the pastor

### After Prayer
1. Admin reviews sent logs
2. Duplicates the session for next week
3. Saves recurring points as a template

## Data Model Overview

### Workspace
Represents a church, ministry, or prayer organization.

### User
Stores Telegram-linked users and roles.

### TelegramGroup
Stores linked Telegram chats or groups.

### PrayerSession
Stores a session and its lifecycle state.

### PrayerPoint
Stores each point, its ordering, and send behavior.

### ScheduleJob
Stores scheduled work for automatic sending.

### SentLog
Stores delivery and audit records.

### Template
Stores reusable session or prayer point structures.

## Recommended Status Enums

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

## Success Metrics

### MVP Metrics
- Time to create a session
- Percentage of prayer points sent successfully
- Number of sessions completed without needing external notes
- Number of repeat weekly uses per ministry
- Template reuse rate

### Longer-Term Metrics
- Weekly active ministries
- Sessions created per week
- Prayer points sent per session
- Retention after 30 days
- Average setup time before a session

## Risks

### Product Risks
- Overcomplicating the first version
- Building too many setup features before live sending is strong

### Technical Risks
- Telegram permissions and setup friction
- Scheduler timing accuracy
- Duplicate sends
- Handling edits during active sessions

### Adoption Risks
- Some admins may still prefer manual copy-paste
- Users may need onboarding to understand inline mode and live controls

## Future Opportunities
- AI formatting of rough notes into clean prayer points
- Import from note dumps or pasted text
- Recurring session automation
- Scripture attachments and themed prayer packs
- Export to CSV, Google Sheets, or Apple Numbers
- Future expansion to other messaging platforms

## Product Positioning Statement
PrayerFlow helps churches prepare and deliver prayer points into Telegram groups during live prayer sessions through smart scheduling, live controls, and fast inline access, so pastors can focus on prayer instead of copy-pasting notes.
