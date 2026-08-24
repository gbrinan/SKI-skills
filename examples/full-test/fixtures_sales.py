#!/usr/bin/env python3
import re, sys
from pathlib import Path
CONTRACT = """# 견적 대응 팀 통합 계약 (팀 확정 반영)

```contract
tables:
  RFQ정리표.xlsx: 고객, 제품, 수량, 납기, 특이조건
  마진검토표.xlsx: 원가, 제안단가, 마진, 플래그사유

writers:
  RFQ정리표.xlsx: RFQ정리기
  마진검토표.xlsx: 마진검토표생성기

chain: RFQ정리기 -> 마진검토표생성기 -> 견적서초안생성기

payloads: 견적요청, RFQ정리결과, 마진검토결과, 견적서초안

threshold: 실행 시 지정(커스텀 — 마진 기준율)
halt_at: 견적서초안생성기
```
"""
SPEC = {
    "RFQ정리기": ("견적요청", "RFQ정리결과", "", "RFQ정리표.xlsx", "마진검토표생성기"),
    "마진검토표생성기": ("RFQ정리결과", "마진검토결과", "RFQ정리표.xlsx", "마진검토표.xlsx", "견적서초안생성기"),
    "견적서초안생성기": ("마진검토결과", "견적서초안", "마진검토표.xlsx", "", "null"),
}
PLAN_DATA = """## 3. 데이터 명세
| 표 이름 | 칸 이름 | 원본 위치(SSOT) | 읽기/쓰기 |
|---|---|---|---|
| RFQ정리표.xlsx | 고객, 제품, 수량, 납기, 특이조건 | 공용드라이브/영업/data | 쓰기 |
| 마진검토표.xlsx | 원가, 제안단가, 마진, 플래그사유 | 공용드라이브/영업/data | 쓰기 |"""
PLAN_SCENARIO = """## 4. 대표 시나리오
- 트리거: RFQ 메일 수신, 수신 폴더를 지정
- 입력: 견적요청 → 처리: 정리·마진 검토·초안 → 출력: RFQ정리결과 · 마진검토결과 · 견적서초안
- 파이프라인: RFQ정리기 → 마진검토표생성기 → 견적서초안생성기

## 7. 검증·휴먼인더루프 지점
- 견적서초안은 확인 요청으로 끝난다 — 승인·발송은 사람이 확정한다
- 마진 기준율 미달 플래그 건은 팀장 확인 전 발송 금지"""
HALT = """
## 사람이 확인하고 멈추는 지점
- 견적서초안 전달 — 여기서 확인을 요청하고 멈춘다. 자동 발송하지 않는다. 승인·발송은 사람이 확정한다.
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
        if new == "견적서초안생성기" and "멈춘다" not in t: t += HALT
        p.write_text(t, encoding="utf-8")
    plan = pack / "agent-plan.md"; t = plan.read_text(encoding="utf-8")
    t = re.sub(r"## 3\. 데이터 명세.*?\| \(미정\) \| \(미정\) \| \(미정\) \| \(미정\) \|", PLAN_DATA, t, flags=re.S)
    t = re.sub(r"## 4\. 대표 시나리오\n- \(미정\).*", PLAN_SCENARIO, t, flags=re.S)
    plan.write_text(t, encoding="utf-8"); print("영업 팀 확정 반영 완료"); return 0
if __name__ == "__main__": sys.exit(main(sys.argv[1]))
