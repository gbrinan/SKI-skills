# Corporate Training Deck Examples

Use these examples to calibrate structure, specificity, and learning flow. Replace their subject matter with the user's actual content.

## Example 1: New three-hour workshop

### Request

> 생성형 AI를 처음 접하는 대리·과장급 직원을 대상으로 3시간짜리 실습 중심 강의안을 만들어줘.

### Communication job

> By the end, first-time learners should distinguish conversational help from a repeatable work procedure and create one procedure for their own work.

### Session plan

| Session | Objective | Participant output | Time |
|---|---|---|---|
| 1. 차이 이해 | 질문형 사용과 실행 절차의 차이를 설명한다 | 반복 업무 후보 1개 | 40분 |
| 2. 업무 분해 | 입력·절차·검토·출력을 구분한다 | 업무 절차 초안 1개 | 60분 |
| 3. 실행과 수정 | 초안을 실행하고 결과를 점검한다 | 수정된 절차 1개 | 60분 |
| Buffer | 접속·질문·오류 복구 | - | 20분 |

### Opening sequence

1. **Cover**: 생성형 AI를 업무 절차로 바꾸는 3시간
2. **Agenda**: 오늘은 고르고, 나누고, 실행합니다
3. **Claim**: 답변을 받는 것과 업무를 끝내는 것은 다릅니다
4. **Compare**: 질문형 사용 / 반복 가능한 절차
5. **Term**: 절차 파일이 무엇인지 설명
6. **Real object**: 실제 파일과 실행 결과
7. **Workshop**: 반복 업무 하나 고르기
8. **Checkpoint**: 업무 이름, 입력, 결과물이 보이면 완료
9. **Next**: 다음 시간에는 업무를 실행 순서로 나눕니다

## Example 2: Terminology slide

```text
Type: Term
Eyebrow: TERM
Headline: 작업 절차

One-line definition:
같은 일을 다시 수행할 수 있도록 순서와 확인 기준을 적어둔 문서입니다.

Workplace analogy:
새로 온 팀원에게 건네는 업무 인수인계서와 비슷합니다.

Without:
매번 처음부터 설명합니다.

With:
같은 순서와 기준으로 다시 수행합니다.

Use today:
다음 실습에서 자신의 반복 업무를 네 단계로 나눕니다.
```

## Example 3: Workshop and checkpoint pair

### Workshop slide

```text
Type: Workshop
Headline: 반복하는 업무 하나를 골라 입력과 결과물을 적어주세요
Duration: 6분

Steps:
1. 지난 한 달 동안 두 번 이상 수행한 업무를 세 개 적습니다.
2. 결과물이 파일이나 메시지로 남는 업무를 하나 고릅니다.
3. 시작할 때 필요한 자료와 마지막에 남는 결과물을 적습니다.

Constraint:
부서 전체 업무가 아니라 한 사람이 시작하고 끝낼 수 있는 범위로 적습니다.

Success state:
업무 이름, 입력 자료, 결과물 세 칸이 채워져 있습니다.

Recovery:
범위가 너무 크면 결과물 하나가 나오는 단위까지 줄입니다.
```

### Checkpoint slide

```text
Type: Checkpoint
Headline: 세 칸이 채워졌으면 다음 단계로 갈 수 있습니다

Ready:
- 업무 이름이 동사와 결과물로 표현되어 있습니다.
- 실제로 사용하는 입력 자료가 적혀 있습니다.
- 마지막 결과물이 하나로 정해져 있습니다.

Not ready:
- `보고 업무`, `관리 업무`처럼 범위가 넓습니다.
- 입력 자료가 `필요한 자료`처럼 추상적입니다.
- 결과물이 여러 개 섞여 있습니다.
```

## Example 4: Revising an existing deck

### Request

> 기존 신입사원 보안교육 PPT를 60분 과정으로 줄이고 실습을 추가해줘.

### Source handling

```text
Current user request: 60 minutes and add practice
Authoritative source: supplied current PPTX
Supporting source: supplied security policy
Legacy source: previous facilitator notes
```

### Change plan

| Existing content | Action | Reason |
|---|---|---|
| Cover and required legal notice | Keep | Required identity and compliance content |
| Repeated policy definitions | Rewrite and consolidate | Preserve meaning while reducing lecture time |
| Outdated UI screenshot | Replace | Current behavior must be shown accurately |
| Policy acknowledgment activity | Insert | Creates an observable learner action |
| Optional case study | Fallback | Use only when time remains |

Preserve the source template's design. Do not restyle the deck merely because the content is being shortened.

## Example 5: Applying the user profile

### Filled profile excerpt

```yaml
identity:
  display_name: "김강사"
  professional_title: "업무혁신 교육기획자"
  public_bio: "현업의 반복 업무를 학습 가능한 절차로 바꾸는 교육을 설계합니다."

expertise:
  primary_topics:
    - 생성형 AI 업무 활용
    - 업무 프로세스 설계

teaching_defaults:
  language: "ko"
  tone: "차분하고 실무적인 존댓말"
  preferred_audience: "비개발 직군 실무자"
  default_hands_on_ratio: "60%"
  learner_address: "여러분"

deck_preferences:
  include_instructor_slide: "when relevant"
  include_speaker_notes: true
```

### Current request

> 연구개발팀 리더 대상 90분 교육으로 만들어줘. 실습은 30분만 넣어줘. 강사소개는 빼줘.

### Resolution

| Field | Applied value | Reason |
|---|---|---|
| Audience | 연구개발팀 리더 | Current request overrides preferred audience |
| Duration | 90 minutes | Current request |
| Hands-on time | 30 minutes | Current request overrides the 60% profile default |
| Instructor slide | Omit | Current request overrides the profile |
| Language and tone | Korean, calm and practical | Profile applies because the request is silent |
| Speaker notes | Include | Profile applies because the request is silent |
| Expertise | Use when relevant | Profile supports examples but does not replace course evidence |

Do not display the profile file, internal preferences, or precedence decision in the final deck.
