# SKI Skills

SK이노베이션 「1인 1Agent」 과정에서 쓰는 **AI 스킬(Skill) 저장소**입니다.

작업 방식은 [File-based Planning Workflow](https://github.com/ahastudio/til/blob/main/ai/file-based-planning-workflow.md)
([원본 저장소](https://github.com/ahastudio/file-based-planning-workflow))를 그대로 따릅니다.

## 세 코치 전체 사용법

**TL;DR:** 이 저장소는 전체 흐름의 앞단인 **Wireframe Moderator Coach**와 **Wireframe Coach**를 제공합니다. 모더레이터가 적합한 LV5를 고르고, 와이어프레임 코치가 사람의 승인을 받은 `tobe.html`과 업무별 `SKILL.md`를 만듭니다. 실행 가능한 팀 스킬팩·에이전트, 실행 목업, 발표자료 패키징은 [Jcurve_SKI](https://github.com/gbrinan/Jcurve_SKI)의 Activity Packaging Coach로 넘깁니다. 독립 배포용 와이어프레임 코치는 [wireframe-coach](https://github.com/gbrinan/wireframe-coach)에서도 받을 수 있습니다.

```mermaid
flowchart TB
  U["1. 비식별 업무 요청과 자료<br/>최대 5종"] --> M["2. Wireframe Moderator Coach<br/>LV5 후보와 적합성 판정"]
  M --> MS["선정 트리 HTML<br/>선정 상태 블록"]
  MS --> H1{"사람 확인<br/>대상 LV5 확정"}

  H1 --> W["3. Wireframe Coach<br/>판단 기준·예외·책임 설계"]
  W --> WF["tobe.html + WFDATA<br/>업무별 task SKILL.md"]
  WF --> H2{"사람 확인<br/>와이어프레임 승인"}

  H2 --> A["4. Activity Packaging Coach<br/>계약·writer·payload·chain 통합"]
  A --> C{"독립 AI 작업 수와<br/>L0-L4 결과"}
  C -->|"2개 이하"| SP["team skillpack"]
  C -->|"3개 이상 + 검증 통과"| TA["team agent"]
  SP -. "3개 이상 + 검증 통과" .-> TA
  TA -. "2개 이하" .-> SP

  SP --> PKG["5. team-package/MANIFEST.md<br/>생성 결과의 단일 진입점"]
  TA --> PKG
  PKG --> AS["AGENTS.md + task skills<br/>에이전트 정의와 실행 능력"]
  PKG --> RT["run.mjs + trace.json<br/>로컬 실행과 기록"]
  PKG --> MX["agent-mockup.html<br/>실행 상태·분기·사람 정지"]
  PKG --> DK["agent-plan-deck.html<br/>9면 발표자료"]

  RT --> CMD["6. Manifest의 명령 실행<br/>node run.mjs"]
  CMD --> HH{"사람 책임 지점<br/>자동 진행 금지"}
  HH --> OUT["결과 파일 확인<br/>근거·미해결 항목·다음 행동"]

  AS --> V["7. 최종 검증<br/>skill validator · L0-L4 · E2E"]
  MX --> V2["목업 QA<br/>375·768·1280 × 4상태"]
  DK --> V3["발표 QA<br/>375·768·1280 × 9면"]
  OUT --> V
  V --> H3{"사람 최종 판단<br/>외부 행동은 별도 승인"}
  V2 --> H3
  V3 --> H3

  classDef coach fill:#10233f,color:#ffffff,stroke:#10233f,stroke-width:2px;
  classDef current fill:#EA002C,color:#ffffff,stroke:#9f001e,stroke-width:3px;
  classDef artifact fill:#f7f5f2,color:#20242a,stroke:#6b7280,stroke-width:1px;
  classDef human fill:#f7dddd,color:#7f1d1d,stroke:#a62a2a,stroke-width:2px;
  classDef package fill:#e7f3eb,color:#14532d,stroke:#216e46,stroke-width:2px;
  class M,W,A coach;
  class M,W current;
  class MS,WF,AS,RT,MX,DK,CMD,OUT,V,V2,V3 artifact;
  class H1,H2,HH,H3 human;
  class SP,TA,PKG package;
```

빨간 노드가 이 저장소가 직접 제공하는 단계입니다. 사람 확인을 통과하지 않은 참고자료는 현재 업무 사실로 승격하지 않으며, 와이어프레임 승인 전에는 실행 패키징으로 넘어가지 않습니다.

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

## 핵심 원칙

- **문서가 곧 컨텍스트다.** 세션이 끊겨도 6개 문서만 읽으면 이어서 작업할 수 있어야 합니다.
- **갱신 시점을 지킨다.** Phase 시작 시 `tasks.md`, 발견/결정 즉시 `findings.md`, 세션 종료 시 `progress.md`.
- **에러는 반드시 남긴다.** 같은 삽질을 두 번 하지 않기 위해서입니다.
