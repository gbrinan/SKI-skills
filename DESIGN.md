# Moderator Coach Selection Tree Design System

## 1. Atmosphere & Identity

워크숍 참가자가 긴 업무 트리를 길을 잃지 않고 함께 탐색하는 따뜻한 진행 보드다. 회계관리팀 v7 참고 HTML의 아이보리 바탕, 오렌지 강조, 큰 단계 번호, 넓은 여백을 시각적 기준으로 삼는다. 고유한 장면은 현재 위치와 부모-자식 관계를 동시에 보여주는 이중 페이지 탐색이다. 장식보다 “어디를 보고 있고, 다음에 무엇을 결정해야 하는가”를 먼저 보인다.

## 2. Color

| Role | Token | Value | Usage |
|---|---|---|---|
| Page | `--surface-page` | `#FFF9F1` | 전체 배경 |
| Paper | `--surface-paper` | `#FFFFFF` | 본문·카드 |
| Warm | `--surface-warm` | `#FFF0DD` | 안내·현재 선택 |
| Dark | `--surface-dark` | `#2B211B` | 헤더·강한 대비 |
| Text | `--text-primary` | `#2B211B` | 제목·본문 |
| Secondary | `--text-secondary` | `#6F6259` | 설명·메타데이터 |
| Muted | `--text-muted` | `#8C8179` | 비활성 정보 |
| Border | `--border-default` | `#E8D8C8` | 카드·구분선 |
| Accent | `--accent-primary` | `#C84F13` | 현재 위치·주요 행동 |
| Accent hover | `--accent-hover` | `#A93F0A` | 버튼 hover |
| Focus | `--focus-ring` | `#0B63CE` | 키보드 포커스 |
| Success | `--status-success` | `#166B3B` | 추천·AI 범위 |
| Warning | `--status-warning` | `#9B5C00` | 확인 필요·연동 필요 |
| Error | `--status-error` | `#A52A2A` | 부적합·주의 |
| Human | `--status-human` | `#6B4EA0` | 사람이 준비·책임 |

색상은 의미 있는 상태와 상호작용에만 사용한다. 상태는 색상만으로 전달하지 않고 텍스트와 아이콘을 함께 쓴다.

## 3. Typography

| Level | Size | Weight | Line Height | Usage |
|---|---:|---:|---:|---|
| Display | `clamp(2rem, 5vw, 3.5rem)` | 800 | 1.12 | 첫 화면 제목 |
| H1 | `clamp(1.75rem, 4vw, 2.5rem)` | 800 | 1.2 | 페이지 제목 |
| H2 | `1.5rem` | 750 | 1.3 | 섹션 제목 |
| H3 | `1.125rem` | 700 | 1.4 | 카드 제목 |
| Body large | `1.0625rem` | 500 | 1.65 | 주요 설명 |
| Body | `1rem` | 400 | 1.65 | 기본 본문 |
| Body small | `0.875rem` | 500 | 1.55 | 보조 정보 |
| Caption | `0.75rem` | 700 | 1.4 | ID·쪽수 |

- 글꼴: `"Malgun Gothic", "Apple SD Gothic Neo", system-ui, sans-serif`
- 데이터 숫자에는 `font-variant-numeric: tabular-nums`를 쓴다.
- 한국어 제목은 `word-break: keep-all`, 긴 식별자는 `overflow-wrap: anywhere`를 쓴다.
- 화면에 약어만 단독 노출하지 않는다. 한국어 뜻을 먼저 쓰고 원어·ID는 보조 정보로 둔다.

## 4. Spacing & Layout

기본 단위는 4px이다. `--space-1` 4px, `--space-2` 8px, `--space-3` 12px, `--space-4` 16px, `--space-5` 20px, `--space-6` 24px, `--space-8` 32px, `--space-10` 40px, `--space-12` 48px, `--space-16` 64px을 사용한다.

- 최대 본문 폭: 1200px
- 페이지 좌우 여백: `clamp(1rem, 4vw, 3rem)`
- 상단 6단계 탐색은 줄바꿈 가능한 `cluster`다.
- 본문은 문서가 세로 스크롤을 소유한다. 내부에 별도 세로 스크롤을 만들지 않는다.
- LV4와 LV5 내부 페이지 탐색은 현재 항목 한 개만 보여주고 이전·다음으로 이동한다.
- 375px에서는 모든 주요 콘텐츠가 한 열로 재배치되어야 하며 가로 문서 스크롤을 허용하지 않는다.
- LV6는 선택한 LV5의 상세 영역 안에만 렌더링하며 전역 목록으로 분리하지 않는다.

