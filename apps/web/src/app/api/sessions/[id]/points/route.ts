import { NextRequest } from 'next/server';
import { prisma } from '@prayerflow/db';
import { authenticateRequest, unauthorized, success, badRequest, notFound, forbidden } from '@/lib/auth';

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

  const body = await req.json();
  const { title, body: pointBody, sendMode, scheduledAt } = body;

  if (!title || !pointBody) {
    return badRequest('title and body are required');
  }

  // Auto-calculate orderIndex
  const maxOrder = await prisma.prayerPoint.aggregate({
    where: { sessionId: id },
    _max: { orderIndex: true },
  });
  const orderIndex = (maxOrder._max.orderIndex ?? -1) + 1;

  const point = await prisma.prayerPoint.create({
    data: {
      sessionId: id,
      title,
      body: pointBody,
      orderIndex,
      sendMode: sendMode || 'manual',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
    },
  });

  return success(point);
}
