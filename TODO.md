# Fix: Irrelevant Job Recommendations

## Root Cause Analysis

Jobs with 0% skill overlap are still recommended because:

1. No minimum skill overlap threshold exists in `blendRecommendations`
2. Score normalization `Math.max(rawMax, 0.8)` artificially inflates weak scores
3. Diversity enforcement (`enforceDiversity`) round-robins across categories regardless of skill match
4. Fallback returns random recent jobs sorted by `createdAt`

## Fixes to Apply

### [x] Fix 1: Add skill overlap threshold

- Add `SKILL_OVERLAP_THRESHOLD = 0.1` constant (10%)
- Add `filterBySkillOverlap()` helper to remove jobs below threshold

### [x] Fix 2: Fix score normalization

- Remove `Math.max(rawMax, 0.8)` floor so weak matches show low scores naturally

### [x] Fix 3: Fix diversity enforcement

- Apply `filterBySkillOverlap` before `enforceDiversity` in `blendRecommendations`

### [x] Fix 4: Fix fallback logic

- Instead of `order: [["createdAt", "DESC"]]`, search for jobs with ANY skill overlap with user

### [x] Fix 5: Message-level filtering

- In `sendRecommendationAsMessage`, post-filter to only include jobs above threshold
- Skip sending if no qualifying jobs remain
