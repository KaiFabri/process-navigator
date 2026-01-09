# API & Server Actions (Next.js)

All mutations are server-side.
Client never mutates Airtable directly.

## Builder APIs
- createProcess()
- createProcessVersion()
- addLane()
- addNode()
- updateNodePosition()
- addEdge()
- publishProcessVersion()

## Runtime APIs
- startCase(processVersionId)
- completeChecklistItem(workItemId, checklistItemId)
- resolveDecision(workItemId, edgeId)

## Idempotency
All runtime mutations must:
- generate an idempotency key
- write an Event record BEFORE mutation
- abort if key already exists
