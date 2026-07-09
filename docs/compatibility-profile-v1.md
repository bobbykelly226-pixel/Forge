# Forge Compatibility Profile V1 Blueprint

Status: Blueprint only. Not implemented.
Last updated: 2026-07-09

This document defines what Forge will eventually collect during onboarding and how those answers can support meaningful compatibility. It is a product and technical blueprint. It does not implement scoring, matching, messaging, discovery, or database changes.

---

## 1. Purpose

The Forge Compatibility Profile is the structured set of answers that helps Forge understand who someone is, what they want, and what they will not compromise on.

It matters because Forge is not another swipe app. Surface-level attraction is not enough. Forge exists to help people build lasting relationships through character, values, intention, and alignment.

The Compatibility Profile should:

- Give users a clear, intentional onboarding path after signup
- Capture relationship goals and values early
- Support future dealbreaker filtering and match explanations
- Protect trust by avoiding shallow or manipulative signals
- Stay lean enough to ship, then expand based on real user feedback

Business context: Forge is mission-first, and revenue matters. A clear compatibility foundation supports user value, retention, and a product people will pay for because it helps them find real alignment faster.

---

## 2. V1 Compatibility Categories

These are the first categories Forge should plan around. Not every category needs full depth in the first live questionnaire.

| Category | Why it matters |
|----------|----------------|
| Relationship Intent | Aligns people on what they are actually looking for |
| Faith and Values | Captures core beliefs and what guides decisions |
| Family and Future | Surfaces long-term life direction and family hopes |
| Communication Style | Helps people understand how they connect day to day |
| Emotional Maturity | Highlights responsibility, honesty, and self-awareness |
| Lifestyle and Priorities | Shows how people spend time, energy, and attention |
| Conflict and Repair | Reveals how people handle hard moments |
| Service and Community | Reflects care for others and shared mission |
| Growth Mindset | Shows willingness to learn, improve, and build together |
| Dealbreakers and Non-Negotiables | Protects users from mismatched fundamentals |

---

## 3. Example Questions

Questions should feel human, clear, and intentional. Avoid therapy jargon, clinical language, political-test framing, and long survey fatigue.

### Relationship Intent

1. What are you hoping to find on Forge?
2. How ready do you feel for a committed relationship right now?
3. Are you dating with marriage in mind, or still exploring serious connection?
4. What does “intentional dating” mean to you in your own words?

### Faith and Values

1. How important is faith in your daily life and relationships?
2. Which values matter most when you choose a partner?
3. Do you want a partner who shares your faith, or who respects it deeply?
4. What belief or principle guides your biggest life decisions?

### Family and Future

1. How do you feel about marriage in your future?
2. Do you want children someday?
3. How involved do you hope family will be in your life as a couple?
4. What kind of home life are you hoping to build?

### Communication Style

1. When something is bothering you, how do you usually handle it?
2. Do you prefer talking things through quickly, or taking time first?
3. How do you like to stay connected during a busy week?
4. What helps you feel heard in a relationship?

### Emotional Maturity

1. When you make a mistake, what do you usually do next?
2. How comfortable are you taking responsibility in hard conversations?
3. What does emotional honesty look like for you?
4. How do you handle stress without taking it out on someone else?

### Lifestyle and Priorities

1. What takes most of your energy right now: work, family, service, growth, or rest?
2. How do you prefer to spend a free weekend?
3. How important is shared routine versus independent space?
4. What priority would you want a partner to understand about your life?

### Conflict and Repair

1. When conflict shows up, what is your first instinct?
2. How do you usually try to repair after a disagreement?
3. What helps you feel safe enough to work through tension?
4. What is one conflict habit you are actively trying to improve?

### Service and Community

1. How important is serving others in your life?
2. Are you involved in any community, church, volunteer, or service work?
3. Do you want a partner who shares a heart for service?
4. What kind of impact do you hope to make together someday?

### Growth Mindset

1. How open are you to feedback from someone you love?
2. What area of life are you actively working to grow in right now?
3. Do you see relationships as something you build, not just something you find?
4. What does healthy growth as a couple look like to you?

### Dealbreakers and Non-Negotiables

1. What is one thing you are not willing to compromise on?
2. Are there relationship goals that must align before you date seriously?
3. What faith, family, or lifestyle differences would be too far apart for you?
4. Is there anything a future partner should know up front about your non-negotiables?

---

## 4. Answer Types

Recommended formats by category. Keep inputs simple and mobile-friendly.

| Category | Recommended answer types |
|----------|--------------------------|
| Relationship Intent | Single choice, short text |
| Faith and Values | Single choice, multi-select, short text |
| Family and Future | Single choice, short text |
| Communication Style | Single choice, scale |
| Emotional Maturity | Single choice, short text |
| Lifestyle and Priorities | Multi-select, priority ranking, single choice |
| Conflict and Repair | Single choice, short text |
| Service and Community | Single choice, short text |
| Growth Mindset | Scale, short text |
| Dealbreakers and Non-Negotiables | Multi-select, short text |

Answer type notes:

