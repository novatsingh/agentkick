# Release Checklist

Use this checklist before publishing AgentKick.

## Release Gates

Run from the repository root:

```bash
npm run check
npm run build
npm run smoke
node dist/index.js --help
node dist/index.js doctor --json
npm pack --dry-run
```

On Windows PowerShell, prefer:

```bash
npm.cmd run check
npm.cmd run build
npm.cmd run smoke
npm.cmd pack --dry-run
```

If the default npm cache path fails locally, use a temporary cache:

```bash
npm.cmd pack --dry-run --cache C:\tmp\npm-cache-agentkick
```

## Dist Policy

- `dist/` is the published CLI output and must be regenerated with `npm run build` before release.
- The npm package entrypoint is `dist/index.js`.
- The executable bin path is `dist/index.js`.
- Do not edit files in `dist/` by hand.
- Verify `dist/index.js` has the CLI shebang after build.

## Package Review

- Confirm `package.json` name, version, description, bin, files, Node engine, repository, and keywords.
- Confirm README install instructions are honest about npm publishing state.
- Confirm `CHANGELOG.md` describes the version being released.
- Confirm `CONTRIBUTING.md` commands match `package.json`.
- Confirm no secrets, local credentials, private projects, or personal-only files are included.

## Publish Steps

Do not publish from an unverified working tree.

1. Run all release gates.
2. Inspect `npm pack --dry-run` output.
3. Update `CHANGELOG.md`.
4. Bump `package.json` version if needed.
5. Commit release changes.
6. Create a git tag, for example `v0.1.0`.
7. Run `npm publish --dry-run` if publishing to npm.
8. Publish only after the dry-run package contents look correct.

