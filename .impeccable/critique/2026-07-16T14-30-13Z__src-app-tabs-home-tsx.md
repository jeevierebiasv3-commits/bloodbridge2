---
target: src/app/(tabs)/home.tsx
total_score: 26
p0_count: 0
p1_count: 3
timestamp: 2026-07-16T14-30-13Z
slug: src-app-tabs-home-tsx
---
# Critique: Home Dashboard (src/app/(tabs)/home.tsx)

## Design Health Score: 26/40 (Solid, with a hierarchy problem)

| # | Heuristic | Score |
|---|-----------|-------|
| 1 | Visibility of System Status | 3 |
| 2 | Match System / Real World | 2 |
| 3 | User Control and Freedom | 3 |
| 4 | Consistency and Standards | 3 |
| 5 | Error Prevention | 3 |
| 6 | Recognition Rather Than Recall | 4 |
| 7 | Flexibility and Efficiency | 3 |
| 8 | Aesthetic and Minimalist Design | 2 |
| 9 | Error Recovery | n/a |
| 10 | Help and Documentation | 3 |

## Anti-Patterns Verdict
Partially AI-looking. Code craft is strong; screen COMPOSITION is the tell: 7 equal-weight stacked sections. Hero-metric template in "Your impact" card. Eyebrow density in hero (3 uppercase-tracked labels). detect.mjs clean (0) but low-signal for RN. No browser overlay (RN, no HTML entry).

## Priority Issues
- [P1] "lives touched" is fabricated: donations units * 3 (home.tsx:72,173). Trust/anti-guilt violation. Label honestly or drop.
- [P1] Flat hierarchy buries the next action: 9 FadeIn sections at near-equal weight (home.tsx:160-317). Violates principle #1. Establish weight ladder.
- [P1] "Find Banks"/"Near you" routes to /(tabs)/feed (emergency requests), not a bank finder (home.tsx:35). Match-to-real-world failure. Reroute or relabel.
- [P2] Impact card is the banned hero-metric template (home.tsx:162-178); "blood type" as a stat is odd. Make it one honest human line.
- [P3] Hardcoded #FFFFFF in notificationDot (home.tsx:373) vs theme.onColor; DESIGN.md forbids. Plus eyebrow density.

## Persona Red Flags
- Maya (first-timer): "Find Banks" misroute; can't tell primary action; "0 lives touched" deflating empty state.
- David (returning eligible): best served by hero flow; urgent compatible request buried below stats.

## Minor Observations
- greeting().toLowerCase().replace('good ','') fragile round-trip (home.tsx:95).
- No RefreshControl on home (feed has one).
- mockCenters[0] assumes non-empty.
- Announcements/center sit below emergency feed; arguably backwards.

## Questions
- Hero as the ONLY prominent thing, rest a calm list?
- Does "Your impact" belong on home or profile/donor tab?
- Should an urgent compatible request outrank "book a donation" in the hero?
- Honest version of impact without x3?
