# Implementation Plan: 기업교육 강의안 제작 스킬

## Summary

핵심 라우팅과 우선순위는 `SKILL.md`에 두고, 상세 설계 기준·예시·사용자 프로필은 `references/`에서 조건부로 참조한다.

## Critical Files

- `.codex/skills/build-corporate-training-decks/SKILL.md`
- `.codex/skills/build-corporate-training-decks/agents/openai.yaml`
- `.codex/skills/build-corporate-training-decks/references/user-profile.md`
- `.codex/skills/build-corporate-training-decks/references/training-deck-guide.md`
- `.codex/skills/build-corporate-training-decks/references/examples.md`

## Implementation Steps

1. 일반화된 강의안 모드와 자료 취급 규칙을 작성한다.
2. 빈칸형 사용자 프로필과 명시적인 우선순위를 추가한다.
3. 상세 강의안 기준과 프로필 재정의 예시를 참조 파일로 분리한다.
4. 공식 검사, 정적 검사, 세 시나리오 수동 검증을 수행한다.

## Verification

- `quick_validate.py .codex/skills/build-corporate-training-decks`
- 프론트매터, 링크, 폴더명, UI 메타데이터 정합성 검사
- 프로필 적용, 현재 요청 재정의, 민감정보 제외 시나리오 검토
