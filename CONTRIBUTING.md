# Contributing to TanStack Realtime

Thanks for your interest in contributing! Please read this guide before opening an issue or pull request.

## Repository structure

This is an npm workspace monorepo containing three packages:

| Directory | Package |
|---|---|
| `packages/realtime` | `@tanstack/realtime` — core client and types |
| `packages/react-realtime` | `@tanstack/react-realtime` — React hooks and provider |
| `packages/realtime-preset-node` | `@tanstack/realtime-preset-node` — WebSocket transport + Node.js server |
| `packages/__tests__` | Integration test suite (not published) |

## Development setup

**Requirements:** Node.js ≥ 20, npm ≥ 10

```bash
# 1. Fork and clone
git clone https://github.com/<your-fork>/realtime.git
cd realtime

# 2. Install dependencies (npm workspaces)
npm install

# 3. Build all packages
npm run build

# 4. Run the test suite
npm test
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
   npm test
   ```
4. Build all packages and check for type errors:
   ```bash
   npm run build
   ```

## Commit messages

Use the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat: add reconnect limit option to nodeTransport
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
