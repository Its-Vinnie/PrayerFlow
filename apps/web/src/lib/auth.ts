import { NextRequest } from 'next/server';
import { prisma } from '@prayerflow/db';
import { validateTelegramInitData, parseTelegramInitData } from './telegram';

export async function authenticateRequest(req: NextRequest) {
  const initData = req.headers.get('x-telegram-init-data');

  // Development bypass
  if (process.env.NODE_ENV === 'development' && !initData) {
    const devUser = await prisma.user.findFirst({
      where: { isActive: true },
      include: { workspace: true },
    });
    if (devUser) {
      return { user: devUser, workspace: devUser.workspace };
    }
    return null;
  }

  if (!initData) return null;

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return null;

  if (!validateTelegramInitData(initData, botToken)) return null;

  const parsed = parseTelegramInitData(initData);
  if (!parsed) return null;

  const user = await prisma.user.findFirst({
    where: {
      telegramUserId: BigInt(parsed.user.id),
      isActive: true,
    },
    include: { workspace: true },
  });

  if (!user) return null;

  return { user, workspace: user.workspace };
}

export function unauthorized() {
  return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
}

export function forbidden() {
  return Response.json({ success: false, error: 'Forbidden' }, { status: 403 });
}

export function notFound(resource = 'Resource') {
  return Response.json({ success: false, error: `${resource} not found` }, { status: 404 });
}

export function badRequest(message: string) {
  return Response.json({ success: false, error: message }, { status: 400 });
}

export function success<T>(data: T) {
  return Response.json({ success: true, data });
}
