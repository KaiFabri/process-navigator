# Editor UX Specification (Canvas)

## Layout
- Swimlanes are vertical containers
- Nodes live INSIDE lanes
- Canvas uses free positioning (x/y stored)

## Interactions
- Add Lane (above / below)
- Drag Lane to reorder
- Add Node inside Lane
- Drag Node within Lane
- Draw Edge via handles
- Select Node/Edge → Inspector panel opens

## Inspector (Right Panel)
Node:
- Title
- Type
- Checklist items
- Decision buttons (labels)
- JoinGroupKey (read-only if auto-generated)

Edge:
- Label
- Target node
- JoinGroupKey

## Draft vs Publish
- Draft: allow invalid graphs
- Publish: must pass all validations
