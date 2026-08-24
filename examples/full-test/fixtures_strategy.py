#!/usr/bin/env python3
import re, sys
from pathlib import Path
CONTRACT = """# 동향 브리핑 팀 통합 계약 (팀 확정 반영)

```contract
tables:
  뉴스목록.xlsx: 제목, 출처, 일자, 관련사업
  선별요약.docx: 항목, 요약문, 시사점

writers:
  뉴스목록.xlsx: 뉴스수집정리기
  선별요약.docx: 중요도선별요약기

chain: 뉴스수집정리기 -> 중요도선별요약기 -> 주간브리핑편성기

payloads: 구독메일, 뉴스목록, 선별요약, 브리핑초안

threshold: 실행 시 지정(커스텀 — 최소 건수 M)
halt_at: 주간브리핑편성기
```
"""
SPEC = {
    "뉴스수집정리기": ("구독메일", "뉴스목록", "", "뉴스목록.xlsx", "중요도선별요약기"),
    "중요도선별요약기": ("뉴스목록", "선별요약", "뉴스목록.xlsx", "선별요약.docx", "주간브리핑편성기"),
    "주간브리핑편성기": ("선별요약", "브리핑초안", "선별요약.docx", "", "null"),
}
PLAN_DATA = """## 3. 데이터 명세
| 표 이름 | 칸 이름 | 원본 위치(SSOT) | 읽기/쓰기 |
|---|---|---|---|
| 뉴스목록.xlsx | 제목, 출처, 일자, 관련사업 | 공용드라이브/전략/data | 쓰기 |
| 선별요약.docx | 항목, 요약문, 시사점 | 공용드라이브/전략/data | 쓰기 |"""
PLAN_SCENARIO = """## 4. 대표 시나리오
- 트리거: 매주 월요일 아침, 구독메일 수신 폴더를 지정
- 입력: 구독메일 → 처리: 정규화·선별 요약·편성 → 출력: 뉴스목록 · 선별요약 · 브리핑초안
- 파이프라인: 뉴스수집정리기 → 중요도선별요약기 → 주간브리핑편성기

## 7. 검증·휴먼인더루프 지점
- 브리핑초안은 확인 요청으로 끝난다 — 발행은 사람이 확정한다
- 중요도 판정 애매 건은 올려서 사람이 거른다"""
HALT = """
## 사람이 확인하고 멈추는 지점
- 브리핑초안 전달 — 여기서 확인을 요청하고 멈춘다. 자동 발행·자동 발송하지 않는다. 발행은 사람이 확정한다.
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
        if new == "주간브리핑편성기" and "멈춘다" not in t: t += HALT
        p.write_text(t, encoding="utf-8")
    plan = pack / "agent-plan.md"; t = plan.read_text(encoding="utf-8")
    t = re.sub(r"## 3\. 데이터 명세.*?\| \(미정\) \| \(미정\) \| \(미정\) \| \(미정\) \|", PLAN_DATA, t, flags=re.S)
    t = re.sub(r"## 4\. 대표 시나리오\n- \(미정\).*", PLAN_SCENARIO, t, flags=re.S)
    plan.write_text(t, encoding="utf-8"); print("전략 팀 확정 반영 완료"); return 0
if __name__ == "__main__": sys.exit(main(sys.argv[1]))
