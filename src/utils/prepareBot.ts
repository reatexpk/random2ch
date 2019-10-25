import Telegraf, { ContextMessageUpdate } from 'telegraf';
import HttpsProxyAgent from 'https-proxy-agent';

import getConfig from './getConfig';
import checkUser from './checkUser';

import logger from './logger';

const { token, channelId, proxy } = getConfig();

export default () => {
  logger.info(
    `Got config: token: ${token}, channelId: ${channelId}, proxy: ${proxy}`,
  );
  let bot: Telegraf<ContextMessageUpdate>;
  try {
    bot = new Telegraf(token, {
      telegram: {
        agent: new HttpsProxyAgent(proxy),
      },
    });
    logger.info('Bot instance successfully created');
  } catch (err) {
    logger.error(`Couldn't create bot instance\n${err}`);
    throw new Error("Couldn't create bot instance");
  }

  logger.info('Adding auth middleware');
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
  logger.info('Auth middleware successfully added');

  logger.info('Adding /check command');
  bot.command('check', (ctx) => {
    ctx.telegram.sendMessage(channelId, 'Test post');
  });

  return bot;
};
