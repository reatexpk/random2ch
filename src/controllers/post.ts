/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/camelcase */
import telegraf, { ContextMessageUpdate } from 'telegraf';
import fs from 'fs';

import Api from '../api';
import getConfig from '../utils/getConfig';
import createPost from '../utils/createPost';

import { Thread as ThreadType } from '../typings/server';

import ThreadModel from '../models/thread';

const { channelId, url, adminChatId } = getConfig();
const api = new Api(url);

async function asyncForEach<T>(
  array: T[],
  callback: (elem: T, index: number, array: T[]) => void,
) {
  for (let index = 0; index < array.length; ) {
    // eslint-disable-next-line no-await-in-loop
    await callback(array[index], index, array);
    index += 1;
  }
}

function sleep(delay: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, delay);
  });
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
            console.log('Failed to save thread in database');
            console.log(err);
          });

        await sleep((index + 1) % 20 === 0 ? 61000 : 1000);
      },
    );
  } catch (err) {
    console.log(err);
  }
}

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
            .catch(() => {
              fs.appendFile(
                'error-log.log',
                `[${new Date().toISOString()}]: an error occurred with thread ${_id}`,
                () => {},
              );
              bot.telegram.sendMessage(
                adminChatId,
                `Failed to post thread ${_id}\n\n${thread.comment}`,
              );
            });
        })
        .catch(() => {});
    });
  } catch (err) {
    console.log(err);
  }
}
