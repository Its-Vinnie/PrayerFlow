import { NextRequest } from 'next/server';
import { prisma } from '@prayerflow/db';
import { authenticateRequest, unauthorized, success, badRequest, forbidden } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const groupId = searchParams.get('groupId');

  const where: Record<string, unknown> = {
    workspaceId: auth.workspace.id,
  };
  if (status) where.status = status;
  if (groupId) where.groupId = groupId;

  const sessions = await prisma.prayerSession.findMany({
    where,
    include: {
      group: true,
      createdBy: { select: { id: true, displayName: true, username: true } },
      _count: { select: { prayerPoints: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return success(sessions);
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();

  if (auth.user.role === 'viewer') return forbidden();

  const body = await req.json();
  const { title, description, groupId, scheduledStartAt } = body;

  if (!title || !groupId) {
    return badRequest('title and groupId are required');
  }

  // Verify group belongs to workspace
  const group = await prisma.telegramGroup.findFirst({
    where: { id: groupId, workspaceId: auth.workspace.id },
  });
  if (!group) {
    return badRequest('Invalid group');
  }

  const session = await prisma.prayerSession.create({
    data: {
      workspaceId: auth.workspace.id,
      groupId,
      title,
      description: description || null,
      scheduledStartAt: scheduledStartAt ? new Date(scheduledStartAt) : null,
      status: scheduledStartAt ? 'scheduled' : 'draft',
      createdById: auth.user.id,
    },
    include: {
      group: true,
      createdBy: { select: { id: true, displayName: true, username: true } },
    },
  });

  return success(session);
}
