# Project Overview

ポケモン相性診断アプリ（TanStack Start / React 19 / FSD）

# Setup and Basic Usage

Setup instructions and basic usage are documented in [README.md](./README.md).

# Rules

## MUST
- Always propose an implementation plan and wait for approval before starting work.
- Always append `; echo 'exit: $?'` to every Bash command to confirm success.
- Always use dedicated tools for file operations:
  - File reading → `Read`
  - File editing → `Edit`
  - File writing → `Write`
  - File search → `Glob`
  - Content search → `Grep`

## MUST NOT
- Never use `cd` in Bash commands. Use tool-specific directory flags instead.
- Never use `grep`, `find`, `cat`, `sed`, or `awk` in Bash. Use dedicated tools instead.

# Coding Standards

@.claude/rules/architecture.md
@.claude/rules/typescript.md
@.claude/rules/server-functions.md
@.claude/rules/naming.md
@.claude/rules/styling.md

# Language Settings
- Responses: Japanese
- Thinking: English (for token reduction)
