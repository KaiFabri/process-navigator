# Airtable Schema — Builder First

## Blueprint Tables

### Processes
- Name (text)
- Status (Draft | Published | Archived)
- PublishedVersion (link → ProcessVersions)

### ProcessVersions
- Process (link)
- Version (string or number)
- Status (Draft | Published)
- PublishedAt (datetime)

### Lanes
- ProcessVersion (link)
- Name (text)
- Order (number)
- Role (text)

### Nodes
- ProcessVersion (link)
- Lane (link)
- Type (Start | Step | Decision | Join | End)
- Title (text)
- UI_X (number)
- UI_Y (number)
- JoinPolicy (AND only)
- DecisionMode (Manual)
- OrderHint (number, optional)

### Edges
- ProcessVersion (link)
- FromNode (link → Nodes)
- ToNode (link → Nodes)
- Type (Sequence | Decision)
- Label (text)
- JoinGroupKey (text)

### StepChecklistTemplates
- Node (link → Nodes)
- Text (text)
- Order (number)

### GateTemplates
- ProcessVersion (link)
- FromNode (link)
- ToNode (link)
- Title (text)

### GateTemplateItems
- GateTemplate (link)
- Text (text)
- Order (number)

## Runtime Tables

### Cases
- ProcessVersion (link)
- Status (Active | Blocked | Closed)
- StartedAt
- ClosedAt

### WorkItems
- Case (link)
- Node (link)
- Status (Active | Done | Blocked)
- JoinGroupKey (text)

### ChecklistItems
- WorkItem (link)
- Text
- Status (Open | Done)
- Order

### CaseGates
- Case (link)
- GateTemplate (link)
- Status (Open | OK)

### CaseGateItems
- CaseGate (link)
- Text
- Status (Open | Done)
- Order
