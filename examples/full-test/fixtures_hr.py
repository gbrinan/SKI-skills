#!/usr/bin/env python3
import re, sys
from pathlib import Path
CONTRACT = """# 서류전형 팀 통합 계약 (팀 확정 반영)

```contract
tables:
  요건대조표.xlsx: 후보, 판정, 근거
  적합성소견.docx: 후보, 소견, 등급

writers:
  요건대조표.xlsx: 지원서요건스크리너
  적합성소견.docx: 직무적합성소견초안기

chain: 지원서요건스크리너 -> 직무적합성소견초안기 -> 합불통보초안기

payloads: 지원서묶음, 요건대조결과, 적합성소견, 통보초안

threshold: 실행 시 지정(커스텀 — 우대사항 K개)
halt_at: 합불통보초안기
```
"""
SPEC = {
    "지원서요건스크리너": ("지원서묶음", "요건대조결과", "", "요건대조표.xlsx", "직무적합성소견초안기"),
    "직무적합성소견초안기": ("요건대조결과", "적합성소견", "요건대조표.xlsx", "적합성소견.docx", "합불통보초안기"),
    "합불통보초안기": ("적합성소견", "통보초안", "적합성소견.docx", "", "null"),
}
PLAN_DATA = """## 3. 데이터 명세
| 표 이름 | 칸 이름 | 원본 위치(SSOT) | 읽기/쓰기 |
|---|---|---|---|
| 요건대조표.xlsx | 후보, 판정, 근거 | 공용드라이브/채용/data | 쓰기 |
| 적합성소견.docx | 후보, 소견, 등급 | 공용드라이브/채용/data | 쓰기 |"""
PLAN_SCENARIO = """## 4. 대표 시나리오
- 트리거: 공고 마감, 지원서 폴더를 지정
- 입력: 지원서묶음 → 처리: 요건 대조·소견·통보 초안 → 출력: 요건대조결과 · 적합성소견 · 통보초안
- 파이프라인: 지원서요건스크리너 → 직무적합성소견초안기 → 합불통보초안기

## 7. 검증·휴먼인더루프 지점
- 통보초안은 확인 요청으로 끝난다 — 발송은 사람이 확정한다
- 애매 판정 건은 현업 부서장 의견 후 사람이 결정한다"""
HALT = """
## 사람이 확인하고 멈추는 지점
- 통보초안 전달 — 여기서 확인을 요청하고 멈춘다. 자동 발송하지 않는다. 발송은 사람이 확정한다.
"""
def main(pack_dir):
    pack = Path(pack_dir)
    (pack / "CONTRACT.md").write_text(CONTRACT, encoding="utf-8")
    for p in pack.glob("skills/*/*/[sS][kK][iI][lL][lL].md"):
        t = p.read_text(encoding="utf-8")
        old = re.search(r"name: (.+)", t).group(1).strip()
        new = old.replace(" ", "")
        if new not in SPEC:
            print(f"계약에 없는 스킬: {new}"); return 1
        i, o, r, w, nx = SPEC[new]
        t = t.replace(f"name: {old}", f"name: {new}")
        t = re.sub(r"inputs: \[.*?\]", f"inputs: [{i}]", t)
        t = re.sub(r"outputs: \[.*?\]", f"outputs: [{o}]", t)
        t = t.replace("reads: []", f"reads: [{r}]").replace("writes: []", f"writes: [{w}]")
        t = t.replace("next: (미정)", f"next: {nx}")
        if new == "합불통보초안기" and "멈춘다" not in t: t += HALT
        p.write_text(t, encoding="utf-8")
    plan = pack / "agent-plan.md"; t = plan.read_text(encoding="utf-8")
    t = re.sub(r"## 3\. 데이터 명세.*?\| \(미정\) \| \(미정\) \| \(미정\) \| \(미정\) \|", PLAN_DATA, t, flags=re.S)
    t = re.sub(r"## 4\. 대표 시나리오\n- \(미정\).*", PLAN_SCENARIO, t, flags=re.S)
    plan.write_text(t, encoding="utf-8"); print("HR 팀 확정 반영 완료"); return 0
if __name__ == "__main__": sys.exit(main(sys.argv[1]))
