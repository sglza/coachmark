# Releases

Coachmark uses Changesets to collect release notes and version bumps across pull requests. Adding a changeset does not publish a release.

## Adding a change

For a user-facing fix, feature, or breaking change, run:

```sh
pnpm changeset
```

Choose `coachmark`, select a patch, minor, or major bump, and write a release note describing the change for users. Commit the generated `.changeset/*.md` file with the implementation.

For example, a bug fix could have this changeset:

```md
---
"coachmark": patch
---

Keep the active step aligned with its target when the page scrolls.
```

Documentation, tests, and tooling changes that do not affect the published library do not need a changeset. The Changesets setup itself intentionally has no release changeset.

To inspect the pending release without changing versions or publishing:

```sh
pnpm changeset status
```

`status` also checks the branch diff against `main`, so it can report changed packages without changesets on a tooling-only branch. That message does not schedule a release.

## Grouping and shipping changes

1. Merge feature and fix PRs, including their changesets, into `main`.
2. The release workflow creates or updates a draft `chore: release coachmark` PR. It combines the pending changesets into a version bump and `CHANGELOG.md` entries. Multiple changesets are grouped into one release; they do not each create a new version.
3. Leave that PR in draft while work is in progress. New changesets merged to `main` update the PR. The workflow keeps it in draft until the batch is ready.
4. When ready, review the version and release notes, mark the PR ready, and merge it. This is the publishing trigger.
5. The next release workflow runs checks and builds through `prepublishOnly`, publishes the new version to npm, and creates the git tag and GitHub release.

Ordinary merges with pending changesets only update the release PR. With no pending changesets and the current version already on npm, the workflow has nothing to publish. Installing Changesets does not bump `0.1.1` or create a new release.

`pnpm version-packages` and `pnpm release` are automation commands. Do not run them to add a change: the first consumes the changesets and changes the version; the second publishes unpublished versions.

## One-time service setup

The workflow can be committed before these settings are enabled. Configure them before the first release:

- In the GitHub repository's **Settings → Actions → General → Workflow permissions**, enable **Allow GitHub Actions to create and approve pull requests** so Changesets can maintain its release PR.
- In the npm settings for `coachmark`, add a GitHub Actions trusted publisher with owner **sglza**, repository **coachmark**, and workflow filename **release.yml**. Leave the environment name empty and allow direct `npm publish`. The workflow uses OIDC instead of an `NPM_TOKEN` secret, and npm generates provenance for the public package.
- Configure npm trust when the first release is ready: new trusted publisher configurations must complete their first publish within two days or they expire. Do not publish a version just to activate this setup.

Changesets 2 and its v1 GitHub Action preserve compatibility with this repository's pnpm 9 and Node 20 development setup. The release runner uses Node 24 and npm 11 for trusted publishing. pnpm 9 delegates publishing to the installed npm CLI.

See the [Changesets v2 action documentation](https://github.com/changesets/action/tree/maintenance/v1) and [npm trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/).
