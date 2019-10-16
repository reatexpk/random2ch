import Telegraf from 'telegraf';

import getConfig from './utils/getConfig';

const { token, allowedUsers, channelId } = getConfig();

function checkUser(username: string) {
  return allowedUsers.includes(username);
}

const bot = new Telegraf(token);

// Auth middleware
bot.use(async (ctx, next) => {
  const { username } = await ctx.getChat();
  if (!username || !checkUser(username)) {
    ctx.reply('Access denied');
    return;
  }
  if (next) {
    next();
  }
});

bot.start((ctx) => {
  ctx.reply('Executed start command');
});

bot.command('post', (ctx) => {
  ctx.telegram.sendMessage(channelId, 'Test post via /post command');
});

bot.on('message', (ctx) => ctx.reply('Unknown command'));

bot.startPolling();
