import 'dotenv/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { QUEUE_NAMES } from '@prayerflow/shared';

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  QUEUE_NAMES.PRAYER_SEND,
  async (job) => {
    console.log(`Processing job ${job.id}:`, job.data);
    // TODO: Implement prayer point send logic
  },
  { connection },
);

worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err));

console.log('PrayerFlow worker started, listening for jobs...');

process.once('SIGINT', async () => {
  await worker.close();
  process.exit(0);
});
process.once('SIGTERM', async () => {
  await worker.close();
  process.exit(0);
});
