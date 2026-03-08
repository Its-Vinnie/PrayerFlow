import 'dotenv/config';
import { Telegraf } from 'telegraf';
import { setupCommands } from './commands/index.js';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);

setupCommands(bot);

bot.launch();
console.log('PrayerFlow bot started');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
