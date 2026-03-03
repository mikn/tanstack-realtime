# Contributing to TanStack Realtime

Thanks for your interest in contributing! Please read this guide before opening an issue or pull request.

## Repository structure

This is a pnpm workspace monorepo with [Nx](https://nx.dev/) for task orchestration. Published packages:

| Directory                              | Package                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------ |
| `packages/realtime`                    | `@tanstack/realtime` — core client, collection helpers, CRDTs, and types |
| `packages/react-realtime`              | `@tanstack/react-realtime` — React hooks and provider                    |
| `packages/realtime-adapter-centrifugo` | `@tanstack/realtime-adapter-centrifugo` — Centrifugo transport adapter   |
| `packages/realtime-adapter-sse`        | `@tanstack/realtime-adapter-sse` — Server-Sent Events transport adapter  |
| `packages/docs`                        | Documentation site (not published)                                       |
| `packages/__tests__`                   | Integration test suite (not published)                                   |

## Development setup

**Requirements:** Node.js ≥ 20, pnpm ≥ 10

```bash
# 1. Fork and clone
git clone https://github.com/<your-fork>/realtime.git
cd realtime

# 2. Install dependencies
pnpm install

# 3. Build all packages (uses Nx for dependency-aware builds)
pnpm build

# 4. Run the test suite
pnpm test
```

> Tests run with [Vitest](https://vitest.dev/) and are located in `packages/__tests__/`.

## Making changes

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/my-change
   ```
2. Make your changes. If you add or change public-facing behaviour, update the JSDoc in the relevant file.
3. Run the tests and make sure they all pass:
   ```bash
   pnpm test
   ```
4. Build all packages and check for type errors:
   ```bash
   pnpm build
   ```
5. Add a changeset describing your change (for versioning and changelogs):
   ```bash
   pnpm changeset
   ```

## Commit messages

Use the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add reconnect limit option to sseTransport
fix: prevent stale closure in useSubscribe
docs: correct onPresenceChange return type
test: add self-exclusion invariant for presence
```

## Opening a pull request

- Fill out the pull request template completely.
- Keep pull requests focused — one concern per PR.
- Reference any related issues (e.g. `Closes #42`).
- Make sure CI passes before requesting review.

## Reporting bugs and requesting features

Please use the issue templates on GitHub. Include a minimal reproduction when reporting a bug.

## Code of conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating you agree to abide by its terms.
