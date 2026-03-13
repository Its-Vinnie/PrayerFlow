import { NextRequest } from 'next/server';
import { prisma } from '@prayerflow/db';
import { authenticateRequest, unauthorized, success, notFound, forbidden, withErrorHandler } from '@/lib/auth';

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
    include: { prayerPoints: { orderBy: { orderIndex: 'asc' } } },
  });
  if (!session) return notFound('Session');

  const duplicated = await prisma.prayerSession.create({
    data: {
      workspaceId: auth.workspace.id,
      groupId: session.groupId,
      title: `${session.title} (copy)`,
      description: session.description,
      status: 'draft',
      createdById: auth.user.id,
      prayerPoints: {
        create: session.prayerPoints.map((point) => ({
          title: point.title,
          body: point.body,
          orderIndex: point.orderIndex,
          sendMode: point.sendMode,
        })),
      },
    },
    include: {
      group: true,
      createdBy: { select: { id: true, displayName: true, username: true } },
      prayerPoints: { orderBy: { orderIndex: 'asc' } },
    },
  });

  return success(duplicated);
});
