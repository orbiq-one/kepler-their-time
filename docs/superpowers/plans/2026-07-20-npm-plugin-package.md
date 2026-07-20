# Their Time npm Plugin Package Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish `@kepler-app/their-time-plugin@1.0.0` as a ready-to-install Kepler API v1 plugin built with `@kepler-app/plugin-sdk@1.0.0`.

**Architecture:** The SDK CLI compiles the TypeScript contribution into the two host artifacts under `dist/`. npm distributes only that directory plus package metadata, whose `kepler` block tells the app where the manifest and entry point live.

**Tech Stack:** TypeScript 5.9, pnpm 10, `@kepler-app/plugin-sdk` 1.0, tsup 8, npm registry.

## Global Constraints

- Package name: `@kepler-app/their-time-plugin`.
- Package and plugin version: `1.0.0`.
- Kepler package API version: `1`.
- Published runtime files: `dist/index.js` and `dist/manifest.json`.
- npm access: public.
- Runtime remains JavaScriptCore-compatible with no Node or DOM dependencies.
- Do not change `@kepler-app/plugin-sdk` for this release.

---

### Task 1: Define and verify the npm plugin package

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `.gitignore`
- Verify: `src/index.ts`

**Interfaces:**
- Consumes: `kepler-plugin bundle <entry> --out <directory>` from SDK 1.0.
- Produces: package metadata `kepler: { apiVersion: 1, manifest: "dist/manifest.json", entry: "dist/index.js" }` and a production `dist/` bundle.

- [ ] **Step 1: Update the package contract**

Set the dependency and publication fields in `package.json`:

```json
{
  "name": "@kepler-app/their-time-plugin",
  "version": "1.0.0",
  "description": "See local times of friends across timezones in Kepler.",
  "type": "module",
  "keywords": ["kepler", "kepler-plugin", "launcher", "timezone"],
  "files": ["dist"],
  "kepler": {
    "apiVersion": 1,
    "manifest": "dist/manifest.json",
    "entry": "dist/index.js"
  },
  "publishConfig": { "access": "public" },
  "scripts": {
    "build": "kepler-plugin bundle src/index.ts --out dist",
    "install:local": "kepler-plugin bundle src/index.ts --out \"$HOME/Library/Application Support/Kepler/Plugins/their-time.keplugin\"",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "pnpm run typecheck && pnpm run build"
  },
  "dependencies": {
    "@kepler-app/plugin-sdk": "1.0.0"
  }
}
```

Add `dist/` to `.gitignore` because it is reproducible publication output.

- [ ] **Step 2: Install the exact SDK release and update the lockfile**

Run: `pnpm install --save-exact @kepler-app/plugin-sdk@1.0.0`

Expected: `pnpm-lock.yaml` resolves `@kepler-app/plugin-sdk` to `1.0.0` and installation succeeds without peer dependency errors.

- [ ] **Step 3: Verify source compatibility**

Run: `pnpm run typecheck`

Expected: PASS. If SDK 1.0 identifies an incompatibility, make the smallest type-safe change in `src/index.ts` while preserving plugin behavior, then rerun the command.

- [ ] **Step 4: Build the publishable artifacts**

Run: `pnpm run build`

Expected: `dist/index.js` and `dist/manifest.json` exist. The manifest has ID `re.leob.TheirTime`, version `1.0.0`, an empty permissions array, and one search-mode contribution.

- [ ] **Step 5: Validate the npm tarball**

Run: `npm pack --dry-run --json --ignore-scripts`

Expected: the file list contains `package.json`, `LICENSE`, `dist/index.js`, and `dist/manifest.json`, with no `src/`, `node_modules/`, or TypeScript configuration files.

- [ ] **Step 6: Commit the package changes**

```bash
git add package.json pnpm-lock.yaml .gitignore src/index.ts
git commit -m "build: package Their Time for npm"
```

Only add `src/index.ts` if SDK compatibility required a source edit.

### Task 2: Publish and confirm version 1.0.0

**Files:**
- No source files modified.

**Interfaces:**
- Consumes: the verified npm package from Task 1 and the authenticated npm account.
- Produces: public registry package `@kepler-app/their-time-plugin@1.0.0`.

- [ ] **Step 1: Confirm npm identity and version availability**

Run: `npm whoami`

Expected: an authenticated npm username with permission to publish under `@kepler-app`.

Run: `npm view @kepler-app/their-time-plugin@1.0.0 version --json`

Expected before first publication: npm returns `E404`.

- [ ] **Step 2: Publish the scoped package publicly**

Run: `npm publish --access public`

Expected: npm reports `+ @kepler-app/their-time-plugin@1.0.0`.

- [ ] **Step 3: Verify registry metadata**

Run: `npm view @kepler-app/their-time-plugin@1.0.0 name version keywords kepler dist.tarball --json`

Expected: name and version match exactly, keywords contain `kepler-plugin`, `kepler.apiVersion` is `1`, and both artifact paths point into `dist/`.

- [ ] **Step 4: Confirm repository state**

Run: `git status --short`

Expected: no uncommitted source changes; `dist/` remains ignored.
