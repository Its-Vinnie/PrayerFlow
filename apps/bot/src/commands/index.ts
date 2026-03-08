import { Telegraf } from 'telegraf';
import { prisma } from '@prayerflow/db';

export function setupCommands(bot: Telegraf) {
  // Handle bot being added to a group
  bot.on('my_chat_member', async (ctx) => {
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
        `/logs - View sent logs`,
    );
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
