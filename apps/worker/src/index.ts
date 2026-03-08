import 'dotenv/config';
import { Worker } from 'bullmq';
import { QUEUE_NAMES } from '@prayerflow/shared';

const worker = new Worker(
  QUEUE_NAMES.PRAYER_SEND,
  async (job) => {
    console.log(`Processing job ${job.id}:`, job.data);
    // TODO: Implement prayer point send logic
  },
  {
    connection: {
      host: new URL(process.env.REDIS_URL!).hostname,
      port: Number(new URL(process.env.REDIS_URL!).port),
      maxRetriesPerRequest: null,
    },
  },
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
