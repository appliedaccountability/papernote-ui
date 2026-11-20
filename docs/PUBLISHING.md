---
argus-artifact-id: 01M2HPEJ6MXR3W20RXGMEAMATV
---

# Publishing Guide for @papernote/ui

This document explains how to publish new versions of the @papernote/ui package to npm.

## Prerequisites

### One-Time Setup

Publishing uses npm trusted publishing (OIDC): GitHub Actions proves to npm which repository and
workflow it is running, and no npm token is stored anywhere. The trusted publisher is configured on
the package's settings page, https://www.npmjs.com/package/@papernote/ui/access, and names:

| Field | Value |
|---|---|
| Publisher | GitHub Actions |
| Organization or user | `appliedaccountability` |
| Repository | `papernote-ui` |
| Workflow filename | `npm-publish-tag.yml` |
| Environment | none |
| Allowed actions | `npm stage publish` only |

The publisher is fixed once created. If the repository moves or the workflow is renamed, delete it
and add a new one; saving needs the maintainer's security key. The repository moved from
`kwhittenberger` to `appliedaccountability`, and until the publisher was re-created every publish
failed with E404.

## Publishing Methods

You have two automated publishing options:

### Option 1: GitHub Release (Recommended)

This is the easiest and most user-friendly method.

1. **Run pre-publish validation** (optional but recommended)
   ```bash
   npm run prerelease
   ```
   This checks for uncommitted changes, runs type check, linting, build, and verifies the version doesn't already exist.

2. **Update version in package.json**
   ```bash
   npm version patch  # 1.0.0 → 1.0.1
   npm version minor  # 1.0.0 → 1.1.0
   npm version major  # 1.0.0 → 2.0.0
   ```

3. **Push the version commit and tag**
   ```bash
   git push && git push --tags
   ```

4. **Create a GitHub Release**
   - Go to https://github.com/appliedaccountability/papernote-ui/releases/new
   - Click "Choose a tag" and select the tag you just pushed (e.g., `v1.0.1`)
   - Title: `v1.0.1` (or whatever version)
   - Description: Write release notes describing what changed
   - Click "Publish release"

5. **Automated Publishing**
   - The `npm-publish.yml` workflow will automatically trigger
   - It will verify versions match, run type checks, linting, build verification, and publish to npm
   - Check the Actions tab to monitor progress: https://github.com/appliedaccountability/papernote-ui/actions

### Option 2: Git Tag

This method is faster but skips the release notes on GitHub.

1. **Run pre-publish validation** (optional but recommended)
   ```bash
   npm run prerelease
   ```

2. **Update version and create tag**
   ```bash
   npm version patch  # Creates commit and tag
   git push && git push --tags
   ```

3. **Automated Publishing**
   - The `npm-publish-tag.yml` workflow will automatically trigger
   - It includes the same safety checks as the release workflow
   - Check the Actions tab to monitor: https://github.com/appliedaccountability/papernote-ui/actions

### Approving a staged release

Both options above stage the release rather than publishing it. The workflow runs
`npm stage publish`, and the version stays out of the registry until a maintainer approves it with
2FA. A tag push alone cannot put a release in front of users, which is the point: a compromised
workflow or GitHub token can stage a version but not ship it. The run ends with an
"Approve @papernote/ui@x.y.z" notice when staging succeeds.

```bash
npm login                          # as khittenberger
npm stage list @papernote/ui       # find the stage id
npm stage view <stage-id>          # optional: inspect it
npm stage download <stage-id>      # optional: unpack and look at the tarball
npm stage approve <stage-id>       # publishes it, under the dist-tag the workflow chose
npm stage reject <stage-id>        # or throw it away
```

Approval cannot run in CI; npm requires an interactive login for it.

### Option 3: Manual Publishing

Not for regular releases. It needs a logged-in maintainer, publishes without provenance, and
skips every check the workflow runs.

1. **Update version**
   ```bash
   npm version patch
   ```

