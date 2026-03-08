export const SessionStatus = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  LIVE: 'live',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const PointStatus = {
  PENDING: 'pending',
  QUEUED: 'queued',
  SENT: 'sent',
  SKIPPED: 'skipped',
  FAILED: 'failed',
} as const;

export const SendMode = {
  MANUAL: 'manual',
  SCHEDULED: 'scheduled',
} as const;

export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  OPERATOR: 'operator',
  VIEWER: 'viewer',
} as const;

export const SentByType = {
  USER: 'user',
  SCHEDULER: 'scheduler',
} as const;

export type SessionStatusType = (typeof SessionStatus)[keyof typeof SessionStatus];
export type PointStatusType = (typeof PointStatus)[keyof typeof PointStatus];
export type SendModeType = (typeof SendMode)[keyof typeof SendMode];
export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];
export type SentByTypeValue = (typeof SentByType)[keyof typeof SentByType];
