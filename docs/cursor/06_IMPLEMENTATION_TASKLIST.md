# Implementation Order — Builder First

## Phase 1 — Foundations
1. Airtable client wrapper
2. Typed access layer
3. Event + idempotency helper

## Phase 2 — Builder
4. CRUD: Processes, Versions
5. CRUD: Lanes
6. CRUD: Nodes
7. CRUD: Edges
8. Canvas rendering
9. Inspector panel
10. Draft save

## Phase 3 — Publish
11. Validation engine
12. Publish action
13. Freeze ProcessVersion

## Phase 4 — Minimal Runtime (smoke test)
14. Start Case
15. Create initial WorkItems
16. Render WorkItems list

STOP HERE.
Do NOT add integrations.
