---
description: Design new features or plan architectural changes
---

# /design Workflow

## When to Use
- Planning new game features (crops, mechanics, UI)
- Architectural changes or refactoring
- Making significant design decisions

## Steps

1. **Understand Requirements**
   - Clarify the user's goals
   - Identify affected systems/files
   - Note any constraints

2. **Research Existing Code**
   - Review relevant modules in `src/`
   - Check `constants.js` for game data
   - Understand current state shape

3. **Create Design Document**
   - Write to `.agent/artifacts/design-[feature].md`
   - Include:
     - Problem statement
     - Proposed solution
     - Files to modify/create
     - State changes needed
     - UI changes if applicable

4. **Request User Approval**
   - Use `notify_user` with design doc path
   - Wait for feedback before implementing

## Output
- Design document in `.agent/artifacts/`
- Clear implementation steps for `/build` workflow
