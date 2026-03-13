export const QUEUE_NAMES = {
  PRAYER_SEND: 'prayer-send',
  SESSION_EVENTS: 'session-events',
} as const;

export const MAX_PRAYER_POINTS_PER_SESSION = 100;
export const MAX_TITLE_LENGTH = 200;
export const MAX_BODY_LENGTH = 4096;
export const DEFAULT_TIMEZONE = 'UTC';

export const LIMITS = {
  TITLE_MAX_LENGTH: 200,
  BODY_MAX_LENGTH: 4000,
  DESCRIPTION_MAX_LENGTH: 500,
  TEMPLATE_NAME_MAX_LENGTH: 200,
  BULK_POINTS_MAX: 50,
  LOGS_MAX_LIMIT: 100,
} as const;
