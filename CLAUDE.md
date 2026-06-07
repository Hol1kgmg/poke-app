# Project Overview
{プロジェクトの概要を記述 (例: Dotfiles management project for macOS using Nix and Home-Manager)}

# Setup and Basic Usage
Setup instructions and basic usage are documented in [README.md](./README.md).

# Directory Structure
{※ディレクトリ構造のドキュメントが不要な場合はこのセクションごと削除}
See [{DIRECTORY_STRUCTURE_FILE}.md](./{DIRECTORY_STRUCTURE_FILE}.md) for details.

# Troubleshooting
{※トラブルシューティングのドキュメントが不要な場合はこのセクションごと削除}
- Setup and daily usage issues: See [{TROUBLESHOOTING_FILE}.md](./{TROUBLESHOOTING_FILE}.md)

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
- Never use `cd` in Bash commands. Use tool-specific directory flags instead:
  - pnpm → `pnpm <command>`
  - git → `git <command>`
- Never use `grep`, `find`, `cat`, `sed`, or `awk` in Bash. Use dedicated tools (`Grep`, `Glob`, `Read`, `Edit`) instead.

# Language Settings
- Responses: {Japanese|English|その他の言語}
- Thinking: English (for token reduction)
