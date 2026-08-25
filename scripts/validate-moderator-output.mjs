#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { validateAtfData, validateModeratorData } from './moderator-schema.mjs';

const [, , htmlArg] = process.argv;
if (!htmlArg) {
  console.error('사용법: node scripts/validate-moderator-output.mjs <output.html>');
  process.exit(2);
}

const html = await readFile(resolve(process.cwd(), htmlArg), 'utf8');
const errors = [];
const moderatorBlocks = jsonBlocks(html, 'moderator-data');
if (moderatorBlocks.length !== 1) errors.push(`moderator-data 블록은 정확히 1개여야 합니다: ${moderatorBlocks.length}개`);
if (moderatorBlocks.length === 1 && moderatorBlocks[0].type !== 'application/json') errors.push('moderator-data type은 application/json이어야 합니다.');
const moderatorBlock = moderatorBlocks[0];

let data;
if (moderatorBlock) {
  try {
    data = JSON.parse(moderatorBlock.content);
    validateModeratorData(data);
  } catch (error) {
    errors.push(`moderator-data JSON 오류: ${error.message}`);
    data = undefined;
  }
}

const requiredPages = ['intro', 'overview', 'lv4', 'lv5', 'lv6', 'final'];
for (const page of requiredPages) {
  if (!html.includes(`data-page-panel="${page}"`)) errors.push(`필수 페이지 누락: ${page}`);
  if (!html.includes(`id="page-${page}"`)) errors.push(`필수 페이지 패널 ID 누락: page-${page}`);
  if (!html.includes(`id="tab-${page}"`)) errors.push(`필수 페이지 탭 ID 누락: tab-${page}`);
  if (!html.includes(`aria-controls="page-${page}"`)) errors.push(`탭-패널 연결 누락: ${page}`);
  if (!html.includes(`aria-labelledby="tab-${page}"`)) errors.push(`패널-탭 연결 누락: ${page}`);
}

if (data) {
  const lv5Ids = new Set();
  const lv6Ids = new Set();
  for (const lv4 of data.lv4s) {
    for (const lv5 of lv4.lv5s) {
      if (lv5Ids.has(lv5.id)) errors.push(`중복 LV5 ID: ${lv5.id}`);
      lv5Ids.add(lv5.id);
      const machineScope = lv5.lv6s.filter(task => ['ai', 'assisted'].includes(task.role)).length;
      if (lv5.eligible && machineScope < 2) errors.push(`${lv5.id}: AI 처리·보조가 2개 미만인데 후보로 표시되었습니다.`);
      if (lv5.lv6s.length < 3 && lv5.eligible) errors.push(`${lv5.id}: 세부 업무가 3개 미만인데 후보로 표시되었습니다.`);
      for (const lv6 of lv5.lv6s) {
        if (lv6Ids.has(lv6.id)) errors.push(`중복 LV6 ID: ${lv6.id}`);
        lv6Ids.add(lv6.id);
      }
    }
  }
  const atfBlocks = jsonBlocks(html, 'atf-data');
  if (atfBlocks.length > 1) errors.push(`atf-data 블록은 최대 1개여야 합니다: ${atfBlocks.length}개`);
  if (atfBlocks.length === 1 && atfBlocks[0].type !== 'application/json') errors.push('atf-data type은 application/json이어야 합니다.');
  const atfBlock = atfBlocks[0];
  if (data.selection.finalized && !atfBlock) errors.push('판정 완료 HTML에 atf-data가 없습니다.');
  if (!data.selection.finalized && atfBlock) errors.push('판정 전 HTML에 atf-data가 있습니다.');
  if (atfBlock) {
    try {
      const atf = JSON.parse(atfBlock.content);
      validateAtfData(atf);
      if (!isDeepStrictEqual(atf, data.atfData)) errors.push('atf-data와 moderator-data의 ATF 값이 다릅니다.');
    } catch (error) { errors.push(`atf-data JSON 오류: ${error.message}`); }
  }
}

