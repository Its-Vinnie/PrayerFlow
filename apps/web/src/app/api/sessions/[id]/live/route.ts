import { NextRequest } from 'next/server';
import { prisma } from '@prayerflow/db';
import { authenticateRequest, unauthorized, success, badRequest, notFound, forbidden } from '@/lib/auth';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();

  // Operators, admins, and super_admins can perform live actions
  if (auth.user.role === 'viewer') return forbidden();

  const { id } = await params;

  const session = await prisma.prayerSession.findFirst({
    where: { id, workspaceId: auth.workspace.id },
    include: { group: true },
  });
  if (!session) return notFound('Session');

  if (session.status !== 'live') {
    return badRequest('Session must be live to perform live actions');
  }

  const body = await req.json();
  const { action, pointId } = body;

  if (!action) {
    return badRequest('action is required');
  }

  switch (action) {
    case 'send-next': {
      // Find first pending point by orderIndex
      const nextPoint = await prisma.prayerPoint.findFirst({
        where: { sessionId: id, status: 'pending' },
        orderBy: { orderIndex: 'asc' },
      });

      if (!nextPoint) {
        return badRequest('No pending points to send');
      }

      // Update point status to sent
      const updatedPoint = await prisma.prayerPoint.update({
        where: { id: nextPoint.id },
        data: { status: 'sent', sentAt: new Date() },
      });

      // Create SentLog entry
      await prisma.sentLog.create({
        data: {
          workspaceId: auth.workspace.id,
          sessionId: id,
          prayerPointId: nextPoint.id,
          groupId: session.groupId,
          sentByType: 'user',
          sentByUserId: auth.user.id,
          status: 'sent',
        },
      });

      return success(updatedPoint);
    }

    case 'send-now': {
      if (!pointId) {
        return badRequest('pointId is required for send-now action');
      }

      const point = await prisma.prayerPoint.findFirst({
        where: { id: pointId, sessionId: id },
      });
      if (!point) return notFound('Prayer point');

      if (point.status === 'sent') {
        return badRequest('Point has already been sent');
      }

      const updatedPoint = await prisma.prayerPoint.update({
        where: { id: pointId },
        data: { status: 'sent', sentAt: new Date() },
      });

      await prisma.sentLog.create({
        data: {
          workspaceId: auth.workspace.id,
          sessionId: id,
          prayerPointId: pointId,
          groupId: session.groupId,
          sentByType: 'user',
          sentByUserId: auth.user.id,
          status: 'sent',
        },
      });

      return success(updatedPoint);
    }

    case 'skip': {
      if (!pointId) {
        return badRequest('pointId is required for skip action');
      }

      const point = await prisma.prayerPoint.findFirst({
        where: { id: pointId, sessionId: id },
      });
      if (!point) return notFound('Prayer point');

      if (point.status !== 'pending') {
        return badRequest('Only pending points can be skipped');
      }

      const updatedPoint = await prisma.prayerPoint.update({
        where: { id: pointId },
        data: { status: 'skipped', skippedAt: new Date() },
      });

      return success(updatedPoint);
    }

    default:
      return badRequest(`Unknown action: ${action}. Valid actions: send-next, send-now, skip`);
  }
}
