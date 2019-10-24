/* eslint-disable no-console */
import telegraf, { ContextMessageUpdate } from 'telegraf';
import mongoose from 'mongoose';
import corsProxy from 'cors-anywhere';

import getConfig from './utils/getConfig';
import prepareBot from './utils/prepareBot';

const { corsProxyHost, corsProxyPort } = getConfig();

const mongoURI = process.env.MONGO_URI;
if (!mongoURI) {
  throw new Error('Mongo URI is required');
}

export default (): Promise<telegraf<ContextMessageUpdate>> => {
  return new Promise((resolve, reject) => {
    corsProxy
      .createServer({
        originWhitelist: [],
      })
      .listen(corsProxyPort, corsProxyHost, () => {
        console.log(
          `Running CORS Anywhere on ${corsProxyHost}:${corsProxyPort}`,
        );
      });

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
        resolve(bot);
      })
      .catch((err) => {
        console.log('Failed to start app');
        console.log(err);
        reject();
      });
  });
};
