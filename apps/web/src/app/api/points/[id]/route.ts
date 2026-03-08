import { NextRequest } from 'next/server';
import { prisma } from '@prayerflow/db';
import { authenticateRequest, unauthorized, success, badRequest, notFound, forbidden } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();

  if (auth.user.role === 'viewer') return forbidden();

  const { id } = await params;

  const point = await prisma.prayerPoint.findFirst({
    where: { id },
    include: { session: { select: { workspaceId: true } } },
  });
  if (!point) return notFound('Prayer point');

  if (point.session.workspaceId !== auth.workspace.id) {
    return notFound('Prayer point');
  }

  const body = await req.json();
  const { title, body: pointBody, sendMode, scheduledAt } = body;

  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (pointBody !== undefined) updateData.body = pointBody;
  if (sendMode !== undefined) updateData.sendMode = sendMode;
  if (scheduledAt !== undefined) {
    updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
  }

  if (Object.keys(updateData).length === 0) {
    return badRequest('No fields to update');
  }

  const updated = await prisma.prayerPoint.update({
    where: { id },
    data: updateData,
  });

  return success(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();

  if (auth.user.role === 'viewer') return forbidden();

  const { id } = await params;

  const point = await prisma.prayerPoint.findFirst({
    where: { id },
    include: { session: { select: { workspaceId: true } } },
  });
  if (!point) return notFound('Prayer point');

  if (point.session.workspaceId !== auth.workspace.id) {
    return notFound('Prayer point');
  }

  await prisma.prayerPoint.delete({ where: { id } });

  return success({ deleted: true });
}
