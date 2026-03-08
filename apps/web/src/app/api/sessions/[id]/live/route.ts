import { NextRequest } from 'next/server';
import { prisma } from '@prayerflow/db';
import { authenticateRequest, unauthorized, success, badRequest, notFound, forbidden } from '@/lib/auth';

async function sendToTelegram(chatId: bigint, title: string, body: string): Promise<{ messageId?: number; error?: string }> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return { error: 'Bot token not configured' };

  const text = `🙏 *${title}*\n\n${body}`;

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId.toString(),
      text,
      parse_mode: 'Markdown',
    }),
  });

  const data = await res.json();
  if (!data.ok) {
    return { error: data.description || 'Failed to send message' };
  }

  return { messageId: data.result.message_id };
}

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

      // Send to Telegram group
      const sendResult = await sendToTelegram(session.group.telegramChatId, nextPoint.title, nextPoint.body);
      if (sendResult.error) {
        // Update point status to failed
        await prisma.prayerPoint.update({
          where: { id: nextPoint.id },
          data: { status: 'failed' },
        });
        return badRequest(`Failed to send to Telegram: ${sendResult.error}`);
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
          telegramMessageId: sendResult.messageId ? BigInt(sendResult.messageId) : null,
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

      // Send to Telegram group
      const sendNowResult = await sendToTelegram(session.group.telegramChatId, point.title, point.body);
      if (sendNowResult.error) {
        await prisma.prayerPoint.update({
          where: { id: pointId },
          data: { status: 'failed' },
        });
        return badRequest(`Failed to send to Telegram: ${sendNowResult.error}`);
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
          telegramMessageId: sendNowResult.messageId ? BigInt(sendNowResult.messageId) : null,
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
