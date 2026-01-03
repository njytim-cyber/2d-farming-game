---
description: Workflow orchestrator - matches user intent to specific workflows
---

# Workflow Orchestrator

This document helps route natural language requests to the appropriate workflow.

## Intent Matching

| User Says... | Workflow |
|-------------|----------|
| "design", "plan", "feature", "architecture", "how should I" | `/design` |
| "build", "implement", "code", "develop", "create", "add" | `/build` |
| "test", "verify", "check", "validate" | `/test` |
| "debug", "fix", "broken", "error", "not working", "bug" | `/debug` |
| "run", "start", "play", "dev", "launch" | `/run` |
| "deploy", "publish", "ship", "release" | `/deploy` |
| "visual", "graphics", "polish", "lighting", "interior", "decor" | `/visual-polish` |

## Workflow Descriptions

### /design
**Purpose**: Plan new features or architectural changes before implementation.
**Output**: Design document with proposed changes, user approval required.
**Use when**: Adding significant new functionality, refactoring, or making design decisions.

### /build
**Purpose**: Implement features following an approved design.
**Output**: Working code with tests.
**Use when**: You have a clear plan and are ready to code.

### /test
**Purpose**: Run automated tests and verify functionality.
**Output**: Test results, coverage report.
**Use when**: After making changes or before deployment.

### /debug
**Purpose**: Diagnose and fix issues.
**Output**: Root cause analysis, fix implementation.
**Use when**: Something is broken or not working as expected.

### /run
**Purpose**: Start the development server.
**Output**: Running game at localhost:3000.
**Use when**: You want to play or test the game locally.

### /deploy
**Purpose**: Deploy to production (Netlify).
**Output**: Live URL.
**Use when**: Ready to publish changes.

### /visual-polish
**Purpose**: Enhance the visual quality of game scenes (Lighting, Flooring, Depth, VFX).
**Output**: Code changes for rendering systems and shaders.
**Use when**: User requests better graphics, atmosphere, or visual overhaul.

## Chaining Workflows

Common workflow chains:
1. **New Feature**: `/design` → `/build` → `/test` → `/deploy`
2. **Bug Fix**: `/debug` → `/test` → `/deploy`
3. **Quick Check**: `/run` → `/test`
