CodexGuardian Tracking
======================

This folder contains the CodexGuardian state and task tracking files.

- `codex-tasks.json`: Persistent task database (completed, inProgress, remaining)
- `codex-checkpoint.json`: Last checkpoint snapshot for resume capability
- `codex-state.json`: Aggregate metrics and logs
- `codex-cli.js`: Lightweight CLI to inspect and update progress

Run via npm script:

  npm run codex -- <command>

Examples:

- `npm run codex -- start --resume-from-checkpoint`
- `npm run codex -- status --detailed`
- `npm run codex -- show --remaining --by-priority`
- `npm run codex -- add-task --description "Test payment integration" --priority HIGH --category integration`
- `npm run codex -- test --feature "user-authentication" --verbose`

