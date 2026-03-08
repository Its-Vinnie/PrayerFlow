import { NextRequest } from 'next/server';
import { prisma } from '@prayerflow/db';
import { authenticateRequest, unauthorized, success, badRequest, forbidden } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();

  const groups = await prisma.telegramGroup.findMany({
    where: {
      workspaceId: auth.workspace.id,
      isActive: true,
    },
    orderBy: { title: 'asc' },
  });

  return success(groups);
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (!auth) return unauthorized();

  if (auth.user.role !== 'super_admin' && auth.user.role !== 'admin') {
    return forbidden();
  }

  const body = await req.json();
  const { telegramChatId, title, type } = body;

  if (!telegramChatId || !title) {
    return badRequest('telegramChatId and title are required');
  }

  // Check if group already exists in workspace
  const existing = await prisma.telegramGroup.findFirst({
    where: {
      workspaceId: auth.workspace.id,
      telegramChatId: BigInt(telegramChatId),
    },
  });

  if (existing) {
    return badRequest('Group already exists in this workspace');
  }

  const group = await prisma.telegramGroup.create({
    data: {
      workspaceId: auth.workspace.id,
      telegramChatId: BigInt(telegramChatId),
      title,
      type: type || 'group',
    },
  });

  return success(group);
}
