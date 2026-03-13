import { NextRequest } from 'next/server';
import { prisma } from '@prayerflow/db';
import { authenticateRequest, unauthorized, success, badRequest, notFound, forbidden, withErrorHandler } from '@/lib/auth';
import { getSessionQueue } from '@/lib/queue';

export const POST = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();

  if (auth.user.role === 'viewer') return forbidden();

  const { id } = await params;

  const session = await prisma.prayerSession.findFirst({
    where: { id, workspaceId: auth.workspace.id },
  });
  if (!session) return notFound('Session');

  if (session.status !== 'live' && session.status !== 'paused') {
    return badRequest('Only live or paused sessions can be completed');
  }

  const updated = await prisma.prayerSession.update({
    where: { id },
    data: {
      status: 'completed',
      endedAt: new Date(),
    },
    include: {
      group: true,
      prayerPoints: { orderBy: { orderIndex: 'asc' } },
    },
  });

  // Cancel any remaining scheduled jobs
  try {
    const queue = getSessionQueue();
    await queue.add('session-completed', {
      event: 'session-completed',
      sessionId: id,
      workspaceId: auth.workspace.id,
    });
    await queue.close();
  } catch (err) {
    console.error('Failed to emit session-completed event:', err);
  }

  return success(updated);
});
