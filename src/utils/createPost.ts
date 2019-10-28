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

function finalCheck(parsedString: string) {
  let returnString = parsedString;
  if (returnString.match(/<em>([^]+<a\s.*?>([^]+)<\/a>[^]+)<\/em>/gi)) {
    returnString = returnString.replace(
      /<a.+?href="(.+?)".{0,}?>(.+?)<\/a>/gi,
      '$1',
    );
  }
  if (returnString.match(/<strong>([^]+<a\s.*?>([^]+)<\/a>[^]+)<\/strong>/gi)) {
    returnString = returnString.replace(
      /<a.+?href="(.+?)".{0,}?>(.+?)<\/a>/gi,
      '$1',
    );
  }
  return returnString;
}

function parseStringToHtml(text: string) {
  const decodedHtml = he.decode(text);
  const returnString = decodedHtml
    .replace(/<br>/gi, '\n')
    .replace(/<br \/>/gi, '\n')
    .replace(/<\/?sup>/gi, '')
    .replace(/<\/?sub>/gi, '')
    .replace(/<\/?span.*?>/gi, '');
  return finalCheck(returnString);
}

export function createPostTest({ subject, comment, num, files }: ThreadType) {
  const imageSrc =
    files && files.length
      ? `${baseUrl}${files[0].path}`
      : `${baseUrl}/b/res/${num}.html`;
  const post =
    `<strong>${parseStringToHtml(subject)}</strong>` +
    `<a href="${imageSrc}">⠀</a>\n\n` +
    `${parseStringToHtml(comment)}\n\n` +
    `${baseUrl}/b/res/${num}.html`;
  return post;
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