const visible = html
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ');
const forbidden = [
  [/\bPP\b/i, 'PP'], [/\bHITL\b/i, 'HITL'], [/\bAX\b/i, 'AX'],
  [/\bSTEP\b/i, 'STEP'], [/\bLEVEL\b/i, 'LEVEL'], [/\bGate\b(?!\s*\()/i, 'Gate'], [/\bLoopback\b(?!\s*\()/i, 'Loopback'],
];
for (const [pattern, label] of forbidden) {
  if (pattern.test(visible)) errors.push(`화면에 설명 없는 약어·개념이 있습니다: ${label}`);
}
if (data) {
  const visibleData = [
    data.meta?.team,
    ...(data.meta?.inputs ?? []),
    ...(data.glossary ?? []).flatMap(item => [item.term, item.meaning]),
    ...(data.lv4s ?? []).flatMap(lv4 => [
      lv4.name, lv4.lv3, lv4.frequency,
      ...(lv4.lv5s ?? []).flatMap(lv5 => [
        lv5.name, lv5.evidence, lv5.painPoints?.severity,
        ...(lv5.lv6s ?? []).flatMap(lv6 => [lv6.name, lv6.reason]),
      ]),
    ]),
    data.selection?.condition,
  ].filter(Boolean).join(' ');
  for (const [pattern, label] of forbidden) {
    if (pattern.test(visibleData)) errors.push(`화면 데이터에 설명 없는 약어·개념이 있습니다: ${label}`);
  }
}

if (!html.includes('Pain Point')) errors.push('Pain Point의 쉬운 설명이 없습니다.');
if (!html.includes('Human in the Loop')) errors.push('Human in the Loop의 쉬운 설명이 없습니다.');
if (!html.includes('사람이 준비') || !html.includes('사람이 최종 책임')) errors.push('사람 업무 시작·정지 경계가 없습니다.');
if (!html.includes('data-page="lv4"') || !html.includes('data-pager')) errors.push('단계·내부 페이지 탐색 계약이 없습니다.');

if (errors.length) {
  console.error(`검증 실패 (${errors.length}건)`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}
console.log(`검증 통과: 6개 페이지, LV4 ${data.lv4s.length}개, LV5 ${[...new Set(data.lv4s.flatMap(item => item.lv5s.map(lv5 => lv5.id)))].length}개, LV6 ${[...new Set(data.lv4s.flatMap(item => item.lv5s.flatMap(lv5 => lv5.lv6s.map(lv6 => lv6.id))))].length}개`);

function attributeValue(attributes, name) {
  const pattern = new RegExp(`(?:^|[\\s/])${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, 'i');
  const match = attributes.match(pattern);
  const value = match ? (match[1] ?? match[2] ?? match[3]) : undefined;
  return value?.replace(/&#(?:x([0-9a-f]+)|([0-9]+));?/gi, (_, hex, decimal) => (
    String.fromCodePoint(Number.parseInt(hex ?? decimal, hex ? 16 : 10))
  ));
}

function tagEnd(source, start) {
  let quote;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (quote) {
      if (character === quote) quote = undefined;
    } else if (character === '"' || character === "'") {
      quote = character;
    } else if (character === '>') {
      return index;
    }
  }
  throw new Error('script 태그가 닫히지 않았습니다.');
}

function jsonBlocks(source, id) {
  const blocks = [];
  const lower = source.toLowerCase();
  let cursor = 0;
  while (cursor < source.length) {
    const start = lower.indexOf('<script', cursor);
    if (start === -1) break;
    const boundary = lower[start + 7];
    if (boundary && !/[\s/>]/.test(boundary)) {
      cursor = start + 7;
      continue;
    }
    const openEnd = tagEnd(source, start + 7);
    let closeStart = lower.indexOf('</script', openEnd + 1);
    while (closeStart !== -1) {
      const closeBoundary = lower[closeStart + 8];
      if (!closeBoundary || /[\s>]/.test(closeBoundary)) break;
      closeStart = lower.indexOf('</script', closeStart + 8);
    }
    if (closeStart === -1) throw new Error('script 닫는 태그가 없습니다.');
    const closeEnd = tagEnd(source, closeStart + 8);
    const attributes = source.slice(start + 7, openEnd);
    if (attributeValue(attributes, 'id') === id) {
      blocks.push({
        content: source.slice(openEnd + 1, closeStart),
        type: attributeValue(attributes, 'type'),
      });
    }
    cursor = closeEnd + 1;
  }
  return blocks;
}
