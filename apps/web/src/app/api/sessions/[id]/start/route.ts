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
    include: { prayerPoints: true },
  });
  if (!session) return notFound('Session');

  if (session.status !== 'draft' && session.status !== 'scheduled') {
    return badRequest('Session can only be started from draft or scheduled status');
  }

  const updated = await prisma.prayerSession.update({
    where: { id },
    data: {
      status: 'live',
      startedAt: new Date(),
    },
    include: {
      group: true,
      prayerPoints: { orderBy: { orderIndex: 'asc' } },
    },
  });

  // Emit session-started event for the worker to queue scheduled points
  const hasScheduledPoints = session.prayerPoints.some(
    (p) => p.sendMode === 'scheduled' && p.scheduledAt
  );

  if (hasScheduledPoints) {
    try {
      const queue = getSessionQueue();
      await queue.add('session-started', {
        event: 'session-started',
        sessionId: id,
        workspaceId: auth.workspace.id,
      });
      await queue.close();
    } catch (err) {
      console.error('Failed to emit session-started event:', err);
      // Don't fail the start — manual sending still works
    }
  }

  return success(updated);
});
