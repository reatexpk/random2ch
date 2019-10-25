import bootstrapApp from './bootstrap';

import firstLoadController from './controllers/firstLoad';
import dropController from './controllers/drop';
import logger from './utils/logger';

bootstrapApp()
  .then((bot) => {
    bot.command('first_load', async (ctx) => {
      await firstLoadController(ctx);
    });

    bot.command('drop', async (ctx) => {
      await dropController(ctx);
    });

    bot.on('message', (ctx) => ctx.reply('Unknown command'));

    logger.info('Bot is launching');
    try {
      bot.startPolling();
      logger.info('Bot has been successfully launched');
    } catch (err) {
      logger.error(`Failed to start bot\n${err}`);
    }
  })
  .catch(() => {
    logger.error('Failed to start app');
  });
