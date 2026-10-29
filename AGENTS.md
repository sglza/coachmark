# Repository instructions

Read [CONTRIBUTING.md](CONTRIBUTING.md) before drafting, filing, or triaging issues. It is the source of truth for issue contribution rules, including work performed by agents.

- Keep each issue focused on one independently addressable problem or requested outcome. Link related issues instead of combining unrelated topics.
- Keep multiple examples of the same problem together when they help establish its scope. Do not split observations and possible solutions into separate issues automatically.
- Distinguish reported symptoms, verified behavior, and hypotheses about the cause. Do not present a suspected diagnosis as a confirmed bug.
- When proposing a breakdown of a broad report, preserve its original context and give each follow-up enough information to stand alone.

## Branch naming

Use a Conventional Commit type as the branch prefix, followed by a short kebab-case description: `<type>/<description>`.

Examples:

- `feat/spotlight-target-interaction`
- `fix/tour-completion-callbacks`
- `docs/interaction-api`
- `chore/update-dependencies`

Other appropriate types include `refactor`, `test`, `perf`, `build`, `ci`, `style`, and `revert`. Choose the type that describes the main purpose of the change.

Do not use tool-specific prefixes such as `t3/` or `codex/`. If tooling creates a branch with such a prefix, rename it before pushing or opening a pull request.
