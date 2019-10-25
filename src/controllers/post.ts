/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/camelcase */
import telegraf, { ContextMessageUpdate } from 'telegraf';
import fs from 'fs';

import Api from '../api';
import getConfig from '../utils/getConfig';
import createPost, { transformPostOnError } from '../utils/createPost';
import { asyncForEach, sleep } from '../utils/async';

import { Thread as ThreadType } from '../typings/server';

import ThreadModel from '../models/thread';

const { channelId, url, adminChatId } = getConfig();
const api = new Api(url);

export async function jobPostController(bot: telegraf<ContextMessageUpdate>) {
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
                  `[${new Date().toISOString()}]: an error occurred with thread ${_id}\n${err}\n\n`,
                  () => {},
                );
                bot.telegram.sendMessage(
                  adminChatId,
                  `Failed to post thread ${_id}\n\n${thread.comment}`,
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

export async function firstLoadController(ctx: ContextMessageUpdate) {
  try {
    const data = await api.getThreads();

    await asyncForEach<ThreadType>(
      data.threads.reverse(),
      async (thread, index) => {
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
              .catch((err) => {
                fs.appendFile(
                  'error-log.log',
                  `[${new Date().toISOString()}]: an error occurred with thread ${_id}\n${err}\n\n`,
                  () => {},
                );
                ctx.reply(`Failed to post thread ${_id}\n\n${thread.comment}`);
              });
          })
          .catch((err) => {
            console.error('Failed to save thread in database');
            console.error(err);
          });

        await sleep((index + 1) % 20 === 0 ? 61000 : 1000);
      },
    );
  } catch (err) {
    console.error(err);
  }
}
