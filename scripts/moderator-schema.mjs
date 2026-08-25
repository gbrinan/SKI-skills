const STATUS_VALUES = ['green', 'yellow', 'red', 'excluded'];
const SIGNAL_VALUES = ['met', 'unmet', 'unknown'];
const ROLE_VALUES = ['ai', 'assisted', 'human_input', 'integration', 'human_final'];
const VERDICT_VALUES = ['권장', '조건부 권장', '대안 권장'];
const HUMAN_VALUES = ['자동', '증강', '사람고유'];
const ENGINE_VALUES = ['자동화', '스킬', '사람'];
const WRAP_VALUES = ['개인용', '여러사람_미니앱', '여러사람_공유만'];
const GATE_VALUES = ['충족', '미충족', '미확인'];
const ROLE_ATF_VALUES = {
  ai: ['자동', '스킬'],
  assisted: ['증강', '스킬'],
  human_input: ['사람고유', '사람'],
  integration: ['증강', '사람'],
  human_final: ['사람고유', '사람'],
};

function fail(message) {
  throw new Error(`입력 데이터 오류: ${message}`);
}

function requireObject(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${path}는 객체여야 합니다.`);
}

function requireString(value, path, allowEmpty = false) {
  if (typeof value !== 'string' || (!allowEmpty && value.trim() === '')) {
    fail(`${path}는 ${allowEmpty ? '문자열' : '비어 있지 않은 문자열'}이어야 합니다.`);
  }
}

function requireList(value, path) {
  if (!Array.isArray(value)) fail(`${path}는 배열이어야 합니다.`);
}

function requireInteger(value, path, minimum = 0) {
  if (!Number.isInteger(value) || value < minimum) fail(`${path}는 ${minimum} 이상의 정수여야 합니다.`);
}

function requireOneOf(value, values, path) {
  if (!values.includes(value)) fail(`${path} 값이 허용 목록에 없습니다.`);
}

export function validateAtfData(value) {
  requireObject(value, 'atfData');
  requireOneOf(value.verdict, VERDICT_VALUES, 'atfData.verdict');
  requireString(value.process, 'atfData.process');
  requireObject(value.targetTask, 'atfData.targetTask');
  requireInteger(value.targetTask.no, 'atfData.targetTask.no', 1);
  requireString(value.targetTask.name, 'atfData.targetTask.name');
  requireList(value.engines, 'atfData.engines');
  if (value.engines.length === 0) fail('atfData.engines는 한 개 이상이어야 합니다.');
  value.engines.forEach((engine, index) => {
    const path = `atfData.engines[${index}]`;
    requireObject(engine, path);
    requireInteger(engine.no, `${path}.no`, 1);
    requireString(engine.name, `${path}.name`);
    requireOneOf(engine.human, HUMAN_VALUES, `${path}.human`);
    requireOneOf(engine.engine, ENGINE_VALUES, `${path}.engine`);
  });
  requireOneOf(value.wrap, WRAP_VALUES, 'atfData.wrap');
  requireObject(value.gates, 'atfData.gates');
  for (const gate of ['G1', 'G2', 'G3', 'G4', 'G5', 'G6']) {
    requireOneOf(value.gates[gate], GATE_VALUES, `atfData.gates.${gate}`);
  }
  requireString(value.condition, 'atfData.condition', true);
  requireString(value.alternative, 'atfData.alternative', true);
  if (value.hoursPerWeek !== null && (
    typeof value.hoursPerWeek !== 'number'
    || !Number.isFinite(value.hoursPerWeek)
    || value.hoursPerWeek < 0
  )) fail('atfData.hoursPerWeek는 0 이상의 수 또는 null이어야 합니다.');
}

export function validateModeratorData(value) {
  requireObject(value, 'root');
  requireObject(value.meta, 'meta');
  requireString(value.meta.team, 'meta.team');
  requireString(value.meta.generatedAt, 'meta.generatedAt');
  requireList(value.meta.inputs, 'meta.inputs');
  value.meta.inputs.forEach((item, index) => requireString(item, `meta.inputs[${index}]`));
  requireList(value.glossary, 'glossary');
  value.glossary.forEach((item, index) => {
    requireObject(item, `glossary[${index}]`);
    requireString(item.term, `glossary[${index}].term`);
    requireString(item.meaning, `glossary[${index}].meaning`);
  });
  requireList(value.lv4s, 'lv4s');
  if (value.lv4s.length === 0) fail('lv4s는 한 개 이상이어야 합니다.');
  const lv5Ids = new Set();
  value.lv4s.forEach((lv4, lv4Index) => {
    const base = `lv4s[${lv4Index}]`;
    requireObject(lv4, base);
    for (const key of ['id', 'name', 'lv3', 'frequency']) requireString(lv4[key], `${base}.${key}`);
    requireList(lv4.lv5s, `${base}.lv5s`);
    lv4.lv5s.forEach((lv5, lv5Index) => {
      const path = `${base}.lv5s[${lv5Index}]`;
      requireObject(lv5, path);
      for (const key of ['id', 'name', 'evidence']) requireString(lv5[key], `${path}.${key}`);
      if (lv5Ids.has(lv5.id)) fail(`중복 LV5 ID: ${lv5.id}`);
      lv5Ids.add(lv5.id);
      if (typeof lv5.eligible !== 'boolean') fail(`${path}.eligible은 불리언이어야 합니다.`);
      requireOneOf(lv5.status, STATUS_VALUES, `${path}.status`);
      requireObject(lv5.painPoints, `${path}.painPoints`);
      requireInteger(lv5.painPoints.count, `${path}.painPoints.count`);
      requireString(lv5.painPoints.severity, `${path}.painPoints.severity`);
      requireInteger(lv5.aiRecommendationCount, `${path}.aiRecommendationCount`);
      if (lv5.candidateOverrideReason !== undefined) {
        requireString(lv5.candidateOverrideReason, `${path}.candidateOverrideReason`);
      }
      requireObject(lv5.signals, `${path}.signals`);
      if (Object.keys(lv5.signals).length === 0) fail(`${path}.signals는 한 개 이상이어야 합니다.`);
      for (const [key, signal] of Object.entries(lv5.signals)) {
        requireOneOf(signal, SIGNAL_VALUES, `${path}.signals.${key}`);
      }
      requireList(lv5.lv6s, `${path}.lv6s`);
      lv5.lv6s.forEach((lv6, lv6Index) => {
        const lv6Path = `${path}.lv6s[${lv6Index}]`;
        requireObject(lv6, lv6Path);
        for (const key of ['id', 'name', 'reason']) requireString(lv6[key], `${lv6Path}.${key}`);
        requireOneOf(lv6.role, ROLE_VALUES, `${lv6Path}.role`);
      });
      const machineScope = lv5.lv6s.filter(task => ['ai', 'assisted'].includes(task.role)).length;
      if (lv5.eligible && lv5.lv6s.length < 3) fail(`${path}: 세부 업무가 3개 미만인데 후보로 표시되었습니다.`);
      if (lv5.eligible && machineScope < 2) fail(`${path}: AI 처리·보조가 2개 미만인데 후보로 표시되었습니다.`);
      if (
        lv5.eligible
        && lv5.painPoints.count === 0
        && lv5.aiRecommendationCount === 0
        && !lv5.candidateOverrideReason
      ) {
        fail(`${path}: Pain Point와 AI 전환 추천이 모두 없는 후보에는 팀 재검토 이유가 필요합니다.`);
      }
    });
  });
  requireObject(value.selection, 'selection');
  if (typeof value.selection.finalized !== 'boolean') fail('selection.finalized는 불리언이어야 합니다.');
  if (!value.selection.finalized) {
    if (value.atfData !== undefined) fail('판정 전 데이터에는 atfData를 넣을 수 없습니다.');
    return;
  }
  requireString(value.selection.selectedLv5Id, 'selection.selectedLv5Id');
  if (!lv5Ids.has(value.selection.selectedLv5Id)) fail('선택한 LV5가 트리에 없습니다.');
  requireOneOf(value.selection.verdict, VERDICT_VALUES, 'selection.verdict');
  requireString(value.selection.condition, 'selection.condition');
  validateAtfData(value.atfData);
  if (value.atfData.verdict !== value.selection.verdict) {
    fail('selection.verdict와 atfData.verdict가 다릅니다.');
  }
  const selected = value.lv4s
    .flatMap(lv4 => lv4.lv5s.map(lv5 => ({ lv4, lv5 })))
    .find(item => item.lv5.id === value.selection.selectedLv5Id);
  const expectedProcess = `${selected.lv4.name} › ${selected.lv5.name}`;
  if (value.atfData.process !== expectedProcess) fail('atfData.process가 선택한 LV4·LV5와 다릅니다.');
  if (value.atfData.targetTask.no !== 1 || value.atfData.targetTask.name !== selected.lv5.name) {
    fail('atfData.targetTask가 선택한 LV5와 다릅니다.');
  }
  if (value.atfData.engines.length !== selected.lv5.lv6s.length) {
    fail('atfData.engines 수가 선택한 LV5의 LV6 수와 다릅니다.');
  }
  selected.lv5.lv6s.forEach((lv6, index) => {
    const engine = value.atfData.engines[index];
    const [human, engineType] = ROLE_ATF_VALUES[lv6.role];
    if (
      engine.no !== index + 1
      || engine.name !== lv6.name
      || engine.human !== human
      || engine.engine !== engineType
    ) fail(`atfData.engines[${index}]가 LV6 순서·역할과 다릅니다.`);
  });
}
