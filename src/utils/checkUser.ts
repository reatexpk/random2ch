import getConfig from './getConfig';

const { allowedUsers } = getConfig();

export default (username: string) => {
  return allowedUsers.includes(username);
};
