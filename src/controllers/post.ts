/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/camelcase */
import telegraf, { ContextMessageUpdate } from 'telegraf';
import fs from 'fs';

import Api from '../api/api';
import getConfig from '../utils/getConfig';
import createPost, { transformPostOnError } from '../utils/createPost';

import ThreadModel from '../models/thread';

const { channelId, url, adminChatId } = getConfig();
const api = new Api(`${url}/test`);

export default async function jobPostController(
  bot: telegraf<ContextMessageUpdate>,
) {
  try {
    const data = await api.getThreads();

    data.threads.reverse().forEach((thread) => {
      const newThread = new ThreadModel({
        subject: thread.subject,
        comment: thread.comment,
        num: thread.num,
      });
      newThread
        .save()
        .then(({ _id }) => {
          const post = createPost(thread);
          bot.telegram
            .sendMessage(channelId, post, {
              parse_mode: 'Markdown',
            })
            .catch((err) => {
              if (err.code === 429) {
                return;
              }

              const fallbackPost = transformPostOnError(post);
              bot.telegram.sendMessage(channelId, fallbackPost).catch(() => {
                fs.appendFile(
                  'error-log.log',
                  `[${new Date().toISOString()}]: an error occurred with thread ${_id}: ${err}\n`,
                  () => {
                    bot.telegram.sendMessage(
                      adminChatId,
                      `Failed to post thread ${_id}\n\n${thread.comment}\n\nError:\n${err}`,
                    );
                  },
                );
              });
            });
        })
        .catch(() => {});
    });
  } catch (err) {
    console.error(err);
  }
}
