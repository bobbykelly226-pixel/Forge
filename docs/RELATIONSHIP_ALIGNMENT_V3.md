# Relationship Alignment V3

Status: launch-blocking implementation specification, approved September 10, 2026.

## Product contract

- Relationship Alignment is the normalized, weighted picture across comparable categories.
- An Important Alignment Factor is independent context. It never automatically changes the overall Relationship Alignment label.
- Only an explicit need, boundary, or practical constraint can be presented as a possible boundary conflict. A factual difference is not enough.
- Missing, withheld, skipped, inapplicable, and optional answers are excluded rather than treated as mismatches.
- The product does not expose percentages, grades, rankings, raw partner answers, or false precision.
- Forge explains the available context; the people decide what it means for their relationship.

## V2 question audit and V3 core

The V3 initial profile contains 30 questions: three in each of ten categories. Stable V2 question and choice keys are retained for safe response migration. No V2 content is deleted.

| Category | Core (V3) | Duplicate / onboarding-supplied | Preserved deepening candidates | Remove |
|---|---|---|---|---|
| Relationship Vision & Intentions | q02 marriage importance; q03 pace; q04 exclusivity | q01 relationship goal | q05 commitment meaning; q06 readiness; q08 future alignment; q10 lasting partnership | None |
| Values & Character | q03 promises; q04 intent and impact; q07 admitting wrong | q01 core values | q02 falling short; q06 responsibility; q09 partner traits; q10 values and actions | None |
| Communication & Emotional Connection | q01 timing; q02 directness; q05 contact frequency | None | q03 feeling heard; q04 response to a problem; q06 vulnerability; q07 sharing; q10 communication habits | None |
| Conflict & Repair | q01 first response; q02 heated conflict; q06 sincere apology | None | q03 fair compromise; q04 acceptable outcome; q07 forgiveness; q08 recurring conflict; q10 harmful patterns | None |
| Commitment & Partnership | q01 exclusivity; q02 responsibilities; q04 independence | None | q03 temporary imbalance; q05 shared decisions; q06 major decisions; q08 dependability; q10 continued effort | None |
| Family, Children & Parenting | q06 parenting responsibilities; q07 discipline; q08 parental disagreement | None | q02 extended family; q04 paths to family; q05 fertility difficulty; q09 stepparent role; q10 family boundaries | None |
| Faith, Spirituality & Worldview | q04 importance of shared belief; q06 healthy differences; q10 belief boundaries | q01 role of faith; q02 faith identity | q03 practices; q05 needed alignment; q09 teaching children | None |
| Politics, Civic Life & Social Issues | q01 outlook; q02 importance of shared outlook; q06 disagreement style | None | q03 participation; q04 civic principles; q05 public issues; q07 discussion at home; q10 political boundaries | None |
| Service, Community & Contribution | q01 importance; q04 partner value; q06 home balance | q02 service background | q03 motivation; q05 serving together; q07 giving; q10 service boundaries | None |
| Integrity, Honesty & Trust | q01 trust building; q03 privacy; q07 serious breach | None | q02 disclosure; q04 difficult truth; q05 correcting misinformation; q06 repeated commitments; q10 trust boundaries | None |

Audit totals: 30 Core, 5 Duplicate/onboarding-supplied, 45 Deepening, 0 Remove.

## Existing profile and onboarding signal roles

| Signal | Relationship Alignment | Important factor / explicit boundary | Practical constraint |
|---|---|---|---|
| Relationship goal(s) | Yes | Only when an explicitly incompatible relationship structure is stated | No |
| Faith identity and importance | Importance may contribute | Identity difference alone is never negative; a conflict requires an explicit shared-belief need | No |
| Wants children / has children / openness to a partner with children | Yes | Direct yes/no or stated openness conflict may be an explicit boundary | No |
| Smoking and partner comfort | Limited lifestyle context | Explicit rejection of a partner's disclosed use is a boundary | No |
| Drinking and partner comfort | Limited lifestyle context | Explicit rejection of a partner's disclosed use is a boundary | No |
| Pets, allergies, and openness | Limited lifestyle context | Explicit allergy or non-openness conflict is a boundary | No |
| Core values | Yes | Difference alone is not a boundary | No |
| Distance and relocation | No | No | Yes; show the actual distance/relocation constraint without lowering alignment |
| Education and job title | No by default | Only when a person explicitly states a corresponding need | No |
| Service background | Context only | Difference alone is not negative | No |

## Calculation and coverage

1. Score only questions both people answered and that are responsibly comparable.
2. Normalize each category to a 0–1 category result before applying category weights.
3. Weight the ten categories, not their raw question counts.
4. Overall labels use the normalized weighted result only:
   - Strong Alignment: 0.80 or greater.
   - Promising Alignment: 0.58 through 0.7999.
   - More to Discover: below 0.58.
   - Not Enough Information: fewer than 12 comparable questions or fewer than 3 comparable categories.
5. Ordinary opposing categorical answers receive partial coexistence credit and may create Worth Discussing context; they do not become inferred dealbreakers.
6. Explicit boundaries and practical constraints are evaluated separately and rendered beside—not inside—the overall label.

## Version and migration safety

- V1 and V2 catalogs and responses remain intact.
- V3 uses `compatibility_profile_v3` and `compatibility_profile_core_30_v1`.
- Retained V2 responses are copied by stable question and choice key into V3.
- Response rows are never reinterpreted across different keys.
- V3 progress is recalculated from migrated V3 responses.
- Application queries always name their questionnaire version, preventing stale-version mixing.

## Release calibration gate

Automated fixtures must cover identical profiles, ordinary differences, one high-impact difference, a fully opposed category with nine aligned categories, several opposed high-impact categories, unilateral and bilateral explicit boundaries, partial coverage, excluded answer states, and factual onboarding differences without a conflicting boundary.
