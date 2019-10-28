/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/camelcase */
import telegraf, { ContextMessageUpdate } from 'telegraf';

import Api from '../api/api';
import getConfig from '../utils/getConfig';
import { transformPostOnError, createPostTest } from '../utils/createPost';

import ThreadModel from '../models/thread';
import logger from '../utils/logger';

const { channelId, url, adminChatId } = getConfig();
const api = new Api(url);

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
          const post = createPostTest(thread);
          bot.telegram
            .sendMessage(channelId, post, {
              parse_mode: 'HTML',
            })
            .catch((err) => {
              if (err.code === 429) {
                return;
              }

              logger.warn(
                `Failed to post thread ${_id} with markdown, retry without markdown`,
              );
              bot.telegram.sendMessage(
                channelId,
                `Failed to post thread ${_id} with markdown\n${thread.comment}`,
              );
              const fallbackPost = transformPostOnError(post);
              bot.telegram.sendMessage(channelId, fallbackPost).catch(() => {
                const errorMessage = `Failed to post thread ${_id}\n${thread.comment}\n${err}`;
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

// export default async function jobPostController(
//   bot: telegraf<ContextMessageUpdate>,
// ) {
//   try {
//     const data = await api.getThreads();

//     data.threads.reverse().forEach((thread) => {
//       const newThread = new ThreadModel({
//         subject: thread.subject,
//         comment: thread.comment,
//         num: thread.num,
//       });
//       newThread
//         .save()
//         .then(({ _id }) => {
//           const post = createPost(thread);
//           bot.telegram
//             .sendMessage(channelId, post, {
//               parse_mode: 'Markdown',
//             })
//             .catch((err) => {
//               if (err.code === 429) {
//                 return;
//               }

//               logger.warn(
//                 `Failed to post thread ${_id} with markdown, retry without markdown`,
//               );
//               bot.telegram.sendMessage(
//                 channelId,
//                 `Failed to post thread ${_id} with markdown\n${thread.comment}`,
//               );
//               const fallbackPost = transformPostOnError(post);
//               bot.telegram.sendMessage(channelId, fallbackPost).catch(() => {
//                 const errorMessage = `Failed to post thread ${_id}\n${thread.comment}\n${err}`;
//                 logger.error(errorMessage);
//                 bot.telegram.sendMessage(adminChatId, errorMessage);
//               });
//             });
//         })
//         .catch(() => {});
//     });
//   } catch (err) {
//     logger.error(`Couldn't fetch threads\n${err}`);
//     console.error(err);
//     bot.telegram.sendMessage(
//       adminChatId,
//       `Couldn't fetch threads\n\nError:\n${err}`,
//     );
//   }
// }
