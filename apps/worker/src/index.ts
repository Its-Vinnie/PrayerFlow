import 'dotenv/config';
import { Worker, Queue } from 'bullmq';
import { prisma } from '@prayerflow/db';
import { QUEUE_NAMES } from '@prayerflow/shared';

const redisUrl = process.env.REDIS_URL!;
const parsedUrl = new URL(redisUrl);
const connection = {
  host: parsedUrl.hostname,
  port: parseInt(parsedUrl.port || '6379'),
  password: parsedUrl.password || undefined,
  username: parsedUrl.username || undefined,
  maxRetriesPerRequest: null,
};

const botToken = process.env.TELEGRAM_BOT_TOKEN!;

interface PrayerSendJobData {
  prayerPointId: string;
  sessionId: string;
  workspaceId: string;
  scheduleJobId: string;
}

async function sendToTelegram(chatId: string, title: string, body: string): Promise<{ messageId?: number; error?: string }> {
  const text = `🙏 *${title}*\n\n${body}`;

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    }),
  });

  const data = await res.json() as { ok: boolean; description?: string; result?: { message_id: number } };
  if (!data.ok) {
    return { error: data.description || 'Failed to send message' };
  }

  return { messageId: data.result?.message_id };
}

const worker = new Worker<PrayerSendJobData>(
  QUEUE_NAMES.PRAYER_SEND,
  async (job) => {
    const { prayerPointId, sessionId, workspaceId, scheduleJobId } = job.data;

    console.log(`Processing scheduled send: point=${prayerPointId}, session=${sessionId}`);

    // Update schedule job to running
    await prisma.scheduleJob.update({
      where: { id: scheduleJobId },
      data: { status: 'running', lastAttemptAt: new Date(), attempts: { increment: 1 } },
    });

    // Fetch the prayer point with session and group info
    const point = await prisma.prayerPoint.findUnique({
      where: { id: prayerPointId },
      include: {
        session: {
          include: { group: true },
        },
      },
    });

    if (!point) {
      await prisma.scheduleJob.update({
        where: { id: scheduleJobId },
        data: { status: 'failed', lastError: 'Prayer point not found' },
      });
      throw new Error(`Prayer point ${prayerPointId} not found`);
    }

    // Idempotency: skip if already sent
    if (point.status === 'sent') {
      console.log(`Point ${prayerPointId} already sent, skipping`);
      await prisma.scheduleJob.update({
        where: { id: scheduleJobId },
        data: { status: 'completed' },
      });
      return;
    }

    // Skip if point was skipped or session is not live
    if (point.status === 'skipped') {
      console.log(`Point ${prayerPointId} was skipped, marking job complete`);
      await prisma.scheduleJob.update({
        where: { id: scheduleJobId },
        data: { status: 'completed' },
      });
      return;
    }

    if (point.session.status !== 'live') {
      // If session is paused, we should re-queue with a delay
      if (point.session.status === 'paused') {
        console.log(`Session ${sessionId} is paused, re-queuing in 30s`);
        await prisma.scheduleJob.update({
          where: { id: scheduleJobId },
          data: { status: 'queued', lastError: 'Session paused, re-queued' },
        });
        throw new Error('Session paused'); // BullMQ will retry
      }

      // Session is completed/cancelled/draft — cancel the job
      console.log(`Session ${sessionId} status is ${point.session.status}, cancelling job`);
      await prisma.scheduleJob.update({
        where: { id: scheduleJobId },
        data: { status: 'cancelled', lastError: `Session status: ${point.session.status}` },
      });
      return;
    }

    // Send to Telegram
    const chatId = point.session.group.telegramChatId.toString();
    const result = await sendToTelegram(chatId, point.title, point.body);

    if (result.error) {
      // Update point and job as failed
      await prisma.prayerPoint.update({
        where: { id: prayerPointId },
        data: { status: 'failed' },
      });
      await prisma.scheduleJob.update({
        where: { id: scheduleJobId },
        data: { status: 'failed', lastError: result.error },
      });

      // Create failed sent log
      await prisma.sentLog.create({
        data: {
          workspaceId,
          sessionId,
          prayerPointId,
          groupId: point.session.groupId,
          sentByType: 'scheduler',
          status: 'failed',
          errorMessage: result.error,
        },
      });

      throw new Error(result.error);
    }

    // Success — update point, job, and create log
    const now = new Date();

    await prisma.prayerPoint.update({
      where: { id: prayerPointId },
      data: { status: 'sent', sentAt: now },
    });

    await prisma.scheduleJob.update({
      where: { id: scheduleJobId },
      data: { status: 'completed' },
    });

    await prisma.sentLog.create({
      data: {
        workspaceId,
        sessionId,
        prayerPointId,
        groupId: point.session.groupId,
        telegramMessageId: result.messageId ? BigInt(result.messageId) : null,
        sentByType: 'scheduler',
        status: 'sent',
      },
    });

    console.log(`Successfully sent point ${prayerPointId} to group ${point.session.group.title}`);
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 20,
      duration: 1000, // Telegram rate limit: ~30 msgs/sec
    },
  },
);

