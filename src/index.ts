import bootstrapApp from './bootstrap';
import getConfig from './utils/getConfig';

import postController from './controllers/post';
import dropController from './controllers/drop';

const { channelId } = getConfig();

bootstrapApp().then((bot) => {
  bot.command('check', (ctx) => {
    ctx.telegram.sendMessage(channelId, 'Test post');
  });

  bot.command('post', async (ctx) => {
    await postController(ctx);
  });

  bot.command('drop', async (ctx) => {
    await dropController(ctx);
  });

  bot.on('message', (ctx) => ctx.reply('Unknown command'));

  bot.startPolling();
});
