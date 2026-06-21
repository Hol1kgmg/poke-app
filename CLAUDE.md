# Project Overview

Pokemon compatibility diagnosis app (TanStack Start / React 19 / FSD)

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

## Task Runner

Commands are managed by `Makefile` and `Taskfile`.

| File | Purpose | Target |
|---|---|---|
| `Makefile` | Commands that don't require CLI_ARGS (env setup, etc.) | Humans / CI |
| `Taskfile` | Commands that accept CLI_ARGS (AI agent interface) | Claude Code |

### Makefile (environment setup)

```
make install   # Install dependencies
make dev       # Start development server
make build     # Production build
make typecheck # TypeScript type check
make lint      # Linter
make test      # Unit tests
```

### Taskfile (development / verification)

AI agents must use only these commands — never call `pnpm` directly.

```
task dev          # Start development server
task typecheck    # TypeScript type check
task lint         # Linter
task test         # Unit tests
task build        # Production build
```

Options are passed after `--`: e.g., `task dev -- --port 3001`

## MUST NOT
- Never use `cd` in Bash commands, and never use directory flags (`--dir`, `-C`, `--cwd`, etc.) to change the working directory. Run commands from the project root as-is (e.g., `task typecheck`, `task lint`, `git status`).
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
