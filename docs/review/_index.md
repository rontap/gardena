# Docs review

A check of every note under `docs/` (except `plans/`, `agents/`, and the standards other than `user-facing-text.md`) against the code in the working tree on 2026-09-23 and against the unit and e2e tests. All 642 unit tests passed on that tree, so where a test and a note disagree, the test matches the code.

## How to use

Open each file and tick the true line in each question. Tick **none** and write the true rule under it when no line is true. In **Code only**, tick whether the behaviour is intended. In **Agreed**, tick a line to confirm it; leave it unticked if it is wrong and add a line under it.

The ticked files are the baseline for rewriting `docs/`. Proposed layout for the rewrite: [[structure-proposal]].

## Files

| file | disagreements | doc only | code only | agreed |
|---|---|---|---|---|
| [[docs-review-feature-market]] | 16 | 2 | 3 | 19 |
| [[docs-review-feature-contracts]] | 15 | 1 | 4 | 25 |
| [[docs-review-feature-machines]] | 12 | 1 | 4 | 22 |
| [[docs-review-feature-research-family-expansion]] | 11 | 2 | 3 | 14 |
| [[docs-review-feature-necronomicon-tutorial]] | 5 | 0 | 2 | 14 |
| [[docs-review-feature-plants-soil]] | 9 | 1 | 5 | 38 |
| [[docs-review-feature-trees]] | 4 | 1 | 2 | 20 |
| [[docs-review-feature-water]] | 5 | 0 | 3 | 19 |
| [[docs-review-feature-weeds-burrow-enclosure]] | 3 | 0 | 3 | 24 |
| [[docs-review-feature-weather-day]] | 2 | 0 | 3 | 21 |
| [[docs-review-feature-inventory-build]] | 11 | 1 | 3 | 28 |
| [[docs-review-feature-sensors]] | 6 | 2 | 5 | 36 |
| [[docs-review-feature-vehicles]] | 13 | 2 | 8 | 36 |
| [[docs-review-feature-hud-notices-inspect]] | 9 | 0 | 7 | 44 |
| [[docs-review-feature-menus-lens-almanac]] | 12 | 1 | 4 | 30 |
| [[docs-review-feature-multiplayer-log]] | 8 | 1 | 8 | 25 |
| [[docs-review-feature-engine]] | 12 | 5 | 7 | 19 |
| [[docs-review-feature-view-art]] | 7 | 1 | 1 | 12 |
| [[docs-review-feature-player-text]] | 34 | 2 | 8 | 20 |
| **total** | **194** | **23** | **83** | **466** |

## Possible bugs, not stale notes

From code reading; no test covers these.

- Weather pinned from the Cheat panel is not in the save a resync sends, so a guest's digest should disagree with the host's the next day — [[docs-review-feature-engine]] question 19.
- The object HUD target is one field for the whole farm, so a sensor or sprinkler panel opened by one seat opens on every seat — [[docs-review-feature-engine]] question 20.
- A `#start_now` / `?start=now` farm writes the save slot at its first day end — [[docs-review-feature-engine]] question 1.