2. **Build and publish**
   ```bash
   npm run build
   npm publish --access public
   ```

3. **Push to GitHub**
   ```bash
   git push && git push --tags
   ```

## Version Numbering

Follow [Semantic Versioning (SemVer)](https://semver.org/):

- **MAJOR** (1.0.0 → 2.0.0): Breaking changes that require user code updates
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes, backward compatible

## Workflow Safety Features

Both automated workflows include comprehensive safety checks:

1. **Version Verification**
   - Ensures package.json version matches the git tag/release version
   - Prevents publishing mismatched versions

2. **Code Quality Checks**
   - Type checking with TypeScript
   - Linting with ESLint
   - All must pass before publishing

3. **Build Verification**
   - Verifies all required dist files exist (index.js, index.esm.js, index.d.ts, styles.css)
   - Ensures the build is complete and valid

4. **Publication Verification**
   - Confirms the package was successfully published to npm
   - Provides clear success/failure messages

5. **npm Provenance**
   - Includes cryptographic provenance for supply chain security
   - Proves the package was built by GitHub Actions

## Pre-Release Checklist

Before publishing a new version:

- [ ] Run validation: `npm run prerelease` (recommended)
- [ ] All tests pass: `npm test`
- [ ] Type checking passes: `npm run typecheck`
- [ ] Linting passes: `npm run lint`
- [ ] Build succeeds: `npm run build`
- [ ] Storybook builds: `npm run build-storybook`
- [ ] Update CHANGELOG.md with changes (if you create one)
- [ ] Update README.md if there are new features or breaking changes
- [ ] Commit all changes to git
- [ ] No uncommitted changes in working directory

## Troubleshooting

### Workflow fails with E404 on publish

npm answers 404 when it does not recognize the publisher. The trusted publisher on npm must name
this repository and `npm-publish-tag.yml` exactly; see One-Time Setup. The package.json
`repository` field must also name `appliedaccountability/papernote-ui`, because npm checks
provenance against it.

### Workflow fails with EBADENGINE upgrading npm

The workflow pins npm 11 because npm 12 needs Node 22 or later and the job runs Node 20. If the
Node version is raised, the pin can follow.

### A release moved a dist-tag the wrong way

The "Determine dist-tag" step gives `latest`, or `legacy-vN` for an older major, only to a version
that is the newest there; anything older gets `legacy-vN.M`. To put a tag back by hand:
`npm dist-tag add @papernote/ui@<version> <tag>` from a logged-in terminal.

### Build Fails in Workflow

- Run `npm run build` locally to debug
- Ensure all dependencies are in package.json
- Check the Actions logs for specific error messages

## Monitoring Published Versions

- **npm Registry**: https://www.npmjs.com/package/@papernote/ui
- **GitHub Releases**: https://github.com/appliedaccountability/papernote-ui/releases
- **GitHub Actions**: https://github.com/appliedaccountability/papernote-ui/actions

## Updating Consumer Projects

After publishing a new version, update projects that use @papernote/ui:

```bash
# In your project directory
npm update @papernote/ui

# Or install specific version
npm install @papernote/ui@1.0.1
```

## Emergency Unpublish

If you need to unpublish a version (only possible within 72 hours):

```bash
npm unpublish @papernote/ui@1.0.1
```

**Warning**: This is strongly discouraged as it can break projects depending on that version.

## Best Practices

1. **Always test before publishing** - Run the full test suite locally
2. **Write meaningful release notes** - Help users understand what changed
3. **Follow SemVer strictly** - Users depend on it for upgrade decisions
4. **Don't skip versions** - Publish sequentially (1.0.1 → 1.0.2, not 1.0.1 → 1.0.5)
5. **Tag releases in git** - Maintains version history
6. **Update documentation** - Keep README and docs in sync with code
7. **Review the diff** - Check what's being published before releasing

## Support

For issues with publishing or the package:
- GitHub Issues: https://github.com/appliedaccountability/papernote-ui/issues
- npm Support: https://www.npmjs.com/support
