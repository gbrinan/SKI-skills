# Implementation Plan: 와이어프레임 코치 스위트

## Summary

기존 AgentTaskFit v3.0과 WireframeCoach v8을 해체해, 디자인캠프 md 5종을 입력으로 받는
2단계 코치(선정 → 설계)로 재조립한다. 산출물 간 연결은 `@@STATE@@` 상태 블록으로 한다.

## Requirements

1. 스킬 1: md 5종 → Lv4 지도 → Lv5 × 5기준 워크시트 HTML → 에이전트 적절성 판정
2. 스킬 2: 상태 블록/md → 대화형 To-Be 와이어프레임 → 노드 방식 판정 → 스킬 2~3개 추천

## Critical Files

### New Files

- `skills/wireframe-moderator-coach.md` — 스킬 1
- `skills/wireframe-coach.md` — 스킬 2
- `docs/features/wireframe-coach-suite/*.md` — 본 문서 6종

### Reference Files (저장소 외부 — 업로드 입력)

- AgentTaskFit v3.0 (기존 핏 코치) — 6기준 게이트·판정 3종·해석 표기 원칙 계승
- WireframeCoach v8 — 블랙박스 사냥·환경태그·mermaid LR·산출물 계약 계승
- 디자인캠프 산출물 5종 — 입력 스키마의 근거

## Steps

1. 두 기존 스킬에서 계승/폐기 요소 분리 (findings.md에 기록)
2. 스킬 1 작성: 파싱 → Lv4 지도 → 워크시트(자동 채움 규칙 명시) → 판정 → 상태 블록
3. 스킬 2 작성: 리부트 체크 → As-Is 확인 → 판단기준 캐기 → 환경태그 → 방식 판정 → 스킬 추천 → 산출물
4. 산출물 계약(기계 검사 규칙) 작성
5. 커밋·푸시

## What we deliberately removed (paperthin)

- 스킬 1에서: 짝 점검 게이트(팀 모더레이션 상황에 불필요), 노드 단위 설계(스킬 2의 일)
- 스킬 2에서: 에이전트 적합성 재판정(스킬 1이 이미 했다 — 중복 제거), Lv5 재선정 루프
- 공통: 점수·등급, 출처 강의, 스킬 본문 작성
