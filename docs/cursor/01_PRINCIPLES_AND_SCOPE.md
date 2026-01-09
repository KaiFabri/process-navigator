# Principles & Scope (Hard Rules)

## Core Principles
1. Builder and Runtime must be separate concepts.
2. Layout (canvas positions) is NEVER process truth.
3. Edges define execution, not visual proximity.
4. Parallelism is allowed, but ONLY with AND-Join.
5. Processes are versioned; running cases are frozen.
6. Idempotency is mandatory for all runtime mutations.

## MVP Scope
IN:
- Canvas-based process builder (lanes, nodes, edges)
- Draft / Publish lifecycle
- Start process instance (Case)
- Parallel execution
- AND-Join
- Manual decisions
- Checklist-based step completion

OUT (explicitly):
- OR-Join
- Cycles / loops
- Inbound email automation
- Rule DSL for decisions (manual only)
- Multi-tenant permissioning
- SLA / timers

## Guardrails
- If a feature increases state ambiguity, it is postponed.
- If Cursor is unsure: STOP and ask.
