import Telegraf from 'telegraf';

import Api from './api';
import getConfig from './utils/getConfig';
import checkUser from './utils/checkUser';

const { token, channelId, url } = getConfig();

const api = new Api(url);
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

bot.command('count', async (ctx) => {
  try {
    const data = await api.getThreads();
    ctx.reply(`Current threads amount: ${data.threads.length}`);
  } catch (error) {
    ctx.reply(`An error occurred:\n${error.message}`);
  }
});

// handle unknown commands and messages
bot.on('message', (ctx) => ctx.reply('Unknown command'));

bot.startPolling();