worker.on('completed', (job) => console.log(`Job ${job.id} completed`));
worker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err.message));

// Session events worker — handles session start/pause/resume scheduling
const sessionWorker = new Worker(
  QUEUE_NAMES.SESSION_EVENTS,
  async (job) => {
    const { event, sessionId, workspaceId } = job.data;
    console.log(`Processing session event: ${event} for session ${sessionId}`);

    switch (event) {
      case 'session-started': {
        // When a session starts, queue all scheduled prayer points
        const points = await prisma.prayerPoint.findMany({
          where: {
            sessionId,
            sendMode: 'scheduled',
            status: 'pending',
            scheduledAt: { not: null },
          },
          orderBy: { scheduledAt: 'asc' },
        });

        const prayerQueue = new Queue(QUEUE_NAMES.PRAYER_SEND, { connection });

        for (const point of points) {
          const delay = Math.max(0, point.scheduledAt!.getTime() - Date.now());

          // Create schedule job record
          const scheduleJob = await prisma.scheduleJob.create({
            data: {
              workspaceId,
              sessionId,
              prayerPointId: point.id,
              runAt: point.scheduledAt!,
              status: 'queued',
            },
          });

          // Queue the BullMQ job
          const bullJob = await prayerQueue.add(
            'send-prayer-point',
            {
              prayerPointId: point.id,
              sessionId,
              workspaceId,
              scheduleJobId: scheduleJob.id,
            } satisfies PrayerSendJobData,
            {
              delay,
              jobId: `scheduled-${point.id}`,
              attempts: 3,
              backoff: { type: 'exponential', delay: 5000 },
              removeOnComplete: true,
              removeOnFail: false,
            },
          );

          // Update schedule job with queue job ID
          await prisma.scheduleJob.update({
            where: { id: scheduleJob.id },
            data: { queueJobId: bullJob.id },
          });

          // Update point status to queued
          await prisma.prayerPoint.update({
            where: { id: point.id },
            data: { status: 'queued' },
          });

          console.log(`Queued point ${point.id} with delay ${delay}ms`);
        }

        await prayerQueue.close();
        console.log(`Queued ${points.length} scheduled points for session ${sessionId}`);
        break;
      }

      case 'session-paused': {
        // Pause all queued jobs — BullMQ handles retry via the worker logic
        console.log(`Session ${sessionId} paused — queued jobs will wait for resume`);
        break;
      }

      case 'session-completed':
      case 'session-cancelled': {
        // Cancel all pending schedule jobs
        const pendingJobs = await prisma.scheduleJob.findMany({
          where: {
            sessionId,
            status: { in: ['queued', 'running'] },
          },
        });

        const prayerQueue = new Queue(QUEUE_NAMES.PRAYER_SEND, { connection });

        for (const sj of pendingJobs) {
          if (sj.queueJobId) {
            const bullJob = await prayerQueue.getJob(sj.queueJobId);
            if (bullJob) {
              await bullJob.remove().catch(() => {});
            }
          }
        }

        await prisma.scheduleJob.updateMany({
          where: {
            sessionId,
            status: { in: ['queued', 'running'] },
          },
          data: { status: 'cancelled' },
        });

        await prayerQueue.close();
        console.log(`Cancelled ${pendingJobs.length} jobs for session ${sessionId}`);
        break;
      }
    }
  },
  { connection },
);

sessionWorker.on('completed', (job) => console.log(`Session event ${job.id} completed`));
sessionWorker.on('failed', (job, err) => console.error(`Session event ${job?.id} failed:`, err.message));

console.log('PrayerFlow worker started, listening for jobs...');

process.once('SIGINT', async () => {
  await worker.close();
  await sessionWorker.close();
  process.exit(0);
});
process.once('SIGTERM', async () => {
  await worker.close();
  await sessionWorker.close();
  process.exit(0);
});
