# CLAUDE.md

이 저장소는 **File-based Planning Workflow**로 운영합니다.
작업을 시작하기 전에 이 문서를 먼저 읽고, 아래 규칙을 지키세요.

## 1. 작업 단위

모든 작업은 `docs/features/<기능명>/` 아래 6개 문서로 관리합니다.
새 작업을 시작하면 `templates/`의 6개 파일을 그대로 복사해서 채웁니다.

| 파일          | 역할                                    | 갱신 시점                       |
| ------------- | --------------------------------------- | ------------------------------- |
| `README.md`   | 기능 개요 (Background / Goal / How)     | 기능 정의가 바뀔 때             |
| `spec.md`     | 요구사항·PRD (FR / CON / SC)            | Phase 1                         |
| `plan.md`     | 기술 구현 계획 (Critical Files, Steps)  | Phase 2                         |
| `tasks.md`    | Phase별 체크리스트와 현재 상태          | **Phase를 시작/완료할 때마다**  |
| `findings.md` | 조사 결과, 기술적 결정, 에러 상세       | **발견·결정·에러 발생 즉시**    |
| `progress.md` | 세션별 시간순 작업 기록, 테스트 결과    | **세션을 마칠 때마다**          |

## 2. Phase

`tasks.md`의 Phase를 순서대로 진행하고, 상태 이모지를 반드시 갱신합니다.
`⏸️ 대기 → 🔄 진행 중 → ✅ 완료`

1. **Phase 1: Requirements & Discovery** — 요구사항 정의, 기존 코드/문서 분석, `spec.md` 작성 및 승인
2. **Phase 2: Planning & Structure** — `plan.md` 작성, 영향 범위(Critical Files) 확정
3. **Phase 3: Implementation** — 계획대로 구현, 단계마다 검증
4. **Phase 4: Testing** — 전체 빌드/테스트, 수동 테스트

Phase를 건너뛰지 않습니다. 건너뛴다면 그 이유를 `findings.md`의 Technical Decisions에 남깁니다.

## 3. 기록 규칙

- **결정**은 `findings.md`의 `Technical Decisions` 표에 `Decision | Rationale`로 남깁니다.
- **에러**는 `findings.md`의 `Issues Encountered`에 문제/원인/해결/결과를 상세히,
  `progress.md`의 `Error Log` 표에는 한 줄 요약만 남깁니다.
- **추측을 사실처럼 적지 않습니다.** 확인되지 않은 값은 `(미정)`으로 둡니다.

## 4. 세션 재개 (5-Question Reboot Check)

작업을 이어받을 때 `progress.md`의 5문항에 모두 답할 수 있어야 합니다.
답할 수 없으면 구현을 시작하지 말고 문서부터 복구합니다.

1. 현재 어느 단계인가?
2. 다음에 할 일은?
3. 목표는?
4. 지금까지 배운 것은?
5. 완료한 작업은?

## 5. 스킬 작성 시

이 저장소에 담기는 산출물은 대부분 **AI 스킬(프롬프트 명세)** 입니다.
스킬 문서를 작성/수정할 때는 다음을 지킵니다.

- 스킬 파일 상단에 `name` / `description` 프론트매터를 둡니다.
  `description`에는 **언제 이 스킬이 발동해야 하는지**를 구체적으로 적습니다.
- 대화형 코치 스킬은 **한 턴에 질문 하나**, **빈칸으로 되묻지 않기**(보기 2~3개 제시),
  **같은 질문 3회 금지** 원칙을 따릅니다.
- 출력 형식(산출물 계약)은 기계적으로 검사 가능한 형태로 명시합니다.
- 스킬 본문을 고쳤으면 그 이유를 해당 기능의 `findings.md`에 남깁니다.
