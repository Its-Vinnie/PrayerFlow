import { NextRequest } from 'next/server';
import { prisma } from '@prayerflow/db';
import { LIMITS } from '@prayerflow/shared';
import { authenticateRequest, unauthorized, success, withErrorHandler } from '@/lib/auth';

export const GET = withErrorHandler(async (req: NextRequest) => {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  const groupId = searchParams.get('groupId');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), LIMITS.LOGS_MAX_LIMIT);
  const cursor = searchParams.get('cursor');

  const where: Record<string, unknown> = {
    workspaceId: auth.workspace.id,
  };
  if (sessionId) where.sessionId = sessionId;
  if (groupId) where.groupId = groupId;

  const logs = await prisma.sentLog.findMany({
    where,
    include: {
      session: { select: { id: true, title: true } },
      prayerPoint: { select: { id: true, title: true, body: true } },
      group: { select: { id: true, title: true } },
      sentByUser: { select: { id: true, displayName: true, username: true } },
    },
    orderBy: { sentAt: 'desc' },
    take: limit,
    ...(cursor
      ? {
          skip: 1,
          cursor: { id: cursor },
        }
      : {}),
  });

  const nextCursor = logs.length === limit ? logs[logs.length - 1].id : null;

  return success({ logs, nextCursor });
});
