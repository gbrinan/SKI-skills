# 견적 대응 팀 통합 계약 (팀 확정 반영)

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
