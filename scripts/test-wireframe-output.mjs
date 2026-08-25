import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const fixture = new URL("../examples/wireframe-ui/strategy-briefing-final.md", import.meta.url);
const validator = new URL("./validate-wireframe-output.mjs", import.meta.url);
const renderer = new URL("./render-wireframe-output.mjs", import.meta.url);
const source = await readFile(fixture, "utf8");
const run = (path) => spawnSync(process.execPath, [fileURLToPath(validator), path], { encoding: "utf8" });

// Given: a complete LV5 output with three recommendations.
// When: the artifact crosses the validator boundary.
// Then: the machine contract accepts it.
const validPath = join(tmpdir(), `wireframe-valid-${process.pid}.md`);
await writeFile(validPath, source, "utf8");
assert.equal(run(validPath).status, 0);

// Given: one hint is removed while three WFDATA blocks remain.
// When: the artifact crosses the validator boundary.
// Then: the recommendation handoff count mismatch is rejected.
const hintMatch = source.match(/<!--SKILLHINT[\s\S]*?-->/u);
assert.ok(hintMatch);
const countPath = join(tmpdir(), `wireframe-count-${process.pid}.md`);
await writeFile(countPath, source.replace(hintMatch[0], ""), "utf8");
assert.notEqual(run(countPath).status, 0);

// Given: a hint points at a node outside every recommended WFDATA graph.
// When: the artifact crosses the validator boundary.
// Then: the orphan template hint is rejected.
const nodePath = join(tmpdir(), `wireframe-node-${process.pid}.md`);
await writeFile(nodePath, source.replace('"nodes":["N2","N3"]', '"nodes":["N2","N99"]'), "utf8");
assert.notEqual(run(nodePath).status, 0);

// Given: a coach output claims an execution environment is already active.
// When: the artifact crosses the validator boundary.
// Then: participant ownership is preserved by rejecting e other than hm.
const executionPath = join(tmpdir(), `wireframe-execution-${process.pid}.md`);
await writeFile(executionPath, source.replace('"e":"hm","sug":"rd"', '"e":"rd","sug":"rd"'), "utf8");
assert.notEqual(run(executionPath).status, 0);

// Given: the final LV5 state keeps only one recommended skill.
// When: the artifact crosses the validator boundary.
// Then: the required 2-3 skill range is rejected.
const rangePath = join(tmpdir(), `wireframe-range-${process.pid}.md`);
await writeFile(rangePath, source.replace(/추천스킬:.*$/mu, "추천스킬: 1.시장 자료 정규화기"), "utf8");
assert.notEqual(run(rangePath).status, 0);

// Given: the recommendation blocks remain but the LV5-wide map is removed.
// When: the artifact crosses the validator boundary.
// Then: a collection of isolated skill fragments is rejected.
const mapMatch = source.match(/<!--LV5MAP[\s\S]*?-->/u);
assert.ok(mapMatch);
const mapPath = join(tmpdir(), `wireframe-map-${process.pid}.md`);
await writeFile(mapPath, source.replace(mapMatch[0], ""), "utf8");
assert.notEqual(run(mapPath).status, 0);

// Given: a validated LV5-wide artifact.
// When: the self-contained visual renderer runs.
// Then: it emits four pages and one card per recommendation without external assets.
const htmlPath = join(tmpdir(), `wireframe-${process.pid}.html`);
const render = spawnSync(process.execPath, [fileURLToPath(renderer), validPath, htmlPath], { encoding: "utf8" });
assert.equal(render.status, 0);
const html = await readFile(htmlPath, "utf8");
assert.equal([...html.matchAll(/data-page=/gu)].length, 4);
assert.equal([...html.matchAll(/data-skill-card=/gu)].length, 3);
assert.equal([...html.matchAll(/data-edge=/gu)].length, 10);
assert.equal([...html.matchAll(/role="tabpanel"/gu)].length, 4);
assert.equal(/https?:\/\//u.test(html), false);

console.log("테스트 통과: 와이어프레임 계약 7개");
