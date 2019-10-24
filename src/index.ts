import bootstrapApp from './bootstrap';

import postController from './controllers/post';
import dropController from './controllers/drop';

bootstrapApp().then((bot) => {
  bot.command('post', async (ctx) => {
    await postController(ctx);
  });

  bot.command('drop', async (ctx) => {
    await dropController(ctx);
  });

  bot.on('message', (ctx) => ctx.reply('Unknown command'));

  bot.startPolling();
});
