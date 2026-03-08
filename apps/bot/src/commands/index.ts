import { Telegraf } from 'telegraf';

export function setupCommands(bot: Telegraf) {
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
