import { NextRequest } from 'next/server';
import { prisma } from '@prayerflow/db';
import { authenticateRequest, unauthorized, success, badRequest, notFound, forbidden } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();

  const { id } = await params;

  const session = await prisma.prayerSession.findFirst({
    where: { id, workspaceId: auth.workspace.id },
    include: {
      group: true,
      createdBy: { select: { id: true, displayName: true, username: true } },
      prayerPoints: { orderBy: { orderIndex: 'asc' } },
    },
  });

  if (!session) return notFound('Session');

  return success(session);
}

export async function PATCH(
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
  const { title, description, groupId, scheduledStartAt } = body;

  const updateData: Record<string, unknown> = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (scheduledStartAt !== undefined) {
    updateData.scheduledStartAt = scheduledStartAt ? new Date(scheduledStartAt) : null;
  }

  if (groupId !== undefined) {
    const group = await prisma.telegramGroup.findFirst({
      where: { id: groupId, workspaceId: auth.workspace.id },
    });
    if (!group) return badRequest('Invalid group');
    updateData.groupId = groupId;
  }

  const updated = await prisma.prayerSession.update({
    where: { id },
    data: updateData,
    include: {
      group: true,
      createdBy: { select: { id: true, displayName: true, username: true } },
      prayerPoints: { orderBy: { orderIndex: 'asc' } },
    },
  });

  return success(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();

  if (auth.user.role === 'viewer' || auth.user.role === 'operator') return forbidden();

  const { id } = await params;

  const session = await prisma.prayerSession.findFirst({
    where: { id, workspaceId: auth.workspace.id },
  });
  if (!session) return notFound('Session');

  if (session.status !== 'draft') {
    return badRequest('Only draft sessions can be deleted');
  }

  await prisma.prayerSession.delete({ where: { id } });

  return success({ deleted: true });
}
