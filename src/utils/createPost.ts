import he from 'he';

import { Thread as ThreadType } from '../typings/server';
import { baseUrl } from '../constants';

export function transformPostOnError(post: string) {
  const parsedPost = he
    .decode(post)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<br>/gi, '\n')
    .replace(/<\/?strong>/gi, '')
    .replace(/<\/?em>/gi, '')
    .replace(/<\/?span.*?>/gi, '')
    .replace(/<a.+?href="(.+?)".{0,}?>(.+?)<\/a>/g, '$1');
  return parsedPost;
}

function replaceLinks(comment: string) {
  return comment.replace(
    /<a.+?href="(.+?)".{0,}?>(.+?)<\/a>/g,
    (_match, link, linkText) => {
      return `[${linkText}](${link})`;
    },
  );
}

export function parseComment(comment: string) {
  const parsedComment = comment
    .replace(/_/g, '\\_')
    .replace(/\*/g, '\\*')
    .replace(/\[/g, '\\[')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<br>/gi, '\n')
    .replace(/<\/?strong>/gi, '*')
    .replace(/<\/?em>/gi, '_')
    .replace(/<\/?span.*?>/gi, '');
  return replaceLinks(he.decode(parsedComment));
}

export default function createPost({
  subject,
  comment,
  num,
  files,
}: ThreadType) {
  const imageSrc =
    files && files.length
      ? `${baseUrl}${files[0].path}`
      : `${baseUrl}/b/res/${num}.html`;
  const post =
    `*${parseComment(subject)}*[⠀](${imageSrc})\n\n` +
    `${parseComment(comment)}\n\n` +
    `${baseUrl}/b/res/${num}.html`;
  return post;
}
