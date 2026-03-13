import { Telegraf } from 'telegraf';
import { prisma } from '@prayerflow/db';

export function setupCommands(bot: Telegraf) {
  // Handle bot being added to a group
  bot.on('my_chat_member', async (ctx) => {
    try {
      const chat = ctx.myChatMember.chat;
      const newStatus = ctx.myChatMember.new_chat_member.status;
      const from = ctx.myChatMember.from;

      // Only handle group/supergroup/channel
      if (chat.type !== 'group' && chat.type !== 'supergroup' && chat.type !== 'channel') return;

      // Bot was added or promoted
      if (newStatus === 'member' || newStatus === 'administrator') {
        const telegramChatId = BigInt(chat.id);
        const isAdmin = newStatus === 'administrator';

        // Find the user who added the bot
        const user = await prisma.user.findFirst({
          where: { telegramUserId: BigInt(from.id), isActive: true },
          include: { workspace: true },
        });

        if (!user) {
          console.log(`Bot added to group by unknown user ${from.id} - skipping registration`);
          return;
        }

        // Upsert the group
        await prisma.telegramGroup.upsert({
          where: {
            workspaceId_telegramChatId: {
              workspaceId: user.workspaceId,
              telegramChatId,
            },
          },
          update: {
            title: chat.title || 'Untitled Group',
            type: chat.type === 'channel' ? 'channel' : chat.type === 'supergroup' ? 'supergroup' : 'group',
            botIsAdmin: isAdmin,
            isActive: true,
          },
          create: {
            workspaceId: user.workspaceId,
            telegramChatId,
            title: chat.title || 'Untitled Group',
            type: chat.type === 'channel' ? 'channel' : chat.type === 'supergroup' ? 'supergroup' : 'group',
            botIsAdmin: isAdmin,
          },
        });

        console.log(`Registered group "${chat.title}" (${chat.id}) for workspace ${user.workspaceId}`);

        try {
          await ctx.telegram.sendMessage(
            chat.id,
            `PrayerFlow is now connected to this group! Prayer points will be sent here during live sessions.`,
          );
        } catch {
          // May not have permission to send messages yet
        }
      }

      // Bot was removed from group
      if (newStatus === 'left' || newStatus === 'kicked') {
        const telegramChatId = BigInt(chat.id);

        await prisma.telegramGroup.updateMany({
          where: { telegramChatId },
          data: { isActive: false },
        });

        console.log(`Bot removed from group "${chat.title}" (${chat.id})`);
      }
    } catch (error) {
      console.error('Error handling my_chat_member event:', error);
    }
  });

  // --- Inline Mode ---
  bot.on('inline_query', async (ctx) => {
    const query = ctx.inlineQuery.query.trim();
    const from = ctx.inlineQuery.from;

    try {
      // Find the user
      const user = await prisma.user.findFirst({
        where: { telegramUserId: BigInt(from.id), isActive: true },
      });

      if (!user) {
        await ctx.answerInlineQuery([], {
          button: { text: 'Set up PrayerFlow first', start_parameter: 'start' },
          cache_time: 5,
        });
        return;
      }

      // Search prayer points from live/paused sessions
      const where: any = {
        session: {
          workspaceId: user.workspaceId,
          status: { in: ['live', 'paused'] },
        },
        status: 'pending',
      };

      if (query) {
        where.OR = [
          { title: { contains: query, mode: 'insensitive' } },
          { body: { contains: query, mode: 'insensitive' } },
        ];
      }

      const points = await prisma.prayerPoint.findMany({
        where,
        include: {
          session: {
            select: { title: true, group: { select: { telegramChatId: true, title: true } } },
          },
        },
        orderBy: { orderIndex: 'asc' },
        take: 20,
      });

      if (points.length === 0) {
        // Show sessions as a fallback — allow browsing
        const sessions = await prisma.prayerSession.findMany({
          where: {
            workspaceId: user.workspaceId,
            status: { in: ['draft', 'scheduled', 'live'] },
          },
          include: {
            _count: { select: { prayerPoints: true } },
            group: { select: { title: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        const results = sessions.map((s) => ({
          type: 'article' as const,
          id: `session-${s.id}`,
          title: s.title,
          description: `${s._count.prayerPoints} points · ${s.group?.title || 'No group'} · ${s.status}`,
          input_message_content: {
            message_text: `📋 *${s.title}*\n\nStatus: ${s.status}\nPoints: ${s._count.prayerPoints}\nGroup: ${s.group?.title || 'N/A'}`,
            parse_mode: 'Markdown' as const,
          },
        }));

        await ctx.answerInlineQuery(results, { cache_time: 10 });
        return;
      }

      const results = points.map((p) => ({
        type: 'article' as const,
        id: `point-${p.id}`,
        title: p.title,
        description: p.body.length > 100 ? p.body.substring(0, 100) + '...' : p.body,
        input_message_content: {
          message_text: `🙏 *${p.title}*\n\n${p.body}`,
          parse_mode: 'Markdown' as const,
        },
      }));

      await ctx.answerInlineQuery(results, { cache_time: 10 });
    } catch (err) {
      console.error('Inline query error:', err);
      await ctx.answerInlineQuery([], { cache_time: 5 });
    }
  });

  // Handle chosen inline result — mark point as sent if it was from a live session
  bot.on('chosen_inline_result', async (ctx) => {
    const resultId = ctx.chosenInlineResult.result_id;
    const from = ctx.chosenInlineResult.from;

    if (!resultId.startsWith('point-')) return;

    const pointId = resultId.replace('point-', '');

    try {
      const user = await prisma.user.findFirst({
        where: { telegramUserId: BigInt(from.id), isActive: true },
      });
      if (!user) return;

      const point = await prisma.prayerPoint.findUnique({
        where: { id: pointId },
        include: { session: true },
      });
      if (!point || point.status !== 'pending') return;
      if (point.session.status !== 'live') return;

      // Mark as sent
      await prisma.prayerPoint.update({
        where: { id: pointId },
        data: { status: 'sent', sentAt: new Date() },
      });

      // Create sent log
      await prisma.sentLog.create({
        data: {
          workspaceId: user.workspaceId,
          sessionId: point.sessionId,
          prayerPointId: pointId,
          groupId: point.session.groupId,
          sentByType: 'user',
          sentByUserId: user.id,
          status: 'sent',
          metadata: { via: 'inline_mode' },
        },
      });

      console.log(`Inline send: point ${pointId} sent by ${from.id}`);
    } catch (err) {
      console.error('Chosen inline result error:', err);
    }
  });

  bot.start((ctx) => {
    const firstName = ctx.from?.first_name || 'there';
    ctx.reply(
      `Welcome to PrayerFlow, ${firstName}! \n\nPrepare, schedule, and send prayer points into your Telegram groups during live prayer sessions.\n\nTap below to get started.`,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Open PrayerFlow',
                web_app: { url: process.env.MINI_APP_URL || 'https://prayerflow.app' },
              },
            ],
            [{ text: 'Help', callback_data: 'help' }],
          ],
        },
      },
    );
  });

  bot.help((ctx) => {
    ctx.reply(
      `PrayerFlow Commands:\n\n` +
        `/start - Launch PrayerFlow\n` +
        `/help - Show this help message\n` +
        `/newsession - Create a new prayer session\n` +
        `/sessions - View your sessions\n` +
        `/today - Today's sessions\n` +
        `/live - Open live dashboard\n` +
        `/sendnext - Send next prayer point\n` +
        `/pause - Pause active session\n` +
        `/resume - Resume paused session\n` +
        `/skip - Skip next prayer point\n` +
        `/templates - View templates\n` +
        `/logs - View sent logs\n\n` +
        `*Inline Mode:* Type @${ctx.botInfo.username} in any chat to search and send prayer points.`,
      { parse_mode: 'Markdown' },
    );
  });

  // /sendnext — Send the next pending point from the active live session
  bot.command('sendnext', async (ctx) => {
    try {
      const user = await prisma.user.findFirst({
        where: { telegramUserId: BigInt(ctx.from.id), isActive: true },
      });
      if (!user || user.role === 'viewer') {
        ctx.reply('You do not have permission to send prayer points.');
        return;
      }

      const session = await prisma.prayerSession.findFirst({
        where: { workspaceId: user.workspaceId, status: 'live' },
        include: { group: true },
        orderBy: { startedAt: 'desc' },
      });
      if (!session) {
        ctx.reply('No live session found. Start a session first.');
        return;
      }

      const nextPoint = await prisma.prayerPoint.findFirst({
        where: { sessionId: session.id, status: 'pending' },
        orderBy: { orderIndex: 'asc' },
      });
      if (!nextPoint) {
        ctx.reply('All prayer points have been sent!');
        return;
      }

      // Send to the group
      const text = `🙏 *${nextPoint.title}*\n\n${nextPoint.body}`;
      const result = await ctx.telegram.sendMessage(
        session.group.telegramChatId.toString(),
        text,
        { parse_mode: 'Markdown' },
      );

      // Update point
      await prisma.prayerPoint.update({
        where: { id: nextPoint.id },
        data: { status: 'sent', sentAt: new Date() },
      });

      // Create log
      await prisma.sentLog.create({
        data: {
          workspaceId: user.workspaceId,
          sessionId: session.id,
          prayerPointId: nextPoint.id,
          groupId: session.groupId,
          telegramMessageId: BigInt(result.message_id),
          sentByType: 'user',
          sentByUserId: user.id,
          status: 'sent',
        },
      });

      ctx.reply(`Sent: "${nextPoint.title}" to ${session.group.title}`);
    } catch (err: any) {
      console.error('sendnext error:', err);
      ctx.reply('Failed to send prayer point. Try again.');
    }
  });

  // /pause — Pause the active live session
  bot.command('pause', async (ctx) => {
    try {
      const user = await prisma.user.findFirst({
        where: { telegramUserId: BigInt(ctx.from.id), isActive: true },
      });
      if (!user || user.role === 'viewer') {
        ctx.reply('You do not have permission to control sessions.');
        return;
      }

      const session = await prisma.prayerSession.findFirst({
        where: { workspaceId: user.workspaceId, status: 'live' },
        orderBy: { startedAt: 'desc' },
      });
      if (!session) {
        ctx.reply('No live session to pause.');
        return;
      }

      await prisma.prayerSession.update({
        where: { id: session.id },
        data: { status: 'paused' },
      });

      ctx.reply(`Session "${session.title}" paused.`);
    } catch (err) {
      console.error('pause error:', err);
      ctx.reply('Failed to pause session.');
    }
  });

  // /resume — Resume a paused session
  bot.command('resume', async (ctx) => {
    try {
      const user = await prisma.user.findFirst({
        where: { telegramUserId: BigInt(ctx.from.id), isActive: true },
      });
      if (!user || user.role === 'viewer') {
        ctx.reply('You do not have permission to control sessions.');
        return;
      }

      const session = await prisma.prayerSession.findFirst({
        where: { workspaceId: user.workspaceId, status: 'paused' },
        orderBy: { updatedAt: 'desc' },
      });
      if (!session) {
        ctx.reply('No paused session to resume.');
        return;
      }

      await prisma.prayerSession.update({
        where: { id: session.id },
        data: { status: 'live' },
      });

      ctx.reply(`Session "${session.title}" resumed.`);
    } catch (err) {
      console.error('resume error:', err);
      ctx.reply('Failed to resume session.');
    }
  });

  // /skip — Skip the next pending point
  bot.command('skip', async (ctx) => {
    try {
      const user = await prisma.user.findFirst({
        where: { telegramUserId: BigInt(ctx.from.id), isActive: true },
      });
      if (!user || user.role === 'viewer') {
        ctx.reply('You do not have permission to skip prayer points.');
        return;
      }

      const session = await prisma.prayerSession.findFirst({
        where: { workspaceId: user.workspaceId, status: 'live' },
        orderBy: { startedAt: 'desc' },
      });
      if (!session) {
        ctx.reply('No live session found.');
        return;
      }

      const nextPoint = await prisma.prayerPoint.findFirst({
        where: { sessionId: session.id, status: 'pending' },
        orderBy: { orderIndex: 'asc' },
      });
      if (!nextPoint) {
        ctx.reply('No pending points to skip.');
        return;
      }

      await prisma.prayerPoint.update({
        where: { id: nextPoint.id },
        data: { status: 'skipped', skippedAt: new Date() },
      });

      ctx.reply(`Skipped: "${nextPoint.title}"`);
    } catch (err) {
      console.error('skip error:', err);
      ctx.reply('Failed to skip prayer point.');
    }
  });

  bot.command('newsession', (ctx) => {
    ctx.reply('Create a new prayer session:', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Open Session Creator',
              web_app: {
                url: `${process.env.MINI_APP_URL || 'https://prayerflow.app'}/sessions/new`,
              },
            },
          ],
        ],
      },
    });
  });

  bot.command('sessions', (ctx) => {
    ctx.reply('View your prayer sessions:', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'View Sessions',
              web_app: {
                url: `${process.env.MINI_APP_URL || 'https://prayerflow.app'}/sessions`,
              },
            },
          ],
        ],
      },
    });
  });

  bot.command('today', (ctx) => {
    ctx.reply("View today's sessions:", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "Today's Sessions",
              web_app: {
                url: `${process.env.MINI_APP_URL || 'https://prayerflow.app'}/sessions?filter=today`,
              },
            },
          ],
        ],
      },
    });
  });

  bot.command('live', (ctx) => {
    ctx.reply('Open the live dashboard:', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Live Dashboard',
              web_app: {
                url: `${process.env.MINI_APP_URL || 'https://prayerflow.app'}/live`,
              },
            },
          ],
        ],
      },
    });
  });

  bot.command('templates', (ctx) => {
    ctx.reply('View your prayer templates:', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'View Templates',
              web_app: {
                url: `${process.env.MINI_APP_URL || 'https://prayerflow.app'}/templates`,
              },
            },
          ],
        ],
      },
    });
  });

  bot.command('logs', (ctx) => {
    ctx.reply('View sent logs:', {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'View Logs',
              web_app: {
                url: `${process.env.MINI_APP_URL || 'https://prayerflow.app'}/logs`,
              },
            },
          ],
        ],
      },
    });
  });

  bot.on('callback_query', (ctx) => {
    if ('data' in ctx.callbackQuery && ctx.callbackQuery.data === 'help') {
      ctx.answerCbQuery();
      ctx.reply(
        `PrayerFlow helps you manage and send prayer points during live prayer sessions.\n\nUse /help to see all commands.`,
      );
    }
  });
}
