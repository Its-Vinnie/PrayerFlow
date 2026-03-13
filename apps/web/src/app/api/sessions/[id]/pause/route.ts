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

  if (session.status !== 'live') {
    return badRequest('Only live sessions can be paused');
  }

  const updated = await prisma.prayerSession.update({
    where: { id },
    data: { status: 'paused' },
    include: {
      group: true,
      prayerPoints: { orderBy: { orderIndex: 'asc' } },
    },
  });

  // Notify worker that session is paused
  try {
    const queue = getSessionQueue();
    await queue.add('session-paused', {
      event: 'session-paused',
      sessionId: id,
      workspaceId: auth.workspace.id,
    });
    await queue.close();
  } catch (err) {
    console.error('Failed to emit session-paused event:', err);
  }

  return success(updated);
});
