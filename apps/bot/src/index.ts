import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { setupCommands } from './commands/index.js';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

setupCommands(bot);

if (process.env.NODE_ENV !== 'production') {
  bot.launch();
  console.log('PrayerFlow bot started in polling mode');
} else {
  console.log('Bot ready for webhook mode');
}

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
