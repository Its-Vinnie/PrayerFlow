import { NextRequest } from 'next/server';
import { prisma } from '@prayerflow/db';
import { validateTelegramInitData, parseTelegramInitData } from '@/lib/telegram';
import { success, badRequest, unauthorized } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { initData } = body;

  if (!initData || typeof initData !== 'string') {
    return badRequest('Missing initData');
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return badRequest('Bot token not configured');
  }

  if (!validateTelegramInitData(initData, botToken)) {
    return unauthorized();
  }

  const parsed = parseTelegramInitData(initData);
  if (!parsed) {
    return badRequest('Invalid init data');
  }

  const telegramUserId = BigInt(parsed.user.id);

  // Find existing user
  let user = await prisma.user.findFirst({
    where: { telegramUserId, isActive: true },
    include: { workspace: true },
  });

  if (!user) {
    // Create workspace and user for new Telegram users
    const workspace = await prisma.workspace.create({
      data: {
        name: `${parsed.user.firstName}'s Workspace`,
        slug: `ws-${parsed.user.id}-${Date.now()}`,
      },
    });

    user = await prisma.user.create({
      data: {
        workspaceId: workspace.id,
        telegramUserId,
        username: parsed.user.username || null,
        displayName: [parsed.user.firstName, parsed.user.lastName].filter(Boolean).join(' '),
        role: 'super_admin',
      },
      include: { workspace: true },
    });
  } else {
    // Update user info if changed
    await prisma.user.update({
      where: { id: user.id },
      data: {
        username: parsed.user.username || user.username,
        displayName:
          [parsed.user.firstName, parsed.user.lastName].filter(Boolean).join(' ') ||
          user.displayName,
      },
    });
  }

  return success({
    user: {
      id: user.id,
      telegramUserId: user.telegramUserId.toString(),
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    },
    workspace: {
      id: user.workspace.id,
      name: user.workspace.name,
      slug: user.workspace.slug,
    },
  });
}
