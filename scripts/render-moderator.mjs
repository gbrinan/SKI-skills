#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [, , inputArg, outputArg] = process.argv;
if (!inputArg || !outputArg) {
  console.error('사용법: node scripts/render-moderator.mjs <data.json> <output.html>');
  process.exit(2);
}

const root = resolve(import.meta.dirname, '..');
const templatePath = resolve(root, 'assets/moderator-selection-tree-template.html');
const inputPath = resolve(process.cwd(), inputArg);
const outputPath = resolve(process.cwd(), outputArg);

const [template, rawData] = await Promise.all([
  readFile(templatePath, 'utf8'),
  readFile(inputPath, 'utf8'),
]);
const data = JSON.parse(rawData);
validateData(data);
const safeJson = JSON.stringify(data).replaceAll('<', '\\u003c');
const atf = data.selection?.finalized
  ? `<script id="atf-data" type="application/json">${JSON.stringify(data.atfData).replaceAll('<', '\\u003c')}</script>`
  : '';

if (data.selection?.finalized && !data.atfData) {
  throw new Error('판정 완료 데이터에는 atfData가 필요합니다.');
}
if (!data.selection?.finalized && data.atfData) {
  throw new Error('판정 전 데이터에는 atfData를 넣을 수 없습니다.');
}

const output = template
  .replace('__MODERATOR_DATA__', safeJson)
  .replace('__ATF_DATA__', atf);
await writeFile(outputPath, output, 'utf8');
console.log(`생성 완료: ${outputPath}`);

function validateData(value) {
  const fail = message => { throw new Error(`입력 데이터 오류: ${message}`); };
  const object = (item, path) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) fail(`${path}는 객체여야 합니다.`);
  };
  const string = (item, path) => {
    if (typeof item !== 'string' || item.trim() === '') fail(`${path}는 비어 있지 않은 문자열이어야 합니다.`);
  };
  const list = (item, path) => {
    if (!Array.isArray(item)) fail(`${path}는 배열이어야 합니다.`);
  };
  const count = (item, path) => {
    if (!Number.isInteger(item) || item < 0) fail(`${path}는 0 이상의 정수여야 합니다.`);
  };
  const oneOf = (item, values, path) => {
    if (!values.includes(item)) fail(`${path} 값이 허용 목록에 없습니다.`);
  };

  object(value, 'root');
  object(value.meta, 'meta');
  string(value.meta.team, 'meta.team');
  string(value.meta.generatedAt, 'meta.generatedAt');
  list(value.meta.inputs, 'meta.inputs');
  value.meta.inputs.forEach((item, index) => string(item, `meta.inputs[${index}]`));
  list(value.glossary, 'glossary');
  value.glossary.forEach((item, index) => {
    object(item, `glossary[${index}]`);
    string(item.term, `glossary[${index}].term`);
    string(item.meaning, `glossary[${index}].meaning`);
  });
  list(value.lv4s, 'lv4s');
  if (value.lv4s.length === 0) fail('lv4s는 한 개 이상이어야 합니다.');
  value.lv4s.forEach((lv4, lv4Index) => {
    const base = `lv4s[${lv4Index}]`;
    object(lv4, base);
    ['id', 'name', 'lv3', 'frequency'].forEach(key => string(lv4[key], `${base}.${key}`));
    list(lv4.lv5s, `${base}.lv5s`);
    lv4.lv5s.forEach((lv5, lv5Index) => {
      const lv5Path = `${base}.lv5s[${lv5Index}]`;
      object(lv5, lv5Path);
      ['id', 'name', 'evidence'].forEach(key => string(lv5[key], `${lv5Path}.${key}`));
      if (typeof lv5.eligible !== 'boolean') fail(`${lv5Path}.eligible은 불리언이어야 합니다.`);
      oneOf(lv5.status, ['green', 'yellow', 'red', 'excluded'], `${lv5Path}.status`);
      object(lv5.painPoints, `${lv5Path}.painPoints`);
      count(lv5.painPoints.count, `${lv5Path}.painPoints.count`);
      string(lv5.painPoints.severity, `${lv5Path}.painPoints.severity`);
      count(lv5.aiRecommendationCount, `${lv5Path}.aiRecommendationCount`);
      object(lv5.signals, `${lv5Path}.signals`);
      Object.entries(lv5.signals).forEach(([key, signal]) => oneOf(signal, ['met', 'unmet', 'unknown'], `${lv5Path}.signals.${key}`));
      list(lv5.lv6s, `${lv5Path}.lv6s`);
      lv5.lv6s.forEach((lv6, lv6Index) => {
        const lv6Path = `${lv5Path}.lv6s[${lv6Index}]`;
        object(lv6, lv6Path);
        ['id', 'name', 'reason'].forEach(key => string(lv6[key], `${lv6Path}.${key}`));
        oneOf(lv6.role, ['ai', 'assisted', 'human_input', 'integration', 'human_final'], `${lv6Path}.role`);
      });
    });
  });
  object(value.selection, 'selection');
  if (typeof value.selection.finalized !== 'boolean') fail('selection.finalized는 불리언이어야 합니다.');
  if (value.selection.finalized) {
    string(value.selection.selectedLv5Id, 'selection.selectedLv5Id');
    oneOf(value.selection.verdict, ['권장', '조건부 권장', '대안 권장'], 'selection.verdict');
    string(value.selection.condition, 'selection.condition');
    object(value.atfData, 'atfData');
    oneOf(value.atfData.verdict, ['권장', '조건부 권장', '대안 권장'], 'atfData.verdict');
    string(value.atfData.process, 'atfData.process');
    object(value.atfData.targetTask, 'atfData.targetTask');
    count(value.atfData.targetTask.no, 'atfData.targetTask.no');
    string(value.atfData.targetTask.name, 'atfData.targetTask.name');
    list(value.atfData.engines, 'atfData.engines');
    if (value.atfData.engines.length === 0) fail('atfData.engines는 한 개 이상이어야 합니다.');
    value.atfData.engines.forEach((engine, index) => {
      const path = `atfData.engines[${index}]`;
      object(engine, path);
      count(engine.no, `${path}.no`);
      string(engine.name, `${path}.name`);
      oneOf(engine.human, ['자동', '증강', '사람고유'], `${path}.human`);
      oneOf(engine.engine, ['자동화', '스킬', '사람'], `${path}.engine`);
    });
    oneOf(value.atfData.wrap, ['개인용', '여러사람_미니앱', '여러사람_공유만'], 'atfData.wrap');
    object(value.atfData.gates, 'atfData.gates');
    for (const gate of ['G1', 'G2', 'G3', 'G4', 'G5', 'G6']) {
      oneOf(value.atfData.gates[gate], ['충족', '미충족', '미확인'], `atfData.gates.${gate}`);
    }
    if (typeof value.atfData.condition !== 'string') fail('atfData.condition은 문자열이어야 합니다.');
    if (typeof value.atfData.alternative !== 'string') fail('atfData.alternative는 문자열이어야 합니다.');
    if (value.atfData.hoursPerWeek !== null && (typeof value.atfData.hoursPerWeek !== 'number' || !Number.isFinite(value.atfData.hoursPerWeek) || value.atfData.hoursPerWeek < 0)) fail('atfData.hoursPerWeek는 0 이상의 수 또는 null이어야 합니다.');
    if (value.atfData.verdict !== value.selection.verdict) fail('selection.verdict와 atfData.verdict가 다릅니다.');
  }
}
