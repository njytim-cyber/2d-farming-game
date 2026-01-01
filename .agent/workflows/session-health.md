---
description: Custom rules for agentic coding sessions including session health metrics
---

# Session Health & Handoff Guidelines

## Session Health Indicators (Add to Response Footer)

When working on complex multi-step tasks, include a session health check at the end of significant milestones:

```
📊 Session Health:
- Context Used: [estimate %]
- Tasks Completed: [X/Y]
- Complexity Level: [Low/Medium/High]
- Recommended: [Continue/Consider Handoff/Handoff Recommended]
```

## Handoff Triggers

Consider starting a new session when:

1. **Context Saturation** (~80%+ context used)
   - Many large files have been viewed
   - Multiple back-and-forth debugging cycles
   - Complex refactoring spanning 10+ files

2. **Scope Creep** 
   - Original task significantly expanded
   - 5+ unrelated feature requests added
   - Major architectural changes mid-task

3. **Error Accumulation**
   - 3+ failed attempts at same fix
   - Repeated misunderstanding of codebase
   - Circular debugging (trying same things)

4. **Time/Complexity Threshold**
   - Session exceeds 20+ task boundary changes
   - 100+ tool calls in single session
   - Major mode switches (planning→execution→planning→execution)

## Handoff Protocol

When handoff is recommended:

1. Create `handoff_notes.md` artifact summarizing:
   - What was accomplished
   - What remains to be done
   - Key files and their purposes
   - Known issues or blockers

2. Update `task.md` with current progress

3. Commit any work-in-progress with clear messages

4. Suggest specific next prompt for new session

## Quality Signals

**Good Session Health:**
- Linear progress through task checklist
- Few backtracking/correction cycles
- Clear understanding of codebase context

**Degraded Session Health:**
- Repeated viewing of same files
- Conflicting edits or rollbacks
- Losing track of earlier decisions
