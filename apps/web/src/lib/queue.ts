import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '@prayerflow/shared';

function getRedisConnection() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  try {
    const url = new URL(redisUrl);
    return {
      host: url.hostname,
      port: Number(url.port) || 6379,
      password: url.password || undefined,
      maxRetriesPerRequest: null as null,
    };
  } catch {
    return null;
  }
}

export function getSessionQueue() {
  const connection = getRedisConnection();
  if (!connection) throw new Error('REDIS_URL not configured');
  return new Queue(QUEUE_NAMES.SESSION_EVENTS, { connection });
}

export function getPrayerQueue() {
  const connection = getRedisConnection();
  if (!connection) throw new Error('REDIS_URL not configured');
  return new Queue(QUEUE_NAMES.PRAYER_SEND, { connection });
}
