# SKI Skills

SK이노베이션 「1인 1Agent」 과정에서 쓰는 **AI 스킬(Skill) 저장소**입니다.

작업 방식은 [File-based Planning Workflow](https://github.com/ahastudio/til/blob/main/ai/file-based-planning-workflow.md)
([원본 저장소](https://github.com/ahastudio/file-based-planning-workflow))를 그대로 따릅니다.

## 구조

```text
.
├── CLAUDE.md              # AI 에이전트 작업 규칙 (워크플로우 정의)
├── templates/             # 문서 템플릿 (복사해서 사용)
│   ├── README.md          # 기능 개요
│   ├── spec.md            # 요구사항 / PRD
│   ├── plan.md            # 기술 구현 계획
│   ├── tasks.md           # 작업 계획 및 추적
│   ├── findings.md        # 기술적 발견 / 결정 / 에러 기록
│   └── progress.md        # 세션별 작업 내역
└── docs/features/         # 기능별 작업 문서 (템플릿 복사본이 쌓이는 곳)
    └── <기능명>/
        ├── README.md
        ├── spec.md
        ├── plan.md
        ├── tasks.md
        ├── findings.md
        └── progress.md
```

## 시작하기

새 기능(또는 새 스킬) 작업을 시작할 때:

```bash
FEATURE=my-feature
mkdir -p docs/features/$FEATURE
cp templates/*.md docs/features/$FEATURE/
```

그다음 `docs/features/$FEATURE/tasks.md`의 Phase 1부터 진행합니다.

## 세 코치 사용 순서

```mermaid
flowchart LR
  A["디자인캠프 자료"] --> M["디자인 캠프 해설 코치<br/>결과 확인·LV5 선택"]
  M -->|"선정 상태 블록"| W["에이전트 설계 코치<br/>LV5 전체 업무 흐름 설계"]
  W -->|"기계 판독 데이터"| C["스킬·에이전트 통합 코치<br/>실행 가능한 팀 팩"]
  C --> O["목업 HTML · 발표자료 · 실행 패키지"]
```

1. **디자인 캠프 해설 코치**: HTML로 디자인 캠프 결과물을 확인하고 다시 설계할 LV5 업무를 고릅니다.
2. **에이전트 설계 코치**: HTML에서 선택한 LV5의 전체 작업 흐름·예외·사람 확인을 그리고 스킬 2~3개로 나눕니다.
3. **스킬·에이전트 통합 코치**: 팀원 개개인이 만든 스킬을 넣어 실행 가능한 에이전트 팩과 발표자료를 만들고 HTML에서 직접 테스트합니다. 구현은 별도 [Jcurve_SKI](https://github.com/gbrinan/Jcurve_SKI) 저장소에 있습니다.

### 디자인 캠프 해설 코치 선정 보드 만들기

v1.4는 결과 읽는 방법 → 전체 업무 지도 → 프로세스(LV4) → 후보 업무(LV5) → 해당 후보의 세부 업무(LV6) → 최종 토의를 한 HTML에서 단계별로 보여줍니다. 전체 지도에서는 전체 LV4 → 전체 LV5 → 원본 AI 전환 추천 → 모더레이터 기준 충족을 분리해 보여주며, 새 순위를 만들지 않습니다. 사람이 준비하거나 최종 책임지는 업무와 현재 우선 검토가 아닌 업무도 삭제하지 않고 원본 흐름과 자동화 경계로 남깁니다.

```bash
node scripts/render-moderator.mjs examples/moderator-ui/strategy-team-data.json examples/moderator-ui/Lv5선정트리_경영전략팀_v1.4.html
node scripts/validate-moderator-output.mjs examples/moderator-ui/Lv5선정트리_경영전략팀_v1.4.html
node scripts/test-moderator-output.mjs
```

- 디자인 계약: `DESIGN.md`
- 재사용 HTML 템플릿: `assets/moderator-selection-tree-template.html`
- 렌더러·validator 공통 입력 계약: `scripts/moderator-schema.mjs`
- 가상 예시: `examples/moderator-ui/`
- 이노허브 배포 정본은 `distribution/innohub/와이어프레임모더레이터코치_v1.4.md` 하나입니다.

### 에이전트 설계 코치 결과 만들기

v1.2는 선정된 LV5 아래의 LV6 전체를 한 시각 흐름에 보존한 뒤, 연속된 작업에서 스킬 2~3개를 추천합니다. 각 추천에는 완성 스킬 대신 입력·출력·순서·규칙·예외·사람 개입·테스트·미확인 질문을 담은 `SKILLHINT`가 붙습니다.

```bash
node scripts/validate-wireframe-output.mjs examples/wireframe-ui/strategy-briefing-final.md
node scripts/render-wireframe-output.mjs examples/wireframe-ui/strategy-briefing-final.md examples/wireframe-ui/To-Be_시장동향브리핑_v1.2.html
node scripts/test-wireframe-output.mjs
```

- 가상 원본: `examples/wireframe-ui/strategy-briefing-source.json`
- 기계 검사 가능한 최종 예시: `examples/wireframe-ui/strategy-briefing-final.md`
- 자체완결 시각 결과: `examples/wireframe-ui/To-Be_시장동향브리핑_v1.2.html`
- 판정 전 HTML에는 `atf-data`가 없어야 하며, 판정 완료본에만 포함됩니다.
- 화면은 `Pain Point(업무상 불편·병목)`, `Human in the Loop(사람 개입)`처럼 비IT 참가자가 바로 이해할 수 있는 표현을 우선합니다.

## 핵심 원칙

- **문서가 곧 컨텍스트다.** 세션이 끊겨도 6개 문서만 읽으면 이어서 작업할 수 있어야 합니다.
- **갱신 시점을 지킨다.** Phase 시작 시 `tasks.md`, 발견/결정 즉시 `findings.md`, 세션 종료 시 `progress.md`.
- **에러는 반드시 남긴다.** 같은 삽질을 두 번 하지 않기 위해서입니다.
