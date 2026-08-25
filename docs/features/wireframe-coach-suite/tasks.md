# Tasks: 와이어프레임 코치 스위트

## Goal

디자인캠프 md 5종을 입력으로 받는 코치 스킬 2개(모더레이터 코치 + 와이어프레임 코치)를
paperthin·file-based-planning 철학으로 설계해 저장소에 등록한다.

## Current Phase

✅ Phase 7: Wireframe Coach LV5 전체 파일럿 테스트 완료

## Phases

### Phase 1: Requirements & Discovery ✅

- [x] 요구사항 정의 (사용자 요청 + 업로드 파일 7종 분석)
- [x] 기존 스킬 2종(AgentTaskFit v3.0, WireframeCoach v8) 분석
- [x] 디자인캠프 산출물 5종 스키마 분석
- [x] 참조 저장소 철학 조사 (file-based-planning-workflow, paperthin)
- [x] 스펙 문서 작성 (spec.md)

### Phase 2: Planning & Structure ✅

- [x] 구현 계획 작성 (plan.md)
- [x] 계승/폐기 요소 결정 (findings.md)
- [x] Critical Files 확정

### Phase 3: Implementation ✅

- [x] skills/wireframe-moderator-coach.md 작성
- [x] skills/wireframe-coach.md 작성
- [x] 상태 블록(@@STATE@@) 스키마 정의

### Phase 4: Testing ✅

- [x] 산출물 계약 자체 검증 (프론트매터, 계약 규칙, 상태 블록 왕복)
- [x] 커밋 및 푸시

### Phase 5: Moderator v1.4 UI ✅

- [x] 회계관리팀 v7 참고 HTML에서 색·위계·페이지 흐름 추출
- [x] `DESIGN.md` 작성
- [x] 6페이지 데이터 기반 HTML 템플릿과 렌더러 구현
- [x] 사람이 준비·연동·최종 책임지는 역할 분류 구현
- [x] 비IT용 쉬운 용어와 화면 약어 금지 validator 구현
- [x] 경영전략팀 가상 데이터와 판정 완료 예시 생성
- [x] 판정 전/완료, 사람 업무 제외, 약어 부정 테스트 통과
- [x] 375/768/1280 반응형 계약 정적 검사 및 로컬 브라우저 정책상 미실행 제약 기록
- [x] 구현·계약 검증 커밋 및 PR 전달 준비

### Phase 6: Moderator 단계 탐색 파일럿 🟡

- [x] 별도 작업 `01a0374b-7985-7490-a62d-e0901c7e3670`의 모더레이터·와이어프레임·패키징 요구사항 대조
- [x] 4단계 탐색, 중립 상태 언어, 팀 선택 경계를 `DESIGN.md`에 추가
- [x] 원본 AI 전환 추천과 모더레이터 기준 충족을 별도 데이터로 검증
- [x] 판정 완료 전 팀 선택 확인·이유를 강제하고 예외 선택 이유를 보존
- [x] 6페이지 HTML에 단계 요약·필터·중립 상태를 구현하고 회귀 검사
- [ ] 정상 브라우저 환경에서 375/768/1280 실제 표면 확인
- [ ] 파일럿 결과를 바탕으로 와이어프레임·액티비티 코치 후속 반영 범위 확정

### Phase 7: Wireframe Coach LV5 전체 파일럿 ✅

- [x] 단일 LV6 방식 대신 선정 LV5의 LV6 전체를 한 지도에 보존하는 계약 확정
- [x] 추천 스킬 2~3개와 추천별 `SKILLHINT` 템플릿 인수인계 계약 추가
- [x] `LV5MAP`·`SKILLHINT`·`WFDATA`·상태 블록 정합 validator와 부정 테스트 7개 구현
- [x] 경영전략팀 가상 입력·최종 MD·자체완결 4페이지 HTML 생성
- [x] 375·768·1280 실제 브라우저 탭·가로 넘침·키보드 이동 확인
- [x] 새 에이전트 forward test와 375·768·1280 전체 구간 시각 증거 반영
- [x] 배포 사본 v1.2 동기화와 최종 검증
- [ ] 변경 묶음 전체 커밋·푸시

### Phase 8: 비개발자 화면 언어와 코치 명칭 정리 ✅

- [x] 모더레이터를 `디자인 캠프 해설 코치`로 변경하고 HTML 용도 표시
- [x] 와이어프레임 코치를 `에이전트 설계 코치`로 변경하고 `노드`를 화면에서 `작업`으로 번역
- [x] 액티비티 코치를 `스킬·에이전트 통합 코치`로 변경하고 목업·발표자료·직접 테스트 용도 명시
- [x] LV5 전체 작업 연결도와 다음·예외·사람 확정 경로를 시각화
