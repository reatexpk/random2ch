/* eslint-disable @typescript-eslint/camelcase */
import mongoose from 'mongoose';
import corsProxy from 'cors-anywhere';
import fs from 'fs';

import Api from './api';
import getConfig from './utils/getConfig';
import createPost from './utils/createPost';
import prepareBot from './utils/prepareBot';

import ThreadModel from './models/thread';

const { channelId, url, corsProxyHost, corsProxyPort } = getConfig();

corsProxy
  .createServer({
    originWhitelist: [],
  })
  .listen(corsProxyPort, corsProxyHost, () => {
    console.log(`Running CORS Anywhere on ${corsProxyHost}:${corsProxyPort}`);
  });

const api = new Api(url);

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
      try {
        const data = await api.getThreads();

        data.threads
          .reverse()
          .slice(0, 10)
          .forEach(async (thread) => {
            const newThread = new ThreadModel({
              subject: thread.subject,
              comment: thread.comment,
              num: thread.num,
            });
            await newThread
              .save()
              .then(({ _id }) => {
                const post = createPost(thread);
                ctx.telegram
                  .sendMessage(channelId, post, {
                    parse_mode: 'Markdown',
                  })
                  .catch(() => {
                    fs.appendFile(
                      'error-log.log',
                      `[${new Date().toISOString()}]: an error occurred with thread ${_id}`,
                      () => {},
                    );
                    ctx.reply(
                      `Failed to post thread ${_id}\n\n${thread.comment}`,
                    );
                  });
              })
              .catch(() => {});
          });
        ctx.reply('New threads have been posted');
      } catch (error) {
        console.log(error);
      }
    });

    bot.command('drop', async (ctx) => {
      await ThreadModel.deleteMany({});
      ctx.reply('Collection has been dropped');
    });

    // handle unknown commands and messages
    bot.on('message', (ctx) => ctx.reply('Unknown command'));

    bot.startPolling();
  })
  .catch((err) => console.log(err));
