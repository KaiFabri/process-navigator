# Process Navigator — Cursor Kickstart (Builder First)

This repository builds the **Process Navigator** MVP.

Mode: **Builder First (Option A)**  
Frontend: **Next.js (App Router)**  
Source of truth: **Airtable (via API / MCP)**  
Process logic: **Parallel execution with AND-Join (stress-test mode)**

Cursor must:
- Treat Airtable as canonical data source
- Follow the implementation order in `06_IMPLEMENTATION_TASKLIST.md`
- Respect all constraints in `01_PRINCIPLES_AND_SCOPE.md`
- Never invent new concepts without checking existing schema/docs

Terminology (important):
- Process = blueprint
- ProcessVersion = frozen executable version
- Node = process step / decision / join
- Edge = directed connection between nodes
- WorkItem = runtime execution unit of a Node
- ChecklistItem = sub-task inside a WorkItem

Non-goals:
- No CRM, no ERP, no billing
- No advanced BPMN
- No inbound email parsing (yet)

Start here, then open:
1. 01_PRINCIPLES_AND_SCOPE.md
2. 06_IMPLEMENTATION_TASKLIST.md
