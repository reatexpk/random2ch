import he from 'he';
import { parse, TextNode, HTMLElement } from 'node-html-parser';

import { Thread as ThreadType } from '../typings/server';
import { baseUrl } from '../constants';

export function transformPostOnError(post: string) {
  const parsedPost = he
    .decode(post)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<br>/gi, '\n')
    .replace(/<\/?strong>/gi, '')
    .replace(/<\/?em>/gi, '')
    .replace(/<\/?sup>/gi, '')
    .replace(/<\/?sub>/gi, '')
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

function removeNestedHtmlTags(string: string) {
  const root = parse(`<div>${string}</div>`);

  let result = '';

  root.childNodes[0].childNodes.forEach((node) => {
    if (node instanceof TextNode) {
      result += node.rawText;
    } else if (node instanceof HTMLElement) {
      const { tagName } = node;
      const innerTag = node
        .toString()
        .replace(/<a.+?href="(.+?)".{0,}?>.+?<\/a>/gi, '$1')
        .replace(/<.*?\b[^>]*>([\s\S]*?)<\/.*?>/gi, '$1');
      result += `<${tagName}>${innerTag.replace(
        /(<[^]*?>)|(<\/[^]*?>)/gi,
        '',
      )}</${tagName}>`;
    }
  });

  return result;
}

function parseStringToHtml(text: string) {
  const decodedHtml = he.decode(text);
  const returnString = decodedHtml
    .replace(/<br>/gi, '\n')
    .replace(/<br \/>/gi, '\n')
    .replace(/<\/?sup>/gi, '')
    .replace(/<\/?sub>/gi, '')
    .replace(/<\/?span.*?>/gi, '');
  return removeNestedHtmlTags(returnString);
}

export function createPostTest({ subject, comment, num, files }: ThreadType) {
  const imageSrc =
    files && files.length
      ? `${baseUrl}${files[0].path}`
      : `${baseUrl}/b/res/${num}.html`;
  let parsedComment = parseStringToHtml(comment);
  let post =
    `<strong>${parseStringToHtml(subject)}</strong> ` +
    `<a href="${imageSrc}">⠀</a>\n\n` +
    `${parsedComment}\n\n` +
    `${baseUrl}/b/res/${num}.html`;

  if (post.length > 4096) {
    const symbolsToCut = post.length - 4096;
    parsedComment = parsedComment.slice(
      0,
      parsedComment.length - (symbolsToCut + 1),
    );
    post =
      `<strong>${parseStringToHtml(subject)}</strong> ` +
      `<a href="${imageSrc}">⠀</a>\n\n` +
      `${parsedComment}\n\n` +
      `${baseUrl}/b/res/${num}.html`;
  }
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
