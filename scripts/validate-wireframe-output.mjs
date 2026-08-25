import { readFile } from "node:fs/promises";

const [path] = process.argv.slice(2);
if (!path) throw new Error("사용법: node scripts/validate-wireframe-output.mjs <output.md>");

const text = await readFile(path, "utf8");
const parseBlocks = (label) => [...text.matchAll(new RegExp(`<!--${label}\\s*([\\s\\S]*?)-->`, "gu"))]
  .map((match) => JSON.parse(match[1]));
const maps = parseBlocks("LV5MAP");
const hints = parseBlocks("SKILLHINT");
const workflows = parseBlocks("WFDATA");

const fail = (message) => { throw new Error(message); };
const nonempty = (value, label) => {
  if (typeof value !== "string" || value.trim() === "") fail(`${label}: 비어 있지 않은 문자열이어야 합니다.`);
};
const stringList = (value, label, allowEmpty = false) => {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) fail(`${label}: 문자열 배열이어야 합니다.`);
  value.forEach((item, index) => nonempty(item, `${label}[${index}]`));
};

if (maps.length !== 1) fail("LV5MAP은 정확히 1개여야 합니다.");
if (hints.length < 2 || hints.length > 3) fail("SKILLHINT는 2~3개여야 합니다.");
if (workflows.length !== hints.length) fail("SKILLHINT와 WFDATA 수가 같아야 합니다.");

const map = maps[0];
nonempty(map.lv5, "LV5MAP.lv5");
if (!Array.isArray(map.nodes) || map.nodes.length < 4 || !Array.isArray(map.edges)) fail("LV5MAP에는 본선 노드 4개 이상과 edges 배열이 필요합니다.");
const mapNodeIds = new Set();
const mapHintIds = new Set();
const environments = new Set(["rd", "wr", "cdx", "api", "hm"]);
map.nodes.forEach((node, index) => {
  nonempty(node.id, `LV5MAP.nodes[${index}].id`);
  nonempty(node.name, `LV5MAP.nodes[${index}].name`);
  nonempty(node.lv6, `LV5MAP.nodes[${index}].lv6`);
  if (mapNodeIds.has(node.id)) fail(`LV5MAP 노드 ${node.id}가 중복됩니다.`);
  if (!environments.has(node.environment)) fail(`LV5MAP.nodes[${index}].environment 오류`);
  if (node.skillHintId !== null) {
    nonempty(node.skillHintId, `LV5MAP.nodes[${index}].skillHintId`);
    mapHintIds.add(node.skillHintId);
  }
  mapNodeIds.add(node.id);
});
map.edges.forEach((edge, index) => {
  if (!mapNodeIds.has(edge.from) || !mapNodeIds.has(edge.to)) fail(`LV5MAP.edges[${index}]가 없는 노드를 가리킵니다.`);
  if (typeof edge.exception !== "boolean") fail(`LV5MAP.edges[${index}].exception은 불리언이어야 합니다.`);
});
if (map.nodes[0].environment !== "hm" || map.nodes.at(-1).environment !== "hm") fail("LV5MAP의 시작과 끝은 사람 경계여야 합니다.");

const assignedNodes = new Set();

