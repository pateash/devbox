# DevBox CI/CD Pipeline Guide

DevBox uses GitHub Actions for continuous integration, code quality validation, and automated macOS packaging and distribution.

---

## Workflows Overview

| Workflow          | File                                                                | Triggers                                   | Runner(s)                                | Key Actions                                                                |
| ----------------- | ------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------- |
| **CI**            | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)           | `pull_request` (main), `push` (main)       | `ubuntu-latest`                          | Typecheck, lint, Vitest unit tests, production bundle build                |
| **Release macOS** | [`.github/workflows/release.yml`](../.github/workflows/release.yml) | `release` (published), `workflow_dispatch` | `macos-latest` (arm64), `macos-13` (x64) | Electron DMG packaging, optional code signing & notarization, asset upload |

---

## 1. Continuous Integration (`ci.yml`)

The CI workflow validates every pull request and commit to `main`.

### Validation Steps

1. **Node.js 22 LTS**: Installs Node 22 with automatic dependency caching (`cache: 'npm'`).
2. **Clean Dependency Install**: Runs `npm ci`.
3. **Typecheck**: Executes `npm run typecheck` (`tsc --noEmit`).
4. **Lint**: Executes `npm run lint` (`eslint . --max-warnings=0`).
5. **Unit Tests**: Executes `npm test` (`vitest run`).
6. **Production Bundle Verification**: Executes `npm run build` (`electron-vite build`) to confirm that main, preload, and renderer packages compile cleanly without bundle errors.

### Concurrency

Pull requests automatically cancel any in-progress runs when a new commit is pushed to save GitHub Actions compute minutes:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

---

## 2. macOS Release Workflow (`release.yml`)

The release workflow packages DevBox into standalone macOS DMG installers.

### Architecture Matrix

Because DevBox includes native C++ modules (`better-sqlite3`), packaging requires matching host architectures to compile native bindings without emulator discrepancies:

- **Apple Silicon (`arm64`)**: Built on `macos-latest` (Apple Silicon M-series runner).
- **Intel (`x64`)**: Built on `macos-13` (macOS Intel runner).

### Artifacts Produced

- `dist/DevBox-<version>-arm64.dmg` (+ `.dmg.blockmap`)
- `dist/DevBox-<version>-x64.dmg` (+ `.dmg.blockmap`)

When triggered by publishing a GitHub Release, these files are automatically attached directly to the release via the GitHub CLI (`gh release upload`).

---

## 3. Code Signing & Notarization

The workflow supports **conditional code signing and notarization**:

- If Apple Developer credentials are configured as GitHub repository secrets, the app is signed with your Developer ID and notarized by Apple.
- If secrets are not present, the workflow automatically falls back to generating unsigned/ad-hoc DMGs without failing the build.

### Required GitHub Secrets for Apple Signing

To enable signing and notarization, configure the following secrets in your repository settings (**Settings > Secrets and variables > Actions**):

| Secret Name                   | Description                                                                     | Source                                                            |
| ----------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `CSC_LINK`                    | Base64-encoded string of your Apple Developer ID Application `.p12` certificate | Export from Keychain Access, then `base64 -i cert.p12 \| pbcopy`  |
| `CSC_KEY_PASSWORD`            | Password protecting the `.p12` certificate file                                 | Set during certificate export                                     |
| `APPLE_ID`                    | Your Apple Developer account email address                                      | Apple ID / Developer Portal                                       |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password generated for notarization                                | [appleid.apple.com](https://appleid.apple.com)                    |
| `APPLE_TEAM_ID`               | 10-character Apple Developer Team ID                                            | [Apple Developer Membership](https://developer.apple.com/account) |

> [!NOTE]
> Notarization is coordinated through [scripts/notarize.cjs](../scripts/notarize.cjs) via `@electron/notarize`. The script checks for `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID` before invoking notarization.

---

## 4. How to Release

### Automated Release (Recommended)

1. Update `"version"` in [`package.json`](../package.json).
2. Push your changes to `main`.
3. In GitHub, go to **Releases > Draft a new release**.
4. Create a tag (e.g. `v0.1.0`), enter release notes, and click **Publish release**.
5. The `Release macOS` workflow will automatically trigger, build the `arm64` and `x64` DMGs, and upload them to the published release.

### Manual Workflow Dispatch

You can also build DMGs manually at any time:

1. Go to the **Actions** tab on GitHub.
2. Select **Release macOS** in the sidebar.
3. Click **Run workflow**.
4. (Optional) Provide a `release_tag` (e.g., `v0.1.0`) if you want the generated DMGs attached to an existing release. If left empty, the DMGs will be uploaded as downloadable GitHub Actions run artifacts.
