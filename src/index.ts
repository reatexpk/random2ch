import mongoose from 'mongoose';
import corsProxy from 'cors-anywhere';

import getConfig from './utils/getConfig';
import prepareBot from './utils/prepareBot';

import postController from './controllers/post';
import dropController from './controllers/drop';

const { channelId, corsProxyHost, corsProxyPort } = getConfig();

corsProxy
  .createServer({
    originWhitelist: [],
  })
  .listen(corsProxyPort, corsProxyHost, () => {
    console.log(`Running CORS Anywhere on ${corsProxyHost}:${corsProxyPort}`);
  });

const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  throw new Error('Mongo URI is required');
}
mongoose
  .connect(mongoURI, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');

    const bot = prepareBot();

    bot.command('check', (ctx) => {
      ctx.telegram.sendMessage(channelId, 'Test post');
    });

    bot.command('post', async (ctx) => {
      await postController(ctx);
    });

    bot.command('drop', async (ctx) => {
      await dropController(ctx);
    });

    bot.startPolling();
  })
  .catch((err) => console.log(err));
