import { ContextMessageUpdate } from 'telegraf';

import ThreadModel from '../models/thread';

export default async (ctx: ContextMessageUpdate) => {
  await ThreadModel.deleteMany({});
  ctx.reply('Collection has been dropped');
};
