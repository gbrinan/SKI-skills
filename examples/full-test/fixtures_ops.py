#!/usr/bin/env python3
import re, sys
from pathlib import Path
CONTRACT = """# 재고 점검 팀 통합 계약 (팀 확정 반영)

```contract
tables:
  대사결과표.xlsx: 품목, 현황수량, 장부수량, 차이
  이상재고목록.xlsx: 품목, 유형, 근거수치, 처리후보

writers:
  대사결과표.xlsx: 재고대사체커
  이상재고목록.xlsx: 이상재고플래거

chain: 재고대사체커 -> 이상재고플래거 -> 재고브리핑작성기

payloads: 재고현황, 대사결과, 이상재고, 점검브리핑

threshold: 실행 시 지정(커스텀 — 과잉률·경과일)
halt_at: 재고브리핑작성기
```
"""
SPEC = {
    "재고대사체커": ("재고현황", "대사결과", "", "대사결과표.xlsx", "이상재고플래거"),
    "이상재고플래거": ("대사결과", "이상재고", "대사결과표.xlsx", "이상재고목록.xlsx", "재고브리핑작성기"),
    "재고브리핑작성기": ("이상재고", "점검브리핑", "이상재고목록.xlsx", "", "null"),
}
PLAN_DATA = """## 3. 데이터 명세
| 표 이름 | 칸 이름 | 원본 위치(SSOT) | 읽기/쓰기 |
|---|---|---|---|
| 대사결과표.xlsx | 품목, 현황수량, 장부수량, 차이 | 공용드라이브/운영/data | 쓰기 |
| 이상재고목록.xlsx | 품목, 유형, 근거수치, 처리후보 | 공용드라이브/운영/data | 쓰기 |"""
PLAN_SCENARIO = """## 4. 대표 시나리오
- 트리거: 월말 재고 점검, 재고 현황 폴더를 지정
- 입력: 재고현황 → 처리: 대사·이상 식별·브리핑 → 출력: 대사결과 · 이상재고 · 점검브리핑
- 파이프라인: 재고대사체커 → 이상재고플래거 → 재고브리핑작성기

## 7. 검증·휴먼인더루프 지점
- 점검브리핑은 확인 요청으로 끝난다 — 처리 방안(폐기·이관·발주) 결정은 사람이 한다
- 판정 기준(과잉률·경과일)은 실행 시 지정하는 커스텀 값"""
HALT = """
## 사람이 확인하고 멈추는 지점
- 점검브리핑 전달 — 여기서 확인을 요청하고 멈춘다. 자동 처리·자동 발주하지 않는다. 처리 방안은 사람이 결정한다.
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
        if new == "재고브리핑작성기" and "멈춘다" not in t: t += HALT
        p.write_text(t, encoding="utf-8")
    plan = pack / "agent-plan.md"; t = plan.read_text(encoding="utf-8")
    t = re.sub(r"## 3\. 데이터 명세.*?\| \(미정\) \| \(미정\) \| \(미정\) \| \(미정\) \|", PLAN_DATA, t, flags=re.S)
    t = re.sub(r"## 4\. 대표 시나리오\n- \(미정\).*", PLAN_SCENARIO, t, flags=re.S)
    plan.write_text(t, encoding="utf-8"); print("운영혁신 팀 확정 반영 완료"); return 0
if __name__ == "__main__": sys.exit(main(sys.argv[1]))
