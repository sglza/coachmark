# Repository instructions

## Branch naming

Use a Conventional Commit type as the branch prefix, followed by a short kebab-case description: `<type>/<description>`.

Examples:

- `feat/spotlight-target-interaction`
- `fix/tour-completion-callbacks`
- `docs/interaction-api`
- `chore/update-dependencies`

Other appropriate types include `refactor`, `test`, `perf`, `build`, `ci`, `style`, and `revert`. Choose the type that describes the main purpose of the change.

Do not use tool-specific prefixes such as `t3/` or `codex/`. If tooling creates a branch with such a prefix, rename it before pushing or opening a pull request.
