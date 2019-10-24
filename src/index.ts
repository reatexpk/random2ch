/* eslint-disable @typescript-eslint/camelcase */
import Telegraf from 'telegraf';
import mongoose, { Schema, Document } from 'mongoose';
import HttpsProxyAgent from 'https-proxy-agent';
import corsProxy from 'cors-anywhere';
import he from 'he';
import fs from 'fs';

import Api from './api';
import getConfig from './utils/getConfig';
import checkUser from './utils/checkUser';

import { Thread as ThreadType } from './typings/server';

const {
  token,
  channelId,
  url,
  proxy,
  corsProxyHost,
  corsProxyPort,
} = getConfig();

corsProxy
  .createServer({
    originWhitelist: [],
  })
  .listen(corsProxyPort, corsProxyHost, () => {
    console.log(`Running CORS Anywhere on ${corsProxyHost}:${corsProxyPort}`);
  });

const api = new Api(url);
const bot = new Telegraf(token, {
  telegram: {
    agent: new HttpsProxyAgent(proxy),
  },
});

interface ThreadModel extends Document {
  subject: string;
  comment: string;
  num: string;
}

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

    const ThreadSchema = new Schema<ThreadType>({
      subject: String,
      comment: String,
      num: {
        type: String,
        unique: true,
      },
    });
    const Thread = mongoose.model<ThreadModel>('threads', ThreadSchema);

    function replaceLinks(comment: string) {
      return comment.replace(
        /<a.+?href="(.+?)".{0,}?>(.+?)<\/a>/g,
        (_match, link, linkText) => {
          return `[${linkText}](${link})`;
        },
      );
    }

    function parseComment(comment: string) {
      const parsedComment = comment
        .replace(/_/g, '\\_')
        .replace(/\[/g, '\\[')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<br>/gi, '\n')
        .replace(/<\/?strong>/gi, '*')
        .replace(/<\/?em>/gi, '_')
        .replace(/<span class="spoiler">/gi, '')
        .replace(/<\/span>/gi, '');
      return replaceLinks(he.decode(parsedComment));
    }

    function createPost({ subject, comment, num, files }: ThreadType) {
      const imageSrc =
        files && files.length
          ? `https://2ch.hk${files[0].path}`
          : `https://2ch.hk/b/res/${num}.html`;
      const post =
        `*${parseComment(subject)}*[⠀](${imageSrc})\n\n` +
        `${parseComment(comment)}\n\n` +
        `https://2ch.hk/b/res/${num}.html`;
      return post;
    }

    // Auth middleware
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

    bot.command('post', async (ctx) => {
      try {
        const data = await api.getThreads();

        data.threads
          .reverse()
          .slice(0, 10)
          .forEach(async (thread) => {
            const newThread = new Thread({
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
      await Thread.deleteMany({});
      ctx.reply('Collection has been dropped');
    });

    // handle unknown commands and messages
    bot.on('message', (ctx) => ctx.reply('Unknown command'));

    bot.startPolling();
  })
  .catch((err) => console.log(err));
