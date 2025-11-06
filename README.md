# whisper-llm-cards

Distribution package for recommended LLM configurations for the Whisper App.

---

## Development

### Build

```bash
pnpm install
pnpm build
```

The build process:
1. Generates `src/version.ts` with the current package version
2. Generates `cards.json` from source data
3. Compiles TypeScript
4. Copies artifacts to `dist/`

### Test

```bash
pnpm test # `pnpm build` must be called first before `pnpm test`
```

### Lint

```bash
pnpm lint
```

## CI/CD & Versioning

This package uses **semantic-release** for automated versioning and releases.

### Commit Message Format

Use conventional commits to trigger releases:

- `feat:` - New feature (minor version bump: 1.0.0 → 1.1.0)
- `fix:` - Bug fix (patch version bump: 1.0.0 → 1.0.1)
- `perf:` - Performance improvement (patch)
- `refactor:` - Code refactoring (patch)
- `docs:` - Documentation only (no release)
- `chore:` - Maintenance tasks (no release)
- `BREAKING CHANGE:` - Breaking change (major version bump: 1.0.0 → 2.0.0)

### Workflows

- **CI** (`.github/workflows/ci.yml`) - Runs on PRs and non-main branches
  - Build, lint, and test

- **Release** (`.github/workflows/release.yml`) - Runs on main branch
  - Lint and test (with pre-bump version)
  - Runs semantic-release to:
    - Analyze commits
    - Bump version in package.json
    - Rebuild with new version (via `@semantic-release/exec`)
    - Commit package.json, CHANGELOG.md, and cards.json
    - Create git tag (e.g., v1.0.1)
    - Create GitHub Release

**Important:** The build runs twice - once for tests (pre-bump) and once during semantic-release (post-bump) to ensure built artifacts match the released version.

### Versioned URLs

Each release creates a git tag, and the built package references that version:

- Package version: `1.0.0`
- Default config URL: `https://avatechnologies.org/whisper-llm-cards/refs/tags/v1.0.0/cards.json`

This ensures consuming applications always fetch the config matching their installed package version.

## License

MIT
