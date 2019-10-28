/* eslint-disable no-console */
import telegraf, { ContextMessageUpdate } from 'telegraf';
import mongoose from 'mongoose';
import corsProxy from 'cors-anywhere';
import { CronJob } from 'cron';

import getConfig from './utils/getConfig';
import prepareBot from './utils/prepareBot';
import logger from './utils/logger';

import jobPostController from './controllers/post';

const { corsProxyHost, corsProxyPort } = getConfig();

const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  throw new Error('Mongo URI is required');
}

let isTaskRunning = false;

export default (): Promise<telegraf<ContextMessageUpdate>> => {
  return new Promise((resolve, reject) => {
    logger.info('Starting app');
    logger.info('Preparing cors proxy server');
    corsProxy
      .createServer({
        originWhitelist: [],
      })
      .listen(corsProxyPort, corsProxyHost, () => {
        logger.info(
          `Cors proxy server is running on ${corsProxyHost}:${corsProxyPort}`,
        );
        console.log(
          `Running CORS Anywhere on ${corsProxyHost}:${corsProxyPort}`,
        );
      });

    logger.info(`Trying to connect to database, URI: ${mongoURI}`);
    mongoose
      .connect(mongoURI, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
      })
      .then(() => {
        logger.info('Successfully connected to database');
        console.log('Connected to MongoDB');

        logger.info('Preparing bot');
        const bot = prepareBot();
        logger.info('Bot is ready to launch');

        logger.info('Creating background task to update threads every minute');
        const job = new CronJob('*/1 * * * *', async () => {
          await jobPostController(bot);
        });
        logger.info('Task created');

        if (!process.env.FIRST_LOAD) {
          logger.info('Starting background task by default');
          job.start();
          isTaskRunning = true;
          logger.info('Background task has been started');
        }

        logger.info('Adding controls to manipulate background task');
        bot.command('start_job', (ctx) => {
          logger.info('Starting background task');
          job.start();
          isTaskRunning = true;
          logger.info('Background task has been started');
          ctx.reply('Job started');
        });

        bot.command('stop_job', (ctx) => {
          logger.info('Stopping background task');
          job.stop();
          isTaskRunning = false;
          ctx.reply('Job stopped');
          logger.info('Background task has been stopped');
        });

        bot.command('/status', (ctx) => {
          const lastExecutionTime = job.lastDate()
            ? job.lastDate().toISOString()
            : '0';
          ctx.reply(
            isTaskRunning
              ? `Task is running\nLast execution time is ${lastExecutionTime}`
              : `Task has been stopped\nLast execution time is ${lastExecutionTime}`,
          );
        });

        resolve(bot);
      })
      .catch((err) => {
        logger.error(`Couldn't connect to database\n${err}`);
        console.log(err);
        reject();
      });
  });
};
