import Telegraf from 'telegraf';
import HttpsProxyAgent from 'https-proxy-agent';

import getConfig from './getConfig';
import checkUser from './checkUser';

const { token, channelId, proxy } = getConfig();

export default () => {
  const bot = new Telegraf(token, {
    telegram: {
      agent: new HttpsProxyAgent(proxy),
    },
  });

  bot.use(async (ctx, next) => {
    const { username } = await ctx.getChat();
    if ((!username || !checkUser(username)) && `@${username}` !== channelId) {
      ctx.reply('Access denied');
      return;
    }
    if (next) {
      next();
    }
  });

  bot.command('check', (ctx) => {
    ctx.telegram.sendMessage(channelId, 'Test post');
  });

  return bot;
};
