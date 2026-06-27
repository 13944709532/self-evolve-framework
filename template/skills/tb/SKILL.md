---
name: sync-docs
description: |
  Synchronize project documentation files (README.md, AGENTS.md, CLAUDE.md, CONTEXT.md, RULES.md) 
  to ensure consistency. This skill should be used when the user asks to "同步项目文档",
  "update project constraints", "sync-docs", or when project structure or conventions change.
---

# Sync Project Documentation (sync-docs)

Keep README.md, AGENTS.md, CLAUDE.md, CONTEXT.md, and RULES.md consistent with each other and with the current codebase state.

## Purpose

These files serve different but overlapping roles:

| File | Role | Audience |
|------|------|----------|
| README.md | Project overview & quick start | New developers |
| AGENTS.md | AI agent project guidance & build commands | AI assistants & developers |
| CLAUDE.md | AI agent constraints & rules | AI assistants |
| CONTEXT.md | Architecture decisions & history | Developers & AI |
| RULES.md | Detailed coding rules & conventions | All developers & AI |

When the project evolves (new modules, refactoring, new conventions), all may need updating.

## Process

### Step 1: Read all five files

Read README.md, AGENTS.md, CLAUDE.md, CONTEXT.md, and RULES.md.

### Step 2: Read the codebase for changes

Check for discrepancies:
- New modules in `src-tauri/src/` not listed in README project structure
- New pages in `src/pages/` not listed in README
- Build commands or dependencies that changed in package.json/Cargo.toml
- New architectural decisions since last CONTEXT.md update
- New rules or conventions since last CLAUDE.md / RULES.md update

### Step 3: Identify inconsistencies

Compare across files:
- Module lists should match across README and CLAUDE
- AGENTS.md build commands and known issues should match README.md and CONTEXT.md
- RULES.md should be the authoritative source for coding rules referenced by CLAUDE.md
- Architecture decisions in CONTEXT should reflect current state
- Version number should be consistent everywhere

### Step 4: Update files

Apply minimal targeted edits using `replace_in_file`. Priority order:
1. README.md — project structure and commands
2. AGENTS.md — project guidance, build commands, known issues
3. CLAUDE.md — module structure and rules summary
4. RULES.md — detailed coding rules and conventions
5. CONTEXT.md — ADR records and known issues

### Step 5: Commit

`docs: sync README/AGENTS/CLAUDE/CONTEXT/RULES after project changes`
