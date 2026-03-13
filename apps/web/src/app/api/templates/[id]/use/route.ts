import { NextRequest } from 'next/server';
import { prisma } from '@prayerflow/db';
import { authenticateRequest, unauthorized, success, badRequest, notFound, forbidden, withErrorHandler } from '@/lib/auth';

export const POST = withErrorHandler(async (
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();

  if (auth.user.role === 'viewer') return forbidden();

  const { id } = await params;

  const template = await prisma.template.findFirst({
    where: { id, workspaceId: auth.workspace.id },
    include: { prayerPoints: { orderBy: { orderIndex: 'asc' } } },
  });
  if (!template) return notFound('Template');

  const body = await req.json();
  const { title, groupId, description, scheduledStartAt } = body;

  if (!title || !groupId) {
    return badRequest('title and groupId are required');
  }

  // Verify group belongs to workspace
  const group = await prisma.telegramGroup.findFirst({
    where: { id: groupId, workspaceId: auth.workspace.id },
  });
  if (!group) return badRequest('Invalid group');

  const session = await prisma.prayerSession.create({
    data: {
      workspaceId: auth.workspace.id,
      groupId,
      title,
      description: description || template.description,
      status: scheduledStartAt ? 'scheduled' : 'draft',
      scheduledStartAt: scheduledStartAt ? new Date(scheduledStartAt) : null,
      createdById: auth.user.id,
      prayerPoints: {
        create: template.prayerPoints.map((point) => ({
          title: point.title,
          body: point.body,
          orderIndex: point.orderIndex,
          sendMode: 'manual',
        })),
      },
    },
    include: {
      group: true,
      createdBy: { select: { id: true, displayName: true, username: true } },
      prayerPoints: { orderBy: { orderIndex: 'asc' } },
    },
  });

  return success(session);
});