## 5. Components

### 단계 탐색
- **Structure**: `nav > button[role=tab] × 6`
- **States**: 기본, hover, active, focus, disabled
- **Accessibility**: `aria-selected`, roving tabindex, 화살표 키·Home·End 지원
- **Motion**: 색상과 투명도만 180ms 전환. 위치 애니메이션은 사용하지 않는다.

### 내부 페이지 탐색
- **Structure**: 이전 버튼, 현재 항목/전체 수, 다음 버튼
- **States**: 양끝 버튼 disabled, 현재 항목은 `aria-live`로 알림
- **Layout**: 375px에서도 버튼과 쪽수가 한 줄에 들어오며 제목은 별도 줄로 둔다.

### 업무 카드
- **Structure**: ID 보조 표기, 제목, 근거, 상태 배지, 범위 요약
- **Variants**: 추천, 확인 필요, 대안, 제외
- **Depth**: 바깥 카드 한 겹만 사용하고 카드 안에 또 다른 장식 카드 체계를 만들지 않는다.

### 세부 업무 행
- **Structure**: 순서, 이름, 역할 유형, 이유
- **Variants**: AI 처리, AI 보조+사람 판단, 사람이 준비, 연동 필요, 사람이 책임
- **Accessibility**: 아이콘·색·텍스트를 함께 사용한다.

### 용어 설명
- **Structure**: 용어, 쉬운 뜻, 이 화면에서의 의미
- **Behavior**: hover 전용 설명을 금지하고 본문에서 항상 읽을 수 있게 한다.

### 토의 요약
- **Structure**: 선택 후보, 판정, 조건/대안, 사람이 맡는 시작·끝 경계
- **States**: 판정 전, 권장, 조건부 권장, 대안 권장

## 6. Motion & Interaction

beui.dev `tabs`의 활성 탭·패널 전환 원리를 바닐라 CSS/JavaScript에 맞게 단순화한다. 페이지 이동은 선택 상태를 즉시 갱신하고 패널 투명도만 180ms `ease-out`으로 전환한다. 버튼 누름은 `transform: translateY(1px)` 100ms로 피드백한다. `prefers-reduced-motion: reduce`에서는 모든 전환과 transform을 제거한다. 비상호작용 요소에는 애니메이션을 넣지 않는다.

## 7. Depth & Surface

전략은 `mixed`다. 종이 같은 본문은 1px 따뜻한 테두리로 분리하고, 현재 선택 카드 한 곳에만 `0 12px 32px rgba(98, 53, 22, 0.12)` 그림자를 쓴다. 내부 칩과 행에는 그림자를 쓰지 않는다. 둥근 정도는 바깥 영역 20px, 카드 14px, 작은 컨트롤 10px로 단계화한다.

## 8. Accessibility Constraints & Accepted Debt

### Constraints
- WCAG 2.2 AA를 목표로 한다. 본문 대비 4.5:1, 큰 글자와 비텍스트 UI 3:1 이상을 유지한다.
- 모든 버튼은 44×44 CSS px 이상의 터치 영역과 명확한 `:focus-visible` 표시를 가진다.
- 탭·내부 페이지 탐색·필터를 키보드만으로 실행할 수 있어야 한다.
- 현재 위치, 비활성 상태, 책임 유형을 색상만으로 구분하지 않는다.
- 문서 확대 200%와 375px 너비에서 핵심 정보가 잘리거나 가려지지 않아야 한다.
- 비IT 참가자가 첫 등장 용어를 읽고 별도 설명 없이 의미를 파악할 수 있어야 한다.

### Accepted Debt

| Item | Location | Why accepted | Owner / Exit |
|---|---|---|---|
| 브라우저 렌더 캡처 | 로컬 자체완결 예시 HTML | 현재 앱의 로컬 파일 브라우징 정책이 해당 파일 열기를 차단할 수 있음 | 정적·구조 validator 뒤, 허용된 실제 브라우저 환경에서 375/768/1280 캡처 |
