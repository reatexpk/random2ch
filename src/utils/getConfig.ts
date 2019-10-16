import dotenv from 'dotenv';

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

  const channelId = process.env.CHANNEL_ID;
  if (!channelId) {
    throw new Error('channel id is required');
  }

  return {
    token,
    allowedUsers,
    channelId,
  };
};
