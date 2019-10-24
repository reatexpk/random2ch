/* eslint-disable @typescript-eslint/camelcase */
import { ContextMessageUpdate } from 'telegraf';
import fs from 'fs';

import Api from '../api';
import getConfig from '../utils/getConfig';
import createPost from '../utils/createPost';

import ThreadModel from '../models/thread';

const { channelId, url } = getConfig();
const api = new Api(url);

export default async (ctx: ContextMessageUpdate) => {
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
                ctx.reply(`Failed to post thread ${_id}\n\n${thread.comment}`);
              });
          })
          .catch(() => {});
      });
    ctx.reply('New threads have been posted');
  } catch (error) {
    console.log(error);
  }
};