- **Single choice**: Best for clear intent and readiness questions
- **Multi-select**: Best for values and dealbreakers without forcing one answer
- **Short text**: Best for human nuance Forge should not over-automate early
- **Scale**: Best for comfort, readiness, or openness where ranges are natural
- **Priority ranking**: Best when users need to show what matters most, not just what matters

---

## 5. MVP Fields

Keep the first live questionnaire lean: about 12 to 18 questions. Capture signal without turning onboarding into homework.

### Recommended MVP question set (15 questions)

1. What are you hoping to find on Forge? *(Relationship Intent, single choice)*
2. How ready do you feel for a committed relationship right now? *(Relationship Intent, scale)*
3. How important is faith in your daily life and relationships? *(Faith and Values, single choice)*
4. Which values matter most when you choose a partner? *(Faith and Values, multi-select)*
5. Do you want a partner who shares your faith, or who respects it deeply? *(Faith and Values, single choice)*
6. How do you feel about marriage in your future? *(Family and Future, single choice)*
7. Do you want children someday? *(Family and Future, single choice)*
8. When something is bothering you, how do you usually handle it? *(Communication Style, single choice)*
9. Do you prefer talking things through quickly, or taking time first? *(Communication Style, single choice)*
10. When you make a mistake, what do you usually do next? *(Emotional Maturity, single choice)*
11. What takes most of your energy right now? *(Lifestyle and Priorities, single choice or multi-select)*
12. When conflict shows up, what is your first instinct? *(Conflict and Repair, single choice)*
13. How do you usually try to repair after a disagreement? *(Conflict and Repair, single choice)*
14. How important is serving others in your life? *(Service and Community, single choice)*
15. What is one thing you are not willing to compromise on? *(Dealbreakers, short text or multi-select plus optional text)*

Optional stretch questions if onboarding still feels light (keep total at or under 18):

16. What area of life are you actively working to grow in right now? *(Growth Mindset, short text)*
17. What priority would you want a partner to understand about your life? *(Lifestyle and Priorities, short text)*
18. Are there relationship goals that must align before you date seriously? *(Dealbreakers, multi-select)*

### MVP exclusions

Leave these for later versions:

- Long free-response essays
- Deep trauma history collection
- Political ideology scoring
- Detailed personality inventories
- Complex ranking matrices across every category
- Any question that exists only to increase time-on-app

---

## 6. Scoring Philosophy

Do not implement scoring yet. When Forge is ready, compatibility should emphasize meaningful alignment over entertainment metrics.

Possible future scoring ideas:

- **Shared values**: Overlap on selected values and faith importance
- **Aligned relationship goals**: Similar intent, marriage outlook, and family direction
- **Dealbreaker filtering**: Hard filters before soft ranking
- **Complementary communication styles**: Not identical clones, but workable patterns
- **Weighted priorities**: Let users mark what matters most and weight those more heavily
- **Profile completeness**: Prefer complete, honest profiles without punishing new users unfairly

Scoring principles:

- Explainability over mystery scores
- Filters before fine ranking
- Values and intention before aesthetics
- User trust over engagement hacks
- Start simple, then add weight only when data justifies it

---

## 7. What Not To Score Yet

Forge should not score or optimize for these in V1:

- Attractiveness or photo ranking
- Income or net worth
- Political purity tests
- Shallow preference checklists that encourage objectification
- Manipulative engagement signals
- Swipe behavior, binge usage, or “keep them hooked” metrics
- Shame-based personality judgments
- Hidden scores users cannot understand

If a signal does not help someone build a trustworthy relationship, it does not belong in early compatibility.

---

## 8. Future Compatibility Engine Notes

Later phases may include:

- `compatibility_answers` table for stored onboarding responses
- `compatibility_categories` table for admin-managed category metadata
- Weighted scoring with versioned formulas
- Match explanations in plain language (“You both prioritize faith and long-term commitment”)
- User-controlled dealbreakers
- Admin-adjustable question sets without redeploying core app logic
- Soft prompts to complete missing high-value answers
- Privacy controls for sensitive answers

These are future notes only. None of this is required to ship the current onboarding shell.

---

## 9. Implementation Recommendation

Next technical step after this blueprint (not in this PR):

1. Design a minimal `compatibility_answers` table in Supabase
2. Map each MVP question to a stable question key
3. Update `/onboarding` to save answers for logged-in users
4. Keep scoring, matching, and discovery turned off
5. Show progress and completion state on `/app`
6. Reuse existing profile fields where overlap already exists (for example relationship goal and faith importance) instead of duplicating data carelessly

Do not do that work yet. This document is the planning source of truth first.

Suggested sequence after the blueprint is approved:

1. Approve MVP question set
2. Add schema for answers only
3. Persist onboarding placeholders as real answers
4. Add lightweight completion tracking
5. Only then design V1 filtering and explanations

---

## Current Product Context

Already complete and should remain untouched by this blueprint:

- Marketing site
- Auth, login, signup, protected routes
- Profiles, photo upload, profile preview
- Onboarding shell at `/onboarding`
- `/app` onboarding entry point

Out of scope for this blueprint:

- Compatibility engine implementation
- Scoring code
- Matching
- Messaging
- Discovery
- Swiping
- Payments
- Database migrations
- Production UI changes
