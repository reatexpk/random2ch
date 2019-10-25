/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/camelcase */
import telegraf, { ContextMessageUpdate } from 'telegraf';

import Api from '../api/api';
import getConfig from '../utils/getConfig';
import createPost, { transformPostOnError } from '../utils/createPost';

import ThreadModel from '../models/thread';
import logger from '../utils/logger';

const { channelId, url, adminChatId } = getConfig();
const api = new Api(url);

export default async function jobPostController(
  bot: telegraf<ContextMessageUpdate>,
) {
  logger.info('Trying to fetch threads');
  try {
    const data = await api.getThreads();
    logger.info('Threads have been fetched');

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

              logger.warn(
                `Failed to post thread ${_id} with markdown, retry without markdown`,
              );
              const fallbackPost = transformPostOnError(post);
              bot.telegram.sendMessage(channelId, fallbackPost).catch(() => {
                const errorMessage = `Failed to post thread ${_id}\n\n${thread.comment}\n\nError:\n${err}`;
                logger.error(errorMessage);
                bot.telegram.sendMessage(adminChatId, errorMessage);
              });
            });
        })
        .catch(() => {});
    });
  } catch (err) {
    logger.error(`Couldn't fetch threads\n${err}`);
    console.error(err);
    bot.telegram.sendMessage(
      adminChatId,
      `Couldn't fetch threads\n\nError:\n${err}`,
    );
  }
}
