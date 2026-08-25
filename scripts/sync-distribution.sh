#!/usr/bin/env bash
# 스킬 원본(skills/*.md)에서 배포 사본을 재생성한다. 원본 수정 후 반드시 실행.
set -eu
cd "$(dirname "$0")/.."
cp skills/wireframe-moderator-coach.md .claude/skills/wireframe-moderator-coach/SKILL.md
cp skills/wireframe-coach.md .claude/skills/wireframe-coach/SKILL.md
rm -f "distribution/innohub/와이어프레임모더레이터코치_v1.3.md"
rm -f "distribution/innohub/와이어프레임코치_v1.1.md"
for pair in "wireframe-moderator-coach.md:와이어프레임모더레이터코치_v1.4.md" "wireframe-coach.md:와이어프레임코치_v1.2.md"; do
  src="skills/${pair%%:*}"; dst="distribution/innohub/${pair##*:}"
  { head -n1 "$src"
    echo "# ⚠️ 이노허브 배포용 사본 — 직접 수정 금지"
    echo "# 원본(SSOT): gbrinan/SKI-skills 저장소 skills/${pair%%:*}"
    echo "# 원본이 바뀌면 이 파일을 다시 생성한다 (scripts/sync-distribution.sh)"
    tail -n +2 "$src"
  } > "$dst"
done
echo "배포 사본 동기화 완료"