hints.forEach((hint, index) => {
  const workflow = workflows[index];
  nonempty(hint.id, `SKILLHINT ${index + 1}.id`);
  nonempty(hint.name, `SKILLHINT ${index + 1}.name`);
  nonempty(hint.descriptionHint, `SKILLHINT ${index + 1}.descriptionHint`);
  stringList(hint.nodes, `SKILLHINT ${index + 1}.nodes`);
  stringList(hint.inputs, `SKILLHINT ${index + 1}.inputs`);
  stringList(hint.outputs, `SKILLHINT ${index + 1}.outputs`);
  stringList(hint.workflow, `SKILLHINT ${index + 1}.workflow`);
  stringList(hint.rules, `SKILLHINT ${index + 1}.rules`);
  stringList(hint.exceptions, `SKILLHINT ${index + 1}.exceptions`);
  stringList(hint.humanInTheLoop, `SKILLHINT ${index + 1}.humanInTheLoop`);
  stringList(hint.openQuestions, `SKILLHINT ${index + 1}.openQuestions`, true);
  if (!Array.isArray(hint.testExamples) || hint.testExamples.length === 0) fail(`SKILLHINT ${index + 1}.testExamples가 필요합니다.`);
  hint.testExamples.forEach((example, exampleIndex) => {
    if (typeof example !== "object" || example === null) fail(`SKILLHINT ${index + 1}.testExamples[${exampleIndex}] 형식 오류`);
    nonempty(example.given, `SKILLHINT ${index + 1}.testExamples[${exampleIndex}].given`);
    nonempty(example.then, `SKILLHINT ${index + 1}.testExamples[${exampleIndex}].then`);
  });

  ["id", "owner", "lv4", "lv5", "lv6", "skill"].forEach((field) => nonempty(workflow[field], `WFDATA ${index + 1}.${field}`));
  if (workflow.skill !== hint.name) fail(`추천 ${index + 1}: SKILLHINT와 WFDATA 스킬명이 다릅니다.`);
  if (!Array.isArray(workflow.N) || workflow.N.length === 0 || !Array.isArray(workflow.E)) fail(`WFDATA ${index + 1}: N/E 배열 오류`);

  const numbers = new Set();
  workflow.N.forEach((node, nodeIndex) => {
    if (!Number.isInteger(node.no) || node.no < 1 || numbers.has(node.no)) fail(`WFDATA ${index + 1}.N[${nodeIndex}].no 오류`);
    numbers.add(node.no);
    nonempty(node.n, `WFDATA ${index + 1}.N[${nodeIndex}].n`);
    if (!Number.isInteger(node.col) || node.col < 1) fail(`WFDATA ${index + 1}.N[${nodeIndex}].col 오류`);
    if (!new Set(["main", "feed", "fork"]).has(node.band)) fail(`WFDATA ${index + 1}.N[${nodeIndex}].band 오류`);
    if (node.e !== "hm") fail(`WFDATA ${index + 1}.N[${nodeIndex}].e는 hm이어야 합니다.`);
    if (!environments.has(node.sug)) fail(`WFDATA ${index + 1}.N[${nodeIndex}].sug 오류`);
    if (node.gate !== 0 && node.gate !== 1) fail(`WFDATA ${index + 1}.N[${nodeIndex}].gate 오류`);
    nonempty(node.rule, `WFDATA ${index + 1}.N[${nodeIndex}].rule`);
    nonempty(node.exc, `WFDATA ${index + 1}.N[${nodeIndex}].exc`);
  });
  workflow.E.forEach((edge, edgeIndex) => {
    if ((edge.a !== 0 && !numbers.has(edge.a)) || !numbers.has(edge.b)) fail(`WFDATA ${index + 1}.E[${edgeIndex}]가 없는 노드를 가리킵니다.`);
    if (edge.dot !== 0 && edge.dot !== 1) fail(`WFDATA ${index + 1}.E[${edgeIndex}].dot 오류`);
  });

  if (hint.nodes.length !== workflow.N.length) fail(`추천 ${index + 1}: 힌트 노드와 WFDATA 노드 수가 다릅니다.`);
  hint.nodes.forEach((node, nodeIndex) => {
    const mapNode = map.nodes.find((candidate) => candidate.id === node);
    if (!mapNode || mapNode.skillHintId !== hint.id) fail(`추천 ${index + 1}: ${node}의 LV5MAP 연결이 다릅니다.`);
    if (workflow.N[nodeIndex].n !== mapNode.name) fail(`추천 ${index + 1}: ${node}와 WFDATA 노드 이름·순서가 다릅니다.`);
    if (assignedNodes.has(node)) fail(`추천 스킬 간 노드 ${node}가 중복됩니다.`);
    assignedNodes.add(node);
  });
});

const hintIds = new Set(hints.map((hint) => hint.id));
if (mapHintIds.size !== hintIds.size || [...mapHintIds].some((id) => !hintIds.has(id))) fail("LV5MAP의 skillHintId가 SKILLHINT 목록과 다릅니다.");

const stateMatch = text.match(/^추천스킬:\s*(.+)$/mu);
if (!stateMatch) fail("@@STATE@@ 추천스킬 필드가 필요합니다.");
const stateNames = [...stateMatch[1].matchAll(/(?:^|\s)([1-3])\.([^()]+)\(/gu)].map((match) => match[2].trim());
if (stateNames.length !== hints.length) fail("상태 블록의 추천 스킬 수가 SKILLHINT와 다릅니다.");
if (stateNames.some((name, index) => name !== hints[index].name)) fail("상태 블록의 추천 스킬 순서·이름이 SKILLHINT와 다릅니다.");
if (!text.includes("@@STATE@@") || !text.includes("@@END@@")) fail("상태 블록 경계가 필요합니다.");

console.log(`검증 통과: 추천 스킬 ${hints.length}개, 템플릿 힌트 ${hints.length}개, WFDATA 노드 ${assignedNodes.size}개`);
