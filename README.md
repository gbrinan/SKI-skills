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

## 핵심 원칙

- **문서가 곧 컨텍스트다.** 세션이 끊겨도 6개 문서만 읽으면 이어서 작업할 수 있어야 합니다.
- **갱신 시점을 지킨다.** Phase 시작 시 `tasks.md`, 발견/결정 즉시 `findings.md`, 세션 종료 시 `progress.md`.
- **에러는 반드시 남긴다.** 같은 삽질을 두 번 하지 않기 위해서입니다.
