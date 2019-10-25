import bootstrapApp from './bootstrap';

import firstLoadController from './controllers/firstLoad';
import dropController from './controllers/drop';

bootstrapApp().then((bot) => {
  bot.command('first_load', async (ctx) => {
    await firstLoadController(ctx);
  });

  bot.command('drop', async (ctx) => {
    await dropController(ctx);
  });

  bot.on('message', (ctx) => ctx.reply('Unknown command'));

  bot.startPolling();
});
