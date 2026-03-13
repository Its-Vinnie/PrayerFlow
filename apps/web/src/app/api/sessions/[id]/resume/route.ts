import { NextRequest } from 'next/server';
import { prisma } from '@prayerflow/db';
import { authenticateRequest, unauthorized, success, badRequest, notFound, forbidden } from '@/lib/auth';
import { getSessionQueue } from '@/lib/queue';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();

  if (auth.user.role === 'viewer') return forbidden();

  const { id } = await params;

  const session = await prisma.prayerSession.findFirst({
    where: { id, workspaceId: auth.workspace.id },
  });
  if (!session) return notFound('Session');

  if (session.status !== 'paused') {
    return badRequest('Only paused sessions can be resumed');
  }

  const updated = await prisma.prayerSession.update({
    where: { id },
    data: { status: 'live' },
    include: {
      group: true,
      prayerPoints: { orderBy: { orderIndex: 'asc' } },
    },
  });

  // Re-queue any scheduled points that may need sending now
  try {
    const queue = getSessionQueue();
    await queue.add('session-started', {
      event: 'session-started',
      sessionId: id,
      workspaceId: auth.workspace.id,
    });
    await queue.close();
  } catch (err) {
    console.error('Failed to emit session-resumed event:', err);
  }

  return success(updated);
}
