import { NextRequest } from 'next/server';
import { prisma } from '@prayerflow/db';
import { LIMITS } from '@prayerflow/shared';
import { authenticateRequest, unauthorized, success, badRequest, notFound, forbidden, withErrorHandler } from '@/lib/auth';

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

  const body = await req.json();

  // Bulk create: { points: [{ title, body }, ...] }
  if (Array.isArray(body.points)) {
    const points = body.points as Array<{ title: string; body: string; sendMode?: string }>;

    if (points.length === 0) {
      return badRequest('points array cannot be empty');
    }

    if (points.length > LIMITS.BULK_POINTS_MAX) {
      return badRequest(`Cannot create more than ${LIMITS.BULK_POINTS_MAX} points at once`);
    }

    for (const p of points) {
      if (!p.title || !p.body) {
        return badRequest('Each point must have a title and body');
      }
      if (p.title.length > LIMITS.TITLE_MAX_LENGTH) {
        return badRequest(`Point title must be ${LIMITS.TITLE_MAX_LENGTH} characters or less`);
      }
      if (p.body.length > LIMITS.BODY_MAX_LENGTH) {
        return badRequest(`Point body must be ${LIMITS.BODY_MAX_LENGTH} characters or less`);
      }
    }

    const maxOrder = await prisma.prayerPoint.aggregate({
      where: { sessionId: id },
      _max: { orderIndex: true },
    });
    let nextIndex = (maxOrder._max.orderIndex ?? -1) + 1;

    await prisma.prayerPoint.createMany({
      data: points.map((p) => ({
        sessionId: id,
        title: p.title,
        body: p.body,
        orderIndex: nextIndex++,
        sendMode: (p.sendMode as any) || 'manual',
      })),
    });

    return success({ count: points.length });
  }

  // Single create
  const { title, body: pointBody, sendMode, scheduledAt } = body;

  if (!title || !pointBody) {
    return badRequest('title and body are required');
  }

  if (title.length > LIMITS.TITLE_MAX_LENGTH) {
    return badRequest(`Title must be ${LIMITS.TITLE_MAX_LENGTH} characters or less`);
  }
  if (pointBody.length > LIMITS.BODY_MAX_LENGTH) {
    return badRequest(`Body must be ${LIMITS.BODY_MAX_LENGTH} characters or less`);
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
});
