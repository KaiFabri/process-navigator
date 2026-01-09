# Publish Validation Rules

A ProcessVersion can be published only if:

1. Exactly one Start node exists
2. At least one End node exists
3. All non-End nodes have at least one outgoing Edge
4. All Decision nodes have >= 2 outgoing Edges
5. All Join nodes:
   - JoinPolicy = AND
   - All incoming edges share the same JoinGroupKey
6. No cycles (DAG only)
7. All Nodes belong to exactly one Lane

If validation fails:
- return structured error list
- do NOT publish
