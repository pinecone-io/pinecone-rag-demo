# Security notes

This project pins transitive dependencies to patched versions in
[`pnpm-workspace.yaml`](./pnpm-workspace.yaml) (`overrides`) to clear advisories
that direct-dependency bumps don't cover. CI fails on any **high** or **critical**
advisory (`pnpm audit --audit-level high` in [`ci.yml`](./.github/workflows/ci.yml)).

## Re-auditing

```bash
pnpm audit
```

## Remediation summary

Reduced from 52 advisories (18 high) to 3 (0 high). Fixes applied:

- **Direct bumps:** `next` → `^15.5.23`, `uuid` → `^11` (removed the now-redundant
  `@types/uuid` stub).
- **Overrides added:** `braces`, `brace-expansion@1`/`@2`, `micromatch`,
  `cross-spawn`, `nanoid`, `postcss`, `@babel/runtime`, `mdast-util-to-hast`,
  `jsondiffpatch`, `qs`, `yaml`, `js-yaml@4`, `sharp`, `undici`, plus `solid-js`
  and `svelte` (unused framework adapters pulled in transitively by `ai@3`).

## Known residuals

These require major upgrades and are deferred to dedicated PRs (each needs its own
regression pass):

| Advisory | Severity | Fix requires |
| --- | --- | --- |
| `ai` (filetype whitelist bypass) | low | `ai` 3 → 5 (breaking API change) |
| `@ai-sdk/provider-utils` (resource consumption) | low | `ai` 3 → 5 |
| `ajv` (ReDoS via `$data`) | moderate | `eslint` 8 → 9 (`ajv` 6 is pinned by eslint 8; dev-only) |
