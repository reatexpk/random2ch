import dotenv from 'dotenv';

import { channelId, url, corsProxyHost, corsProxyPort } from '../constants';

export default () => {
  dotenv.config();

  const token = process.env.API_TOKEN;
  if (!token) {
    throw new Error('API token is required');
  }

  const whitelist = process.env.WHITELIST;
  if (!whitelist) {
    throw new Error('Whitelist must have at least one value');
  }
  const allowedUsers: string[] = JSON.parse(whitelist);

  if (!channelId) {
    throw new Error(
      'Channel id is required. Please specify a valid channel id in constants.ts',
    );
  }

  if (!url) {
    throw new Error(
      'URL is required. Please specify a valid url in constants.ts',
    );
  }

  const proxy = process.env.PROXY;

  return {
    token,
    allowedUsers,
    channelId,
    url,
    proxy: proxy || '',
    corsProxyHost,
    corsProxyPort,
  };
};
